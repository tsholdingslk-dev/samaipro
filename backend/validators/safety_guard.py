"""
SAM AI - Safety Guard
Checks AI output for harmful, biased, or inappropriate content.
"""

from typing import List
from dataclasses import dataclass, field
import re


@dataclass
class SafetyResult:
    passed: bool
    confidence: float
    issues: List = field(default_factory=list)
    flags: List[str] = field(default_factory=list)


@dataclass
class SafetyIssue:
    severity: str
    category: str
    message: str
    matched_text: str = ""


class SafetyGuard:
    def __init__(self):
        self.blocked_patterns = [
            ("self_harm", re.compile(r"kill\s+(yourself|myself|himself|herself|themselves)", re.IGNORECASE), "critical"),
            ("suicide_methods", re.compile(r"(how to|ways to|method.*kill.*suicide)", re.IGNORECASE), "critical"),
            ("violence", re.compile(r"(detailed instructions.*kill|how to make.*weapon|explosive.*instructions)", re.IGNORECASE), "critical"),
            ("illicit_content", re.compile(r"(how to.*illegal|illegal.*drug.*manufacture|tax.*evasion.*scheme)", re.IGNORECASE), "critical"),
            ("personal_data", re.compile(r"(ssn|social security|credit card.*number|bank.*account.*number)", re.IGNORECASE), "warning"),
        ]

    def check(self, output: str, intent_category: str = "general") -> SafetyResult:
        issues: List[SafetyIssue] = []
        flags: List[str] = []
        confidence = 1.0

        for name, pattern, severity in self.blocked_patterns:
            matches = pattern.findall(output)
            if matches:
                issues.append(SafetyIssue(
                    severity=severity,
                    category=name,
                    message=f"Blocked content pattern detected: {name}",
                    matched_text=str(matches[:3]),
                ))
                flags.append(name)
                confidence *= 0.3 if severity == "critical" else 0.7

        if intent_category in ("medical", "health"):
            if "disclaimer" not in output.lower() and "consult" not in output.lower():
                issues.append(SafetyIssue(
                    severity="warning", category="medical_disclaimer",
                    message="Medical advice without disclaimer detected"
                ))
                flags.append("medical_disclaimer_missing")
                confidence *= 0.8

        if intent_category in ("legal",):
            if "not legal advice" not in output.lower():
                issues.append(SafetyIssue(
                    severity="warning", category="legal_disclaimer",
                    message="Legal advice without disclaimer detected"
                ))
                flags.append("legal_disclaimer_missing")
                confidence *= 0.85

        if intent_category in ("financial",):
            if "not financial advice" not in output.lower() and "not investing advice" not in output.lower():
                issues.append(SafetyIssue(
                    severity="warning", category="financial_disclaimer",
                    message="Financial advice without disclaimer detected"
                ))
                flags.append("financial_disclaimer_missing")
                confidence *= 0.85

        passed = len([i for i in issues if i.severity == "critical"]) == 0

        return SafetyResult(
            passed=passed,
            confidence=round(min(confidence, 1.0), 3),
            issues=issues,
            flags=flags,
        )


safety_guard = SafetyGuard()
