"""Administrator-only API for the visual editor."""

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.binary_sensor import BinarySensorDeviceClass
from homeassistant.components.sensor import SensorDeviceClass

from .const import DOMAIN
from .engine import EvaluationError, InvalidExpression, validate_expression


def register_commands(hass):
    websocket_api.async_register_command(hass, handle_command)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/command",
        vol.Required("action"): vol.In(["list", "save", "delete", "preview", "metadata"]),
        vol.Optional("definition"): dict,
        vol.Optional("sensor_id"): str,
        vol.Optional("revision"): int,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def handle_command(hass, connection, msg):
    entries = hass.config_entries.async_entries(DOMAIN)
    if not entries or not getattr(entries[0], "runtime_data", None):
        connection.send_error(msg["id"], "not_loaded", "Visual Template Builder is not loaded")
        return
    manager = entries[0].runtime_data
    try:
        action = msg["action"]
        if action == "metadata":
            result = {
                "number": sorted(
                    str(x) for x in SensorDeviceClass if x not in ("date", "timestamp", "enum")
                ),
                "binary": sorted(str(x) for x in BinarySensorDeviceClass),
            }
        elif action == "list":
            result = manager.snapshot()
        elif action == "save":
            await manager.async_save(msg["definition"], msg["revision"])
            result = manager.snapshot()
        elif action == "delete":
            await manager.async_delete(msg["sensor_id"], msg["revision"])
            result = manager.snapshot()
        else:
            definition = manager.validate(msg["definition"])
            sources = sorted(validate_expression(definition["expression"]))
            try:
                result = {
                    "value": manager.evaluate(definition),
                    "error": None,
                    "sources": sources,
                    "stale": False,
                }
            except EvaluationError as err:
                result = {
                    "value": definition.get("fallback")
                    if definition.get("missing") == "fallback"
                    else None,
                    "error": str(err),
                    "sources": sources,
                    "stale": True,
                }
        connection.send_result(msg["id"], result)
    except (InvalidExpression, KeyError, EvaluationError) as err:
        connection.send_error(msg["id"], "invalid_config", str(err))
    except OSError:
        connection.send_error(
            msg["id"], "storage_error", "Could not save configuration; please try again"
        )
