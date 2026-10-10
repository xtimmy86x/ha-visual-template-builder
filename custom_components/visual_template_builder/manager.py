"""Persist definitions and notify entities without reloading the integration."""

from __future__ import annotations

import asyncio
from copy import deepcopy
from uuid import uuid4

from homeassistant.components.binary_sensor import BinarySensorDeviceClass
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import DOMAIN, MAX_SENSORS
from .engine import (
    EvaluationError,
    InvalidExpression,
    coerce_result,
    evaluate,
    validate_definition,
    validate_expression,
)


class BuilderManager:
    """One manager for the single config entry."""

    def __init__(self, hass, entry):
        self.hass = hass
        self.entry = entry
        self.store = Store(hass, 1, f"{DOMAIN}.{entry.entry_id}")
        self.definitions = {}
        self.lock = asyncio.Lock()
        self.signal = f"{DOMAIN}_{entry.entry_id}"
        self.revision = 0

    async def async_load(self):
        saved = await self.store.async_load()
        if saved:
            self.definitions = saved.get("definitions", {})
            self.revision = saved.get("revision", 0)

    def resolve(self, entity_id, attribute):
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable"):
            raise EvaluationError(f"Source unavailable: {entity_id}")
        if attribute:
            if attribute not in state.attributes or state.attributes[attribute] is None:
                raise EvaluationError(f"Missing attribute {attribute}: {entity_id}")
            value = state.attributes[attribute]
        else:
            value = state.state
        if not isinstance(value, (str, int, float, bool)):
            raise EvaluationError("Choose a scalar attribute (text, number or boolean)")
        return value

    def evaluate(self, definition):
        if definition.get("id") in self.definitions:
            try:
                self.check_cycles(self.definitions, definition["id"])
            except InvalidExpression as err:
                raise EvaluationError(str(err)) from err
        return coerce_result(definition["kind"], evaluate(definition["expression"], self.resolve))

    def validate(self, definition):
        definition = validate_definition(definition)
        device_class = definition.get("device_class")
        if device_class:
            classes = (
                BinarySensorDeviceClass if definition["kind"] == "binary" else SensorDeviceClass
            )
            if definition["kind"] == "text" or device_class not in set(classes):
                raise InvalidExpression("Invalid device class for this sensor type")
        # Non-numeric HA sensor classes would conflict with the numeric editor.
        if definition["kind"] == "number" and device_class in ("date", "timestamp", "enum"):
            raise InvalidExpression("This device class is not numeric")
        return definition

    def check_cycles(self, definitions, root=None):
        registry = er.async_get(self.hass)
        visited, active = set(), set()

        def visit(key):
            if key in active:
                raise InvalidExpression("Circular dependency between visual sensors")
            if key in visited:
                return
            active.add(key)
            for source in validate_expression(definitions[key]["expression"]):
                entity = registry.async_get(source)
                if (
                    entity
                    and entity.config_entry_id == self.entry.entry_id
                    and entity.unique_id in definitions
                ):
                    visit(entity.unique_id)
            active.remove(key)
            visited.add(key)

        for key in [root] if root in definitions else definitions:
            visit(key)

    async def async_save(self, definition, revision):
        async with self.lock:
            if revision != self.revision:
                raise InvalidExpression(
                    "Configuration changed in another window. Refresh before saving."
                )
            definition = self.validate(definition)
            key = definition.get("id")
            if key is not None and key not in self.definitions:
                raise InvalidExpression("Sensor no longer exists. Refresh the list.")
            if key and self.definitions[key]["kind"] != definition["kind"]:
                raise InvalidExpression("Create a new sensor to change its result type")
            if not key and len(self.definitions) >= MAX_SENSORS:
                raise InvalidExpression(f"Limit of {MAX_SENSORS} sensors reached")
            registry = er.async_get(self.hass)
            previous_sources = (
                validate_expression(self.definitions[key]["expression"]) if key else set()
            )
            for source in validate_expression(definition["expression"]) - previous_sources:
                if self.hass.states.get(source) is None and registry.async_get(source) is None:
                    raise InvalidExpression(f"Source entity does not exist: {source}")
            key = key or uuid4().hex
            definition["id"] = key
            updated = deepcopy(self.definitions)
            updated[key] = definition
            self.check_cycles(updated)
            await self.store.async_save({"definitions": updated, "revision": self.revision + 1})
            self.definitions = updated
            self.revision += 1
            async_dispatcher_send(self.hass, self.signal, key)
            return definition

    async def async_delete(self, key, revision):
        async with self.lock:
            if revision != self.revision:
                raise InvalidExpression(
                    "Configuration changed in another window. Refresh before deleting."
                )
            if key not in self.definitions:
                raise InvalidExpression("Sensor not found")
            updated = deepcopy(self.definitions)
            del updated[key]
            await self.store.async_save({"definitions": updated, "revision": self.revision + 1})
            self.definitions = updated
            self.revision += 1
            registry = er.async_get(self.hass)
            for entity in er.async_entries_for_config_entry(registry, self.entry.entry_id):
                if entity.unique_id == key:
                    registry.async_remove(entity.entity_id)
            async_dispatcher_send(self.hass, self.signal, key)

    def snapshot(self):
        registry = er.async_get(self.hass)
        entity_ids = {
            e.unique_id: e.entity_id
            for e in er.async_entries_for_config_entry(registry, self.entry.entry_id)
        }
        return {
            "revision": self.revision,
            "sensors": [
                {**definition, "entity_id": entity_ids.get(key)}
                for key, definition in self.definitions.items()
            ],
        }
