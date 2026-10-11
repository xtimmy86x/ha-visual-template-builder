"""Exercise real HA entities, registry, storage and lifecycle with HTTP mocked."""

import json
from pathlib import Path
from types import MappingProxyType, SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant import loader
from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntries, ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import Unauthorized
from homeassistant.helpers import entity_registry as er

from custom_components.visual_template_builder import ICONS_PATH, PANEL_PATH, panel_version
from custom_components.visual_template_builder.const import DOMAIN, VERSION
from custom_components.visual_template_builder.engine import InvalidExpression


def definition(kind="number", expression=None, **kw):
    return {
        "name": "Visual test",
        "kind": kind,
        "expression": expression or {"op": "entity", "entity_id": "sensor.source"},
        **kw,
    }


@pytest.fixture
async def loaded(tmp_path):
    (tmp_path / "custom_components").symlink_to(
        Path(__file__).parents[1] / "custom_components", target_is_directory=True
    )
    hass = HomeAssistant(str(tmp_path))
    hass.config.skip_pip = True
    loader.async_setup(hass)
    hass.config_entries = ConfigEntries(hass, {})
    await hass.config_entries.async_initialize()
    hass.config.components.update({"frontend", "http", "panel_custom", "websocket_api"})
    hass.http = SimpleNamespace(async_register_static_paths=AsyncMock())
    await er.async_load(hass)
    hass.states.async_set("sensor.source", "12", {"watts": 1200})
    entry = ConfigEntry(
        version=1,
        minor_version=1,
        domain=DOMAIN,
        title="Visual Template Builder",
        data={},
        options={},
        source="user",
        unique_id=DOMAIN,
        discovery_keys=MappingProxyType({}),
        subentries_data=[],
    )
    await hass.config_entries.async_add(entry)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED
    yield hass, entry, entry.runtime_data
    await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_stop(force=True)


async def entity_id(hass, manager, **kwargs):
    saved = await manager.async_save(definition(**kwargs), manager.revision)
    await hass.async_block_till_done()
    registry = er.async_get(hass)
    platform = "binary_sensor" if saved["kind"] == "binary" else "sensor"
    return saved, registry.async_get_entity_id(platform, DOMAIN, saved["id"])


async def test_create_live_edit_delete_reload(loaded):
    hass, entry, manager = loaded
    saved, eid = await entity_id(hass, manager)
    assert hass.states.get(eid).state == "12.0"
    hass.states.async_set("sensor.source", "25")
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "25.0"
    await manager.async_save(
        {**saved, "expression": {"op": "value", "value": 42}}, manager.revision
    )
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "42.0"
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "42.0"
    assert hass.http.async_register_static_paths.await_count == 1
    manager = entry.runtime_data
    await manager.async_delete(saved["id"], manager.revision)
    await hass.async_block_till_done()
    assert hass.states.get(eid) is None
    assert er.async_get(hass).async_get(eid) is None


@pytest.mark.parametrize(
    ("policy", "expected"), [("unavailable", "unavailable"), ("fallback", "7.0"), ("keep", "12.0")]
)
async def test_missing_source_policies(loaded, policy, expected):
    hass, entry, manager = loaded
    saved, eid = await entity_id(hass, manager, missing=policy, fallback=7)
    hass.states.async_set("sensor.source", "unavailable")
    await hass.async_block_till_done()
    state = hass.states.get(eid)
    assert state.state == expected
    if policy != "unavailable":
        assert state.attributes["stale"] is True
    if policy == "keep":
        await hass.config_entries.async_reload(entry.entry_id)
        await hass.async_block_till_done()
        assert hass.states.get(eid).state == "12.0"
    hass.states.async_set("sensor.source", "30")
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "30.0"
    assert hass.states.get(eid).attributes["stale"] is False


async def test_binary_text_and_attributes(loaded):
    hass, entry, manager = loaded
    _, eid = await entity_id(
        hass,
        manager,
        kind="binary",
        expression={
            "op": "gt",
            "args": [
                {"op": "entity", "entity_id": "sensor.source", "attribute": "watts"},
                {"op": "value", "value": 1000},
            ],
        },
    )
    assert hass.states.get(eid).state == "on"
    _, text_id = await entity_id(
        hass,
        manager,
        kind="text",
        expression={
            "op": "if",
            "args": [
                {"op": "entity", "entity_id": eid},
                {"op": "value", "value": "Running"},
                {"op": "value", "value": "Idle"},
            ],
        },
    )
    assert hass.states.get(text_id).state == "Running"
    hass.states.async_set("sensor.source", "12", {"watts": 50})
    await hass.async_block_till_done()
    assert hass.states.get(eid).state == "off"
    await hass.async_block_till_done()
    assert hass.states.get(text_id).state == "Idle"


async def test_cycle_and_concurrent_edit_rejected(loaded):
    hass, entry, manager = loaded
    saved, eid = await entity_id(hass, manager)
    with pytest.raises(InvalidExpression, match="Circular"):
        await manager.async_save(
            {**saved, "expression": {"op": "entity", "entity_id": eid}}, manager.revision
        )
    with pytest.raises(InvalidExpression, match="another window"):
        await manager.async_save(saved, 0)
    assert manager.definitions[saved["id"]] == saved


async def test_storage_failure_keeps_live_configuration(loaded):
    hass, entry, manager = loaded
    saved, eid = await entity_id(hass, manager)
    manager.store.async_save = AsyncMock(side_effect=OSError("disk full"))
    with pytest.raises(OSError):
        await manager.async_save({**saved, "name": "Changed"}, manager.revision)
    assert manager.definitions[saved["id"]]["name"] == "Visual test"


async def test_websocket_requires_admin(loaded):
    from custom_components.visual_template_builder.websocket import handle_command

    hass, entry, manager = loaded
    connection = Mock()
    connection.user.is_admin = False
    with pytest.raises(Unauthorized):
        handle_command(hass, connection, {"id": 1, "type": f"{DOMAIN}/command", "action": "list"})
    connection.send_result.assert_not_called()


async def test_unknown_source_cannot_create_forward_self_reference(loaded):
    hass, entry, manager = loaded
    with pytest.raises(InvalidExpression, match="does not exist"):
        await manager.async_save(
            definition(expression={"op": "entity", "entity_id": "sensor.visual_test"}),
            manager.revision,
        )


async def test_indirect_cycle_rejected(loaded):
    hass, entry, manager = loaded
    first, first_id = await entity_id(hass, manager)
    second, second_id = await entity_id(
        hass, manager, expression={"op": "entity", "entity_id": first_id}
    )
    with pytest.raises(InvalidExpression, match="Circular"):
        await manager.async_save(
            {**first, "expression": {"op": "entity", "entity_id": second_id}}, manager.revision
        )


async def test_setup_flow_single_instance(loaded):
    hass, entry, manager = loaded
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "abort"
    assert result["reason"] == "already_configured"


async def test_panel_url_changes_with_panel_content(loaded, tmp_path):
    hass, _, _ = loaded
    panel = hass.data[frontend.DATA_PANELS][DOMAIN]
    version = panel_version()
    assert version.startswith(f"{VERSION}-")
    assert panel.config["version"] == version
    assert panel.config["_panel_custom"]["module_url"] == f"/{DOMAIN}/panel.js?v={version}"
    assert panel_version(PANEL_PATH, ICONS_PATH) == version
    static = {
        path.url_path: path for path in hass.http.async_register_static_paths.await_args[0][0]
    }
    assert static[f"/{DOMAIN}/mdi-icons.json"].path == str(ICONS_PATH)
    assert static[f"/{DOMAIN}/mdi-icons.json"].cache_headers is True
    assert static[f"/{DOMAIN}/panel.js"].cache_headers is False
    copy = tmp_path / "panel.js"
    copy.write_text(PANEL_PATH.read_text() + "\n// changed\n")
    assert panel_version(copy, ICONS_PATH) != version
    icons = tmp_path / "mdi-icons.json"
    icons.write_text('["flash"]\n')
    assert panel_version(PANEL_PATH, icons) != version


def test_manifest_version_matches_constant():
    manifest = json.loads(
        (Path(__file__).parents[1] / "custom_components" / DOMAIN / "manifest.json").read_text()
    )
    assert manifest["version"] == VERSION
