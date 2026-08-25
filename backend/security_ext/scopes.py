"""
SAM AI - API Scopes Engine
Enables fine-grained scope-based access control beyond simple roles.
Supports scopes like: chat:read, image:write, admin:users, etc.
"""

import re
from typing import Dict, List, Set, Optional, Any
from functools import wraps
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
import models
from security import get_current_user


class ScopeEngine:
    def __init__(self):
        self.scopes: Dict[str, Set[str]] = {}
        self._load_default_scopes()

    def _load_default_scopes(self):
        default_scopes = {
            "chat": ["chat:read", "chat:write", "chat:history"],
            "coding": ["code:read", "code:write", "code:execute"],
            "image": ["image:read", "image:write", "image:analyze"],
            "voice": ["voice:read", "voice:write"],
            "translate": ["translate:read", "translate:write"],
            "knowledge": ["knowledge:read", "knowledge:write", "knowledge:train"],
            "research": ["research:read", "research:write"],
            "media": ["media:read", "media:write"],
            "admin": ["admin:*", "users:read", "users:write", "users:delete"],
            "staff": ["staff:*", "modules:read", "modules:write"],
            "agents": ["agents:read", "agents:write", "agents:execute"],
            "analytics": ["analytics:read", "analytics:write"],
            "api_keys": ["api_keys:read", "api_keys:write"],
            "security": ["security:read", "security:write"],
        }
        for category, scope_list in default_scopes.items():
            self.scopes[category] = set(scope_list)

    def expand_scopes(self, user_scopes: List[str]) -> Set[str]:
        expanded: Set[str] = set()
        for scope in user_scopes:
            if scope.endswith("*"):
                category = scope.replace(":*", "")
                if category in self.scopes:
                    expanded.update(self.scopes[category])
                expanded.add(scope)
            else:
                expanded.add(scope)
        return expanded

    def check_scope(self, user_scopes: List[str], required_scope: str) -> bool:
        expanded = self.expand_scopes(user_scopes)
        if required_scope in expanded:
            return True
        if "*:*" in expanded:
            return True
        if required_scope.startswith("admin:") and "admin:*" in expanded:
            return True
        parts = required_scope.split(":")
        if len(parts) == 2:
            if f"{parts[0]}:*" in expanded:
                return True
        for s in expanded:
            if s.split(":")[0] == required_scope.split(":")[0] and s.split(":")[-1] == "*":
                return True
        return False

    def get_user_scopes(self, db: Session, user_id: str) -> List[str]:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return []

        role_to_scopes = {
            "admin": ["admin:*", "chat:*", "coding:*", "image:*", "voice:*", "translate:*",
                      "knowledge:*", "research:*", "media:*", "agents:*", "analytics:*",
                      "api_keys:*", "security:*", "staff:*"],
            "staff": ["chat:*", "coding:read", "image:read", "voice:*", "translate:*",
                      "knowledge:*", "research:read", "analytics:read"],
            "student": ["chat:read", "chat:write", "translate:read", "translate:write",
                        "knowledge:read", "image:read", "voice:read"],
            "teacher": ["chat:*", "knowledge:*", "translate:*", "education:*"],
            "creator": ["chat:*", "content:*", "image:*", "media:*", "agents:*"],
        }

        scopes = role_to_scopes.get(user.role, role_to_scopes["student"])

        api_key = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.user_id == user_id,
            models.UserAPIKey.revoked == False,
        ).first()
        if api_key and api_key.scopes:
            try:
                import json
                key_scopes = json.loads(api_key.scopes)
                if key_scopes:
                    scopes = list(set(scopes + key_scopes))
            except (json.JSONDecodeError, TypeError):
                pass

        return scopes

    def add_scope(self, name: str, permissions: List[str], description: str = ""):
        self.scopes[name] = set(permissions)

    def get_all_scopes(self) -> Dict[str, List[str]]:
        return {k: sorted(v) for k, v in self.scopes.items()}


scope_engine = ScopeEngine()


class APIScopeChecker:
    def __init__(self, required_scopes: List[str]):
        self.required_scopes = required_scopes
        self.scope_engine = scope_engine

    def __call__(
        self,
        request: Request,
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if not self.required_scopes:
            return current_user

        user_scopes = self.scope_engine.get_user_scopes(db, current_user["user_id"])

        for required in self.required_scopes:
            if not self.scope_engine.check_scope(user_scopes, required):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient scope. Required: {required}",
                )
        return current_user


def require_scope(*scopes: str):
    def scope_dependency(
        request: Request,
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if not scopes:
            return current_user

        user_scopes = scope_engine.get_user_scopes(db, current_user["user_id"])
        missing = []
        for required in scopes:
            if not scope_engine.check_scope(user_scopes, required):
                missing.append(required)

        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient scope. Missing: {', '.join(missing)}",
            )
        return current_user

    return Depends(scope_dependency)
