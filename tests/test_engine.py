"""Behavioral tests for user-facing calculations and failure policies."""

import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location(
    "engine", Path(__file__).parents[1] / "custom_components/visual_template_builder/engine.py"
)
e = importlib.util.module_from_spec(spec)
spec.loader.exec_module(e)


def val(value):
    return {"op": "value", "value": value}


def op(name, *args):
    return {"op": name, "args": list(args)}


def run(node, values=None):
    e.validate_expression(node)
    return e.evaluate(node, lambda entity, attribute: (values or {})[entity])


@pytest.mark.parametrize(
    ("name", "args", "expected"),
    [
        ("add", [2, 3, 4], 9),
        ("subtract", [7, 2], 5),
        ("multiply", [2, 3], 6),
        ("divide", [1000, 1000], 1),
        ("mean", [10, 20], 15),
        ("min", [2, 4], 2),
        ("max", [2, 4], 4),
        ("round", [2.345, 2], 2.35),
        ("abs", [-4], 4),
        ("gt", [3, 2], True),
        ("gte", [2, 2], True),
        ("lt", [1, 2], True),
        ("lte", [2, 2], True),
        ("near", [10, 10.5, 0.5], True),
        ("eq", ["001", "1"], False),
        ("eq", ["on", "on"], True),
        ("ne", ["a", "b"], True),
        ("and", [True, "off"], False),
        ("or", [False, "on"], True),
        ("not", ["off"], True),
        ("count", ["on", "off", True], 2),
        ("concat", ["Power: ", 12, " W"], "Power: 12 W"),
    ],
)
def test_operations(name, args, expected):
    assert run(op(name, *map(val, args))) == expected


def test_machine_status_priority_and_lazy_branch():
    source = {"op": "entity", "entity_id": "sensor.missing"}
    assert run(op("if", val(True), val("Allarme"), source)) == "Allarme"
    assert run(op("and", val(False), source)) is False
    assert run(op("or", val(True), source)) is True


def test_nested_conversion_with_source():
    node = op(
        "round", op("divide", {"op": "entity", "entity_id": "sensor.power"}, val(1000)), val(2)
    )
    assert run(node, {"sensor.power": "1234"}) == 1.23
    assert e.validate_expression(node) == {"sensor.power"}


@pytest.mark.parametrize(
    "node",
    [
        op("divide", val(1), val(0)),
        op("add", val("unknown"), val(3)),
        op("near", val(1), val(2), val(-1)),
        op("round", val(1.3), val(100)),
        op("and", val("unavailable")),
        op("concat", val("a" * 200), val("b" * 200)),
        op("multiply", val(1e300), val(1e300)),
    ],
)
def test_invalid_results_are_not_silent_zeroes(node):
    with pytest.raises(e.EvaluationError):
        run(node)


@pytest.mark.parametrize(
    "node",
    [
        {"op": "exec"},
        val(None),
        val(float("nan")),
        {"op": "entity", "entity_id": "bad"},
        op("divide", val(1)),
        {"op": []},
        val("x" * 256),
    ],
)
def test_reject_malformed_input(node):
    with pytest.raises(e.InvalidExpression):
        e.validate_expression(node)


def test_depth_bound():
    node = val(True)
    for _ in range(14):
        node = op("not", node)
    with pytest.raises(e.InvalidExpression):
        e.validate_expression(node)


def test_numeric_boolean_conversion_is_explicit():
    assert e.coerce_result("binary", "off") is False
    with pytest.raises(e.EvaluationError):
        e.coerce_result("number", True)
    with pytest.raises(e.EvaluationError):
        e.coerce_result("binary", "closed")


def test_definition_fallback_normalization():
    definition = {
        "name": " Power ",
        "kind": "number",
        "expression": val(10),
        "missing": "fallback",
        "fallback": "5",
    }
    normalized = e.validate_definition(definition)
    assert normalized["fallback"] == 5
    assert normalized["name"] == "Power"
    assert definition["name"] == " Power "
