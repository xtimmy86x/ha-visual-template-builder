"""Event-driven entity shared by the sensor platforms."""

from homeassistant.core import callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.restore_state import RestoreEntity

from .engine import EvaluationError, coerce_result, validate_expression


class VisualEntity(RestoreEntity):
    """Update only when one of the explicitly selected sources changes."""

    _attr_should_poll = False

    def __init__(self, manager, definition):
        self.manager = manager
        self.definition = definition
        self._attr_unique_id = definition["id"]
        self._value = None
        self._last_valid = None
        self._error = None
        self._stale = False
        self._unsub_sources = None
        self._apply_metadata()

    def _apply_metadata(self):
        self._attr_name = self.definition["name"]
        self._attr_icon = self.definition.get("icon") or None
        self._attr_device_class = self.definition.get("device_class") or None
        if self.definition["kind"] == "number":
            self._attr_native_unit_of_measurement = self.definition.get("unit") or None
            self._attr_state_class = self.definition.get("state_class") or None

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        if self.definition.get("missing") == "keep":
            previous = await self.async_get_last_state()
            if previous and previous.state not in ("unknown", "unavailable"):
                try:
                    self._last_valid = coerce_result(self.definition["kind"], previous.state)
                except EvaluationError:
                    pass
        self.async_on_remove(
            async_dispatcher_connect(self.hass, self.manager.signal, self._definition_changed)
        )
        self.async_on_remove(self._stop_sources)
        self._subscribe()
        self._recalculate()

    @callback
    def _stop_sources(self):
        if self._unsub_sources:
            self._unsub_sources()
            self._unsub_sources = None

    @callback
    def _subscribe(self):
        self._stop_sources()
        sources = validate_expression(self.definition["expression"])
        if sources:
            self._unsub_sources = async_track_state_change_event(
                self.hass, sources, self._source_changed
            )

    @callback
    def _source_changed(self, event):
        self._recalculate()
        self.async_write_ha_state()

    @callback
    def _definition_changed(self, key):
        if key != self.unique_id or key not in self.manager.definitions:
            return
        self.definition = self.manager.definitions[key]
        self._apply_metadata()
        self._subscribe()
        self._recalculate()
        self.async_write_ha_state()

    @callback
    def _recalculate(self):
        self._error = None
        self._stale = False
        try:
            self._value = self.manager.evaluate(self.definition)
            self._last_valid = self._value
            self._attr_available = True
        except EvaluationError as err:
            self._error = str(err)
            policy = self.definition.get("missing", "unavailable")
            self._stale = True
            if policy == "fallback":
                self._value = self.definition["fallback"]
                self._attr_available = True
            elif policy == "keep" and self._last_valid is not None:
                self._value = self._last_valid
                self._attr_available = True
            else:
                self._value = None
                self._attr_available = False

    @property
    def extra_state_attributes(self):
        return {
            "stale": self._stale,
            "evaluation_error": self._error,
            "source_entities": sorted(validate_expression(self.definition["expression"])),
        }


def setup_platform(hass, entry, async_add_entities, entity_class, binary):
    """Add new entities immediately; existing ones update via their own listener."""
    manager = entry.runtime_data
    known = set()

    @callback
    def sync(key=None):
        new = []
        for item_id, definition in manager.definitions.items():
            if (definition["kind"] == "binary") == binary and item_id not in known:
                known.add(item_id)
                new.append(entity_class(manager, definition))
        known.intersection_update(manager.definitions)
        if new:
            async_add_entities(new)

    entry.async_on_unload(async_dispatcher_connect(hass, manager.signal, sync))
    sync()
