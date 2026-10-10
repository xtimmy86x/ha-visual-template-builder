"""Numeric and text sensors."""

from homeassistant.components.sensor import SensorEntity

from .entity import VisualEntity, setup_platform


async def async_setup_entry(hass, entry, async_add_entities):
    setup_platform(hass, entry, async_add_entities, VisualSensor, False)


class VisualSensor(VisualEntity, SensorEntity):
    @property
    def native_value(self):
        return self._value
