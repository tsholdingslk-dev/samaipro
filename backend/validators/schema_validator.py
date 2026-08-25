"""
SAM AI - Schema Validator
Validates AI output against expected JSON schemas and structure.
"""

import json
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class SchemaResult:
    passed: bool
    confidence: float
    issues: List = field(default_factory=list)
    extracted_data: Optional[Dict] = None


@dataclass
class SchemaIssue:
    severity: str
    field_name: str
    message: str


class SchemaValidator:
    def __init__(self):
        self.common_schemas = {
        }

    def validate(self, output: str, schema: Dict[str, Any], intent_category: str = "general") -> SchemaResult:
        issues: List[SchemaIssue] = []
        confidence = 1.0

        extracted_data = None
        json_output = None

        code_block_match = re.search(r'```(?:json)?\s*\n(.*?)\n```', output, re.DOTALL)
        if code_block_match:
            try:
                json_output = json.loads(code_block_match.group(1))
                extracted_data = json_output
            except json.JSONDecodeError:
                inline_json = re.search(r'\{.*\}', output, re.DOTALL)
                if inline_json:
                    try:
                        json_output = json.loads(inline_json.group(0))
                        extracted_data = json_output
                    except json.JSONDecodeError as e:
                        issues.append(SchemaIssue(
                            severity="error", field_name="json",
                            message=f"Invalid JSON: {str(e)[:100]}"
                        ))
                        confidence *= 0.5
        else:
            inline_json = re.search(r'\{.*\}', output, re.DOTALL)
            if inline_json:
                try:
                    json_output = json.loads(inline_json.group(0))
                    extracted_data = json_output
                except json.JSONDecodeError as e:
                    if intent_category in ("knowledge", "coding"):
                        issues.append(SchemaIssue(
                            severity="error", field_name="json",
                            message=f"JSON parsing failed: {str(e)[:150]}"
                        ))
                        confidence *= 0.4

        if schema and extracted_data is not None:
            required_fields = schema.get("required", [])
            properties = schema.get("properties", {})

            for field in required_fields:
                if field not in extracted_data:
                    issues.append(SchemaIssue(
                        severity="error", field_name=field,
                        message=f"Required field '{field}' is missing"
                    ))
                    confidence *= 0.8

            for field, value in extracted_data.items():
                if field in properties:
                    expected_type = properties[field].get("type")
                    if expected_type and not self._check_type(value, expected_type):
                        issues.append(SchemaIssue(
                            severity="warning", field_name=field,
                            message=f"Field '{field}' expected type '{expected_type}', got '{type(value).__name__}'"
                        ))
                        confidence *= 0.9

        if intent_category == "knowledge" and schema:
            if extracted_data is None:
                issues.append(SchemaIssue(
                    severity="error", field_name="response",
                    message="Knowledge response should be valid JSON"
                ))
            else:
                for required_field in ["answer", "confidence"]:
                    if required_field not in extracted_data:
                        issues.append(SchemaIssue(
                            severity="warning", field_name=required_field,
                            message=f"Recommended field '{required_field}' missing from knowledge response"
                        ))

        passed = len([i for i in issues if i.severity == "error" or i.severity == "critical"]) == 0

        return SchemaResult(
            passed=passed,
            confidence=round(min(confidence, 1.0), 3),
            issues=issues,
            extracted_data=extracted_data,
        )

    def _check_type(self, value: Any, expected_type: str) -> bool:
        type_map = {
            "string": str,
            "number": (int, float),
            "integer": int,
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        expected = type_map.get(expected_type)
        if expected is None:
            return True
        if expected_type == "boolean":
            return isinstance(value, bool)
        if expected_type == "number":
            return isinstance(value, (int, float)) and not isinstance(value, bool)
        if expected_type == "integer":
            return isinstance(value, int) and not isinstance(value, bool)
        return isinstance(value, expected)

    def auto_detect_schema(self, intent_category: str) -> Optional[Dict[str, Any]]:
        schemas = {
            "knowledge": {
                "type": "object",
                "required": ["answer"],
                "properties": {
                    "answer": {"type": "string"},
                    "confidence": {"type": "number"},
                    "sources_cited": {"type": "array"},
                },
            },
            "agents": {
                "type": "object",
                "required": ["status"],
                "properties": {
                    "task_id": {"type": "string"},
                    "status": {"type": "string"},
                    "result": {"type": "string"},
                    "agent_used": {"type": "string"},
                },
            },
        }
        return schemas.get(intent_category)


schema_validator = SchemaValidator()
