"""Bounded, pure expression evaluator. Never executes Python or user templates."""

from __future__ import annotations

import math
import re
from collections.abc import Callable
from statistics import mean
from typing import Any

ENTITY_ID = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
ARITY = {
    "add": (2, 30),
    "subtract": (2, 2),
    "multiply": (2, 30),
    "divide": (2, 2),
    "mean": (1, 30),
    "min": (1, 30),
    "max": (1, 30),
    "round": (2, 2),
    "abs": (1, 1),
    "eq": (2, 2),
    "ne": (2, 2),
    "gt": (2, 2),
    "gte": (2, 2),
    "lt": (2, 2),
    "lte": (2, 2),
    "near": (3, 3),
    "and": (1, 30),
    "or": (1, 30),
    "not": (1, 1),
    "if": (3, 3),
    "concat": (1, 30),
    "count": (1, 30),
}


class InvalidExpression(ValueError):
    """Malformed or unsupported expression."""


class EvaluationError(ValueError):
    """Sources or operands cannot produce a valid result."""


def number(value: Any) -> float:
    """Convert a finite numeric input; booleans are not numbers here."""
    if isinstance(value, bool):
        raise EvaluationError("Expected a number, got a boolean")
    try:
        result = float(value)
    except (TypeError, ValueError, OverflowError) as err:
        raise EvaluationError(f"Not a number: {str(value)[:60]}") from err
    if not math.isfinite(result):
        raise EvaluationError("Non-finite number")
    return result


def boolean(value: Any) -> bool:
    """Avoid Python's surprising bool('off') behavior."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and value in (0, 1):
        return bool(value)
    if isinstance(value, str) and value.lower() in ("on", "off", "true", "false", "0", "1"):
        return value.lower() in ("on", "true", "1")
    raise EvaluationError("Expected on/off or true/false; add a comparison")


def validate_expression(node: Any) -> set[str]:
    """Validate schema, size and depth, returning explicit dependencies."""
    dependencies: set[str] = set()
    budget = 0

    def visit(item: Any, depth: int) -> None:
        nonlocal budget
        budget += 1
        if budget > 250 or depth > 12:
            raise InvalidExpression("Expression too large (250 nodes / 12 levels)")
        if not isinstance(item, dict):
            raise InvalidExpression("Expected an expression object")
        op = item.get("op")
        if op == "value":
            value = item.get("value")
            if type(value) not in (str, int, float, bool):
                raise InvalidExpression("A constant must be text, number or boolean")
            if isinstance(value, str) and len(value) > 255:
                raise InvalidExpression("Text exceeds 255 characters")
            if type(value) in (int, float):
                try:
                    number(value)
                except EvaluationError as err:
                    raise InvalidExpression(str(err)) from err
        elif op == "entity":
            entity_id = item.get("entity_id", "")
            if not isinstance(entity_id, str) or not ENTITY_ID.fullmatch(entity_id):
                raise InvalidExpression("Choose a valid source entity")
            attribute = item.get("attribute", "")
            if not isinstance(attribute, str) or len(attribute) > 100:
                raise InvalidExpression("Invalid attribute")
            dependencies.add(entity_id)
        elif isinstance(op, str) and op in ARITY:
            args = item.get("args")
            low, high = ARITY[op]
            if not isinstance(args, list) or not low <= len(args) <= high:
                raise InvalidExpression(f"{op} requires {low}–{high} operands")
            for arg in args:
                visit(arg, depth + 1)
        else:
            raise InvalidExpression("Unknown operation")

    visit(node, 0)
    return dependencies


def evaluate(node: dict, resolve: Callable[[str, str], Any]) -> Any:
    """Evaluate a validated tree, short circuiting conditions and branches."""

    def run(item: dict) -> Any:
        op = item["op"]
        if op == "value":
            return item["value"]
        if op == "entity":
            return resolve(item["entity_id"], item.get("attribute", ""))
        args = item["args"]
        if op == "if":
            return run(args[1] if boolean(run(args[0])) else args[2])
        if op == "and":
            return all(boolean(run(arg)) for arg in args)
        if op == "or":
            return any(boolean(run(arg)) for arg in args)
        values = [run(arg) for arg in args]
        if op == "not":
            return not boolean(values[0])
        if op == "count":
            return sum(boolean(value) for value in values)
        if op == "concat":
            result = "".join(str(value) for value in values)
            if len(result) > 255:
                raise EvaluationError("Result exceeds Home Assistant's 255-character state limit")
            return result
        if op in ("eq", "ne"):
            # Text comparisons preserve leading zeros (article codes, etc.).
            equal = values[0] == values[1] or str(values[0]) == str(values[1])
            return equal if op == "eq" else not equal
        nums = [number(value) for value in values]
        a = nums[0]
        b = nums[1] if len(nums) > 1 else 0
        if op == "near":
            if nums[2] < 0:
                raise EvaluationError("Tolerance cannot be negative")
            return abs(a - b) <= nums[2]
        if op in ("gt", "gte", "lt", "lte"):
            return {"gt": a > b, "gte": a >= b, "lt": a < b, "lte": a <= b}[op]
        if op == "divide" and b == 0:
            raise EvaluationError("Division by zero")
        if op == "round" and (b != int(b) or not -6 <= b <= 10):
            raise EvaluationError("Round digits must be an integer between -6 and 10")
        operations = {
            "add": lambda: sum(nums),
            "subtract": lambda: a - b,
            "multiply": lambda: math.prod(nums),
            "divide": lambda: a / b,
            "mean": lambda: mean(nums),
            "min": lambda: min(nums),
            "max": lambda: max(nums),
            "round": lambda: round(a, int(b)),
            "abs": lambda: abs(a),
        }
        return number(operations[op]())

    try:
        return run(node)
    except (ArithmeticError, TypeError) as err:
        raise EvaluationError("Invalid calculation") from err


def coerce_result(kind: str, result: Any) -> Any:
    """Enforce the declared entity type."""
    if kind == "number":
        return number(result)
    if kind == "binary":
        return boolean(result)
    value = str(result)
    if len(value) > 255:
        raise EvaluationError("Text result exceeds 255 characters")
    return value


def validate_definition(data: Any) -> dict:
    """Return an independent, normalized configuration."""
    import copy

    if not isinstance(data, dict):
        raise InvalidExpression("Invalid sensor configuration")
    data = copy.deepcopy(data)
    if data.get("id") is not None and (
        not isinstance(data["id"], str) or not re.fullmatch(r"[a-f0-9]{32}", data["id"])
    ):
        raise InvalidExpression("Invalid sensor identifier")
    if not isinstance(data.get("name"), str) or not data["name"].strip() or len(data["name"]) > 100:
        raise InvalidExpression("Enter a name (1–100 characters)")
    data["name"] = data["name"].strip()
    if data.get("kind") not in ("number", "text", "binary"):
        raise InvalidExpression("Invalid sensor type")
    validate_expression(data.get("expression"))
    if data.get("missing", "unavailable") not in ("unavailable", "fallback", "keep"):
        raise InvalidExpression("Invalid missing-data policy")
    if data.get("missing") == "fallback":
        try:
            data["fallback"] = coerce_result(data["kind"], data.get("fallback"))
        except EvaluationError as err:
            raise InvalidExpression(str(err)) from err
    for key in ("unit", "icon", "device_class", "state_class"):
        if not isinstance(data.get(key, ""), str) or len(data.get(key, "")) > 100:
            raise InvalidExpression(f"Invalid {key}")
    if data.get("icon") and not re.fullmatch(r"mdi:[a-z0-9-]+", data["icon"]):
        raise InvalidExpression("Use an mdi: icon")
    if data["kind"] != "number" and (data.get("unit") or data.get("state_class")):
        raise InvalidExpression("Only numeric sensors support unit and state class")
    if data.get("state_class", "") not in ("", "measurement", "total", "total_increasing"):
        raise InvalidExpression("Invalid state class")
    return data
