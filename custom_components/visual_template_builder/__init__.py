"""Visual Template Builder integration."""

import hashlib
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN, PLATFORMS, TITLE, VERSION
from .manager import BuilderManager
from .websocket import register_commands

PANEL_PATH = Path(__file__).parent / "frontend" / "panel.js"
# Icon names for the panel's icon picker, regenerated with `npm run build:icons`.
ICONS_PATH = Path(__file__).parent / "frontend" / "mdi-icons.json"


def panel_version(*paths: Path) -> str:
    """Release plus content hash, so browsers fetch the panel files again whenever they change."""
    digest = hashlib.sha256()
    for path in paths or (PANEL_PATH, ICONS_PATH):
        digest.update(path.read_bytes())
    return f"{VERSION}-{digest.hexdigest()[:10]}"


async def async_setup_entry(hass, entry):
    manager = BuilderManager(hass, entry)
    await manager.async_load()
    entry.runtime_data = manager
    if not hass.data.get(f"{DOMAIN}_registered"):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(f"/{DOMAIN}/panel.js", str(PANEL_PATH), False),
                # Requested with the panel version in its URL, so it can be cached.
                StaticPathConfig(f"/{DOMAIN}/mdi-icons.json", str(ICONS_PATH), True),
            ]
        )
        register_commands(hass)
        hass.data[f"{DOMAIN}_registered"] = True
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    version = await hass.async_add_executor_job(panel_version)
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name="visual-template-builder-panel",
        frontend_url_path=DOMAIN,
        sidebar_title=TITLE,
        sidebar_icon="mdi:function-variant",
        module_url=f"/{DOMAIN}/panel.js?v={version}",
        config={"version": version},
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
