"""Boolean sensors."""

from homeassistant.components.binary_sensor import BinarySensorEntity

from .entity import VisualEntity, setup_platform


async def async_setup_entry(hass, entry, async_add_entities):
    setup_platform(hass, entry, async_add_entities, VisualBinarySensor, True)


class VisualBinarySensor(VisualEntity, BinarySensorEntity):
    @property
    def is_on(self):
        return self._value
