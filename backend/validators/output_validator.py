"""
SAM AI - Output Validator
Validates AI output for schema correctness, factual consistency, and safety.
Implements automatic retry/repair loop: AI Output → Check → Retry/Repair → Final Output
"""

import time
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class CheckType(str, Enum):
    FACT_CHECK = "fact_check"
    SCHEMA = "schema"
    SAFETY = "safety"
    LENGTH = "length"
    COMPLETENESS = "completeness"
    FORMAT = "format"


@dataclass
class ValidationIssue:
    check_type: CheckType
    severity: str  # "warning", "error", "critical"
    message: str
    repair_suggestion: Optional[str] = None
    field_name: Optional[str] = None


@dataclass
class ValidationResult:
    passed: bool
    output: str
    issues: List[ValidationIssue] = field(default_factory=list)
    checks_performed: List[str] = field(default_factory=list)
    repairs_applied: int = 0
    final_status: str = "passed"
    confidence: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)


class OutputValidator:
    def __init__(self):
        from validators.safety_guard import safety_guard
        from validators.fact_checker import fact_checker
        from validators.schema_validator import schema_validator
        self.safety_guard = safety_guard
        self.fact_checker = fact_checker
        self.schema_validator = schema_validator
        self.max_repairs = 3

    async def validate(
        self,
        output: str,
        intent_category: str = "general",
        module: str = "general",
        schema: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> ValidationResult:
        result = ValidationResult(
            passed=True,
            output=output,
            checks_performed=[],
        )

        # 1. Safety Check
        safety_result = self.safety_guard.check(output, intent_category)
        result.checks_performed.append("safety_check")
        for issue in safety_result.issues:
            result.issues.append(issue)
        result.confidence *= safety_result.confidence

        # 2. Length Check
        length_result = self._check_length(output)
        result.checks_performed.append("length_check")
        for issue in length_result.issues:
            result.issues.append(issue)

        # 3. Completeness Check
        completeness_result = self._check_completeness(output)
        result.checks_performed.append("completeness_check")
        for issue in completeness_result.issues:
            result.issues.append(issue)

        # 4. Schema Check (if applicable)
        if schema:
            schema_result = self.schema_validator.validate(output, schema, intent_category)
            result.checks_performed.append("schema_check")
            for issue in schema_result.issues:
                result.issues.append(issue)
            result.confidence *= schema_result.confidence

        # 5. Fact Check (for research/knowledge intents)
        if intent_category in ("research", "knowledge") and len(output) > 50:
            fact_result = await self.fact_checker.check(output, context)
            result.checks_performed.append("fact_check")
            for issue in fact_result.issues:
                result.issues.append(issue)
            result.confidence *= fact_result.confidence

        # 6. Format Check
        format_result = self._check_format(output, intent_category, module)
        result.checks_performed.append("format_check")
        for issue in format_result.issues:
            result.issues.append(issue)

        # Determine if any critical issues
        critical_issues = [i for i in result.issues if i.severity == "critical"]
        error_issues = [i for i in result.issues if i.severity == "error"]

        if critical_issues:
            result.passed = False
            result.final_status = "failed"
        elif error_issues:
            result.passed = False
            result.final_status = "needs_repair"
        elif result.issues:
            result.final_status = "warning"

        result.confidence = round(result.confidence, 3)
        return result

    async def validate_with_repair(
        self,
        output: str,
        intent_category: str = "general",
        module: str = "general",
        schema: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        repair_fn=None,
    ) -> ValidationResult:
        result = await self.validate(output, intent_category, module, schema, context)

        if result.passed and result.final_status not in ("needs_repair", "failed", "warning"):
            return result

        repairs_attempted = 0
        current_output = output

        while repairs_attempted < self.max_repairs and not result.passed:
            repair_prompt = self._generate_repair_prompt(result, intent_category)

            if repair_fn:
                current_output = await repair_fn(repair_prompt, current_output)
            else:
                from api_hub import api_hub
                messages = [
                    {"role": "system", "content": f"Repairs needed: {repair_prompt}"},
                    {"role": "user", "content": f"Original output:\n{current_output}\n\nRepair the issues: {repair_prompt}"},
                ]
                repair_result = await api_hub.chat(messages, temperature=0.5)
                current_output = repair_result["content"]

            repairs_attempted += 1
            result.repairs_applied = repairs_attempted

            new_result = await self.validate(current_output, intent_category, module, schema, context)
            new_result.repairs_applied = repairs_attempted

            if new_result.passed:
                new_result.output = self._clean_output(new_result.output)
                return new_result

            if len(new_result.issues) < len(result.issues):
                result = new_result
                result.output = current_output
            else:
                result.output = current_output
                break

        result.output = self._clean_output(result.output)
        return result

    def _check_length(self, output: str) -> ValidationResult:
        issues = []
        if len(output) == 0:
            issues.append(ValidationIssue(CheckType.LENGTH, "critical", "Empty response"))
        elif len(output) < 10:
            issues.append(ValidationIssue(CheckType.LENGTH, "error", "Response too short"))
        elif len(output) > 100000:
            issues.append(ValidationIssue(CheckType.LENGTH, "warning", "Response is very long"))
        return ValidationResult(passed=len(issues) == 0, output=output, issues=issues)

    def _check_completeness(self, output: str) -> ValidationResult:
        issues = []
        if "..." in output and output.rstrip().endswith("..."):
            issues.append(ValidationIssue(CheckType.COMPLETENESS, "warning", "Response appears truncated"))
        if output.count("{") > output.count("}"):
            issues.append(ValidationIssue(CheckType.COMPLETENESS, "error", "Unbalanced braces - possible JSON truncation"))
        if output.count("[") > output.count("]"):
            issues.append(ValidationIssue(CheckType.COMPLETENESS, "error", "Unbalanced brackets - possible list truncation"))
        return ValidationResult(passed=len(issues) == 0, output=output, issues=issues)

    def _check_format(self, output: str, intent_category: str, module: str) -> ValidationResult:
        issues = []

        if intent_category in ("coding", "flutter_build", "automation"):
            code_blocks = output.count("```")
            if "code" in output.lower() and code_blocks < 2:
                issues.append(ValidationIssue(
                    CheckType.FORMAT, "warning",
                    "Code detected without proper markdown code block",
                    repair_suggestion="Wrap code in ```language blocks"
                ))

        if intent_category == "translation":
            if output.startswith("```") or "```" in output:
                issues.append(ValidationIssue(
                    CheckType.FORMAT, "warning",
                    "Translation output contains code blocks which may not be desired"
                ))

        if intent_category == "image_generation":
            if not any(kw in output.lower() for kw in ["prompt", "generated", "image", "created"]):
                issues.append(ValidationIssue(CheckType.FORMAT, "info", "Image generation output should describe the generated image"))

        return ValidationResult(passed=len(issues) == 0, output=output, issues=issues)

    def _generate_repair_prompt(self, result: ValidationResult, intent_category: str) -> str:
        issue_descs = []
        for issue in result.issues:
            issue_descs.append(f"[{issue.severity}] {issue.check_type}: {issue.message}")
            if issue.repair_suggestion:
                issue_descs.append(f"  Suggestion: {issue.repair_suggestion}")

        return f"Fix these issues: {'; '.join(issue_descs)}"

    def _clean_output(self, output: str) -> str:
        output = output.strip()
        if output.startswith('"') and output.endswith('"'):
            output = output[1:-1]
        output = re.sub(r'\n{3,}', '\n\n', output)
        return output


validation_pipeline = OutputValidator()
