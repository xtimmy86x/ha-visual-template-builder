"""Visual Template Builder integration."""

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN, PLATFORMS, TITLE, VERSION
from .manager import BuilderManager
from .websocket import register_commands


async def async_setup_entry(hass, entry):
    manager = BuilderManager(hass, entry)
    await manager.async_load()
    entry.runtime_data = manager
    if not hass.data.get(f"{DOMAIN}_registered"):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    f"/{DOMAIN}/panel.js",
                    str(Path(__file__).parent / "frontend" / "panel.js"),
                    False,
                )
            ]
        )
        register_commands(hass)
        hass.data[f"{DOMAIN}_registered"] = True
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="visual-template-builder-panel",
        frontend_url_path=DOMAIN,
        sidebar_title=TITLE,
        sidebar_icon="mdi:function-variant",
        module_url=f"/{DOMAIN}/panel.js?v={VERSION}",
        require_admin=True,
    )
    return True


async def async_unload_entry(hass, entry):
    if await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        frontend.async_remove_panel(hass, DOMAIN)
        entry.runtime_data = None
        return True
    return False


async def async_remove_entry(hass, entry):
    from homeassistant.helpers.storage import Store

    await Store(hass, 1, f"{DOMAIN}.{entry.entry_id}").async_remove()
