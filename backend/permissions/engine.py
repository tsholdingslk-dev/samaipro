"""
SAM AI - Permission Engine
Evaluates: User → Role → Module → Action → Time Limit → Usage Limit
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from sqlalchemy.orm import Session
import models
import json


@dataclass
class PermissionCheckResult:
    allowed: bool
    user_id: str
    module: str
    action: str
    role: Optional[str] = None
    role_permissions: List[str] = field(default_factory=list)
    grants: List[Dict[str, Any]] = field(default_factory=list)
    usage_count: int = 0
    usage_limit: int = 0
    time_limit_hours: int = 0
    expires_at: Optional[datetime] = None
    denial_reason: Optional[str] = None
    warnings: List[str] = field(default_factory=list)


class PermissionEngine:
    def __init__(self):
        self._role_cache: Dict[str, Set[str]] = {}
        self._permission_cache: Dict[str, Set[str]] = {}
        self._cache_ttl = 300
        self._cache_time: Dict[str, datetime] = {}

    def _clear_cache_for_user(self, user_id: str):
        keys_to_remove = [k for k in self._role_cache.keys() if k.startswith(user_id)]
        for k in keys_to_remove:
            self._role_cache.pop(k, None)
            self._permission_cache.pop(k, None)
            self._cache_time.pop(k, None)

    def _is_cache_valid(self, key: str) -> bool:
        cached_at = self._cache_time.get(key)
        if not cached_at:
            return False
        return (datetime.utcnow() - cached_at).total_seconds() < self._cache_ttl

    def get_user_roles(self, db: Session, user_id: str) -> List[str]:
        cache_key = f"{user_id}:roles"
        if cache_key in self._role_cache and self._is_cache_valid(cache_key):
            return list(self._role_cache[cache_key])

        user_roles = db.query(models.UserRole).filter(
            models.UserRole.user_id == user_id,
            models.UserRole.is_active == True,
        ).all()

        roles = []
        for ur in user_roles:
            if ur.expires_at and ur.expires_at < datetime.utcnow():
                continue
            role = db.query(models.PermissionRole).filter(
                models.PermissionRole.id == ur.role_id
            ).first()
            if role:
                roles.append(role.name)

        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and user.role:
            if user.role not in roles:
                roles.append(user.role)

        self._role_cache[cache_key] = set(roles)
        self._cache_time[cache_key] = datetime.utcnow()
        return roles

    def get_role_permissions(self, db: Session, role_names: List[str]) -> Set[str]:
        cache_key = "role_perms:" + "|".join(sorted(role_names))
        if cache_key in self._permission_cache and self._is_cache_valid(cache_key):
            return self._permission_cache[cache_key]

        permissions: Set[str] = set()

        for role_name in role_names:
            role = db.query(models.PermissionRole).filter(
                models.PermissionRole.name == role_name
            ).first()
            if not role:
                continue

            role_perms = db.query(models.RolePermission).filter(
                models.RolePermission.role_id == role.id
            ).all()

            for rp in role_perms:
                perm = db.query(models.Permission).filter(
                    models.Permission.id == rp.permission_id
                ).first()
                if perm:
                    perm_str = f"{perm.module}:{perm.action}"
                    permissions.add(perm_str)

        system_perms = db.query(models.Permission).filter(
            models.Permission.is_system == True
        ).all()
        for perm in system_perms:
            perm_str = f"{perm.module}:{perm.action}"
            if role_name in ("admin",) or role_name.startswith("admin"):
                permissions.add(perm_str)

        self._permission_cache[cache_key] = permissions
        self._cache_time[cache_key] = datetime.utcnow()
        return permissions

    def check_permission(
        self,
        db: Session,
        user_id: str,
        module: str,
        action: str = "read",
    ) -> PermissionCheckResult:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            return PermissionCheckResult(
                allowed=False,
                user_id=user_id,
                module=module,
                action=action,
                denial_reason="User not found",
            )

        roles = self.get_user_roles(db, user_id)
        role_permissions = self.get_role_permissions(db, roles)

        all_perms = set(role_permissions)
        perm_str = f"{module}:{action}"
        perm_str_wildcard = f"{module}:*"
        wildcard_all = f"*:*"

        has_role_permission = (
            perm_str in all_perms
            or perm_str_wildcard in all_perms
            or wildcard_all in all_perms
            or (user.role == "admin" and f"{module}:{action}" not in all_perms and f"{module}:*" not in all_perms)
        )

        # Check if admin (always allowed)
        is_admin = user.role == "admin"
        if is_admin:
            has_role_permission = True

        # Check explicit grants
        grants = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.user_id == user_id,
            models.PermissionGrant.module == module,
            models.PermissionGrant.action == action,
            models.PermissionGrant.is_active == True,
            models.PermissionGrant.expires_at > datetime.utcnow(),
        ).all()

        active_grants = []
        for grant in grants:
            if grant.time_limit_hours > 0:
                period_end = grant.period_start + timedelta(hours=grant.time_limit_hours)
                if datetime.utcnow() > period_end:
                    continue
            active_grants.append(grant)

        # Check usage limits from grants
        usage_exceeded = False
        grant_limit = 0
        for grant in active_grants:
            if grant.usage_limit > 0 and grant.current_usage >= grant.usage_limit:
                usage_exceeded = True
                grant_limit = grant.usage_limit

        # Check daily quota
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        quota = db.query(models.UsageQuota).filter(
            models.UsageQuota.user_id == user_id,
            models.UsageQuota.module == module,
            models.UsageQuota.action == action,
            models.UsageQuota.date >= today,
        ).first()

        quota_exceeded = False
        quota_limit = 0
        if quota and quota.limit > 0 and quota.count >= quota.limit:
            quota_exceeded = True
            quota_limit = quota.limit

        warnings = []
        if usage_exceeded:
            warnings.append(f"Usage limit ({grant_limit}) exceeded on grant")
        if quota_exceeded:
            warnings.append(f"Daily quota ({quota_limit}) exceeded")
        if active_grants:
            g = active_grants[0]
            if g.time_limit_hours == 0 and g.expires_at:
                time_left = g.expires_at - datetime.utcnow()
                if time_left < timedelta(hours=1):
                    warnings.append(f"Grant expires in {(time_left.total_seconds()/3600):.1f} hours")

        allowed = has_role_permission or len(active_grants) > 0

        if allowed and (usage_exceeded or quota_exceeded):
            allowed = False

        denial_reason = None
        if not allowed:
            if usage_exceeded:
                denial_reason = f"Usage limit ({grant_limit}) exceeded"
            elif quota_exceeded:
                denial_reason = f"Daily quota ({quota_limit}) exceeded"
            elif not has_role_permission and not active_grants:
                denial_reason = f"No permission for {module}:{action}"
            else:
                denial_reason = "Access denied"

        return PermissionCheckResult(
            allowed=allowed,
            user_id=user_id,
            module=module,
            action=action,
            role=user.role,
            role_permissions=list(role_permissions),
            grants=[{"id": g.id, "usage_limit": g.usage_limit, "current_usage": g.current_usage,
                     "time_limit_hours": g.time_limit_hours, "expires_at": g.expires_at.isoformat() if g.expires_at else None}
                    for g in active_grants],
            usage_count=quota.count if quota else 0,
            usage_limit=quota_limit if quota_exceeded else (grant_limit if active_grants else 0),
            time_limit_hours=active_grants[0].time_limit_hours if active_grants else 0,
            expires_at=active_grants[0].expires_at if active_grants else None,
            denial_reason=denial_reason,
            warnings=warnings,
        )

    def increment_usage(self, db: Session, user_id: str, module: str, action: str = "read") -> int:
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        quota = db.query(models.UsageQuota).filter(
            models.UsageQuota.user_id == user_id,
            models.UsageQuota.module == module,
            models.UsageQuota.action == action,
            models.UsageQuota.date >= today,
        ).first()

        if quota:
            quota.count += 1
            db.commit()
            return quota.count
        else:
            new_quota = models.UsageQuota(
                user_id=user_id,
                module=module,
                action=action,
                date=today,
                count=1,
                limit=0,
            )
            db.add(new_quota)
            db.commit()
            return 1

    def get_user_permissions(self, db: Session, user_id: str) -> Dict[str, Any]:
        roles = self.get_user_roles(db, user_id)
        perms = self.get_role_permissions(db, roles)

        grants = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.user_id == user_id,
            models.PermissionGrant.is_active == True,
            models.PermissionGrant.expires_at > datetime.utcnow(),
        ).all()

        return {
            "user_id": user_id,
            "roles": roles,
            "role_permissions": sorted(list(perms)),
            "grants": [
                {
                    "module": g.module,
                    "action": g.action,
                    "usage_limit": g.usage_limit,
                    "current_usage": g.current_usage,
                    "time_limit_hours": g.time_limit_hours,
                    "expires_at": g.expires_at.isoformat(),
                }
                for g in grants
            ],
        }

    def clear_cache(self):
        self._role_cache.clear()
        self._permission_cache.clear()
        self._cache_time.clear()

    def seed_default_roles_and_permissions(self, db: Session):
        default_perms = [
            ("chat", "read", "Send and receive chat messages"),
            ("chat", "write", "Send and receive chat messages"),
            ("chat", "history", "View chat history"),
            ("coding", "read", "View generated code"),
            ("coding", "write", "Generate and modify code"),
            ("coding", "execute", "Execute code in sandbox"),
            ("image", "read", "View generated images"),
            ("image", "write", "Generate images"),
            ("image", "analyze", "Analyze images with vision"),
            ("voice", "read", "View voice/tts content"),
            ("voice", "write", "Generate text-to-speech"),
            ("translate", "read", "View translations"),
            ("translate", "write", "Translate text"),
            ("knowledge", "read", "Query knowledge base"),
            ("knowledge", "write", "Add to knowledge base"),
            ("knowledge", "train", "Admin-level knowledge training"),
            ("research", "read", "View research results"),
            ("research", "write", "Conduct research"),
            ("media", "read", "View media content"),
            ("media", "write", "Generate media content"),
            ("agents", "read", "View agent status"),
            ("agents", "write", "Run agent tasks"),
            ("agents", "execute", "Execute agent workflows"),
            ("analytics", "read", "View analytics data"),
            ("analytics", "write", "Modify analytics"),
            ("api_keys", "read", "View API keys"),
            ("api_keys", "write", "Create API keys"),
            ("security", "read", "View security status"),
            ("security", "write", "Modify security settings"),
            ("orchestrator", "read", "View routing info"),
            ("orchestrator", "write", "Execute orchestrated tasks"),
        ]

        existing = {p.name for p in db.query(models.Permission).all()}
        for module, action, desc in default_perms:
            perm_name = f"{module}:{action}"
            if perm_name not in existing:
                perm = models.Permission(
                    name=perm_name,
                    module=module,
                    action=action,
                    description=desc,
                    is_system=True,
                )
                db.add(perm)
                existing.add(perm_name)

        default_roles = [
            ("admin", "Full system access", True),
            ("staff", "Staff access to core modules", True),
            ("student", "Basic chat and learning access", True),
            ("teacher", "Educational content access", True),
            ("creator", "Content creation tools", True),
        ]

        for role_name, desc, is_system in default_roles:
            existing_role = db.query(models.PermissionRole).filter(
                models.PermissionRole.name == role_name
            ).first()
            if not existing_role:
                role = models.PermissionRole(
                    name=role_name,
                    description=desc,
                    is_system=is_system,
                )
                db.add(role)
                db.commit()
                db.refresh(role)

                if role_name == "admin":
                    all_perms = db.query(models.Permission).all()
                    for perm in all_perms:
                        rp = models.RolePermission(role_id=role.id, permission_id=perm.id)
                        db.add(rp)
                elif role_name == "staff":
                    staff_perms = ["chat:*", "translate:*", "knowledge:read", "knowledge:write",
                                   "voice:*", "agents:execute", "analytics:read", "image:read"]
                    for perm_str in staff_perms:
                        if ":" in perm_str:
                            m, a = perm_str.split(":", 1)
                            if a == "*":
                                perms = db.query(models.Permission).filter(
                                    models.Permission.module == m
                                ).all()
                                for p in perms:
                                    rp = models.RolePermission(role_id=role.id, permission_id=p.id)
                                    db.add(rp)
                            else:
                                perm = db.query(models.Permission).filter(
                                    models.Permission.module == m,
                                    models.Permission.action == a,
                                ).first()
                                if perm:
                                    rp = models.RolePermission(role_id=role.id, permission_id=perm.id)
                                    db.add(rp)
                elif role_name == "student":
                    student_perms = ["chat:read", "chat:write", "translate:read", "translate:write",
                                     "knowledge:read", "image:read", "voice:read", "analytics:read"]
                    for perm_str in student_perms:
                        m, a = perm_str.split(":", 1)
                        perm = db.query(models.Permission).filter(
                            models.Permission.module == m,
                            models.Permission.action == a,
                        ).first()
                        if perm:
                            rp = models.RolePermission(role_id=role.id, permission_id=perm.id)
                            db.add(rp)

        db.commit()


permission_engine = PermissionEngine()
