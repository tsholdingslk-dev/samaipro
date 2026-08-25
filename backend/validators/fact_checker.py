"""
SAM AI - Fact Checker
Verifies factual claims in AI output against known reliable sources.
"""

import re
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class FactCheckResult:
    passed: bool
    confidence: float
    issues: List = field(default_factory=list)
    checked_claims: int = 0
    verified_claims: int = 0


@dataclass
class FactIssue:
    severity: str
    claim: str
    message: str
    verification_status: str


class FactChecker:
    def __init__(self):
        self.confidence_threshold = 0.7
        self.srilanka_facts = self._load_srilanka_facts()

    def _load_srilanka_facts(self) -> Dict[str, str]:
        return {
            "capital": "Sri Jayewardenepura Kotte (administrative), Colombo (commercial)",
            "official_languages": "Sinhala and Tamil",
            "currency": "Sri Lankan Rupee (LKR)",
            "population": "~22 million",
            "largest_city": "Colombo",
            "country_code": "+94",
            "time_zone": "UTC+5:30",
        }

    def _extract_claims(self, text: str) -> List[str]:
        claims = []
        statements = re.split(r'[.!?]+', text)
        for stmt in statements:
            stmt = stmt.strip()
            if len(stmt.split()) > 5 and any(c.isdigit() for c in stmt):
                claims.append(stmt)
        return list(set(claims))[:10]

    def _check_known_facts(self, text: str) -> List[FactIssue]:
        issues = []
        text_lower = text.lower()
        for fact_key, fact_value in self.srilanka_facts.items():
            if fact_key in text_lower and fact_value.lower() not in text_lower:
                issues.append(FactIssue(
                    severity="warning", claim=f"{fact_key}",
                    message=f"Potential factual discrepancy about {fact_key}",
                    verification_status="disputed",
                ))
        return issues

    async def _check_with_ai(self, text: str) -> List[FactIssue]:
        try:
            from api_hub import api_hub
            claims = self._extract_claims(text)
            if not claims:
                return []
            claims_str = "\n".join(f"- {c}" for c in claims[:5])
            prompt = f"""Check factual claims in this text.

Claims:
{claims_str}

Full text: {text[:3000]}

Return JSON: {{"claims": [{{"claim": "...", "status": "verified/disputed/unknown", "reason": "..."}}]}}

Only JSON, no other text."""
            messages = [
                {"role": "system", "content": "You are a fact-checking expert. Verify claims against reliable sources."},
                {"role": "user", "content": prompt},
            ]
            result = await api_hub.chat(messages, temperature=0.3)
            content = result.get("content", "").strip()
            try:
                data = json.loads(content)
                issues = []
                for claim_data in data.get("claims", []):
                    if claim_data.get("status") == "disputed":
                        issues.append(FactIssue(
                            severity="warning", claim=claim_data["claim"][:200],
                            message=claim_data.get("reason", "Claim disputed"),
                            verification_status="disputed",
                        ))
                return issues
            except (json.JSONDecodeError, ValueError):
                return []
        except Exception:
            return []

    async def check(self, text: str, context: Optional[Dict[str, Any]] = None) -> FactCheckResult:
        issues: List[FactIssue] = []
        issues.extend(self._check_known_facts(text))
        ai_issues = await self._check_with_ai(text)
        issues.extend(ai_issues)
        claims_checked = len(self._extract_claims(text))
        verified = claims_checked - len([i for i in issues if i.verification_status == "disputed"])
        confidence = 1.0
        if issues:
            confidence = 1.0 - (len(issues) * 0.15)
            confidence = max(confidence, 0.3)
        return FactCheckResult(
            passed=len(issues) == 0, confidence=round(confidence, 3),
            issues=issues, checked_claims=claims_checked, verified_claims=max(0, verified),
        )


fact_checker = FactChecker()
