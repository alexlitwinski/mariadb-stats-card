"""MariaDB Stats integration."""
import logging
import os
import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.const import (
    CONF_HOST,
    CONF_PORT,
    CONF_USERNAME,
    CONF_PASSWORD,
)
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN, CONF_DATABASE

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = vol.Schema({
    DOMAIN: vol.Schema({
        vol.Optional(CONF_HOST): cv.string,
        vol.Optional(CONF_PORT): cv.port,
        vol.Optional(CONF_USERNAME): cv.string,
        vol.Optional(CONF_PASSWORD): cv.string,
        vol.Optional(CONF_DATABASE): cv.string,
    })
}, extra=vol.ALLOW_EXTRA)

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the MariaDB Stats component."""
    # Criar a pasta www se não existir
    www_path = os.path.join(os.path.dirname(__file__), "www")
    if not os.path.isdir(www_path):
        os.makedirs(www_path, exist_ok=True)
        _LOGGER.info("Criada pasta www para MariaDB Stats")
    
    # Caminho completo para o arquivo JS
    js_path = os.path.join(www_path, "mariadb-stats-card.js")
    
    # Registrar o cartão personalizado
    try:
        hass.http.register_static_path(
            f"/{DOMAIN}/mariadb-stats-card.js",
            js_path,
            True
        )
        
        # Registrar o recurso frontend
        hass.components.frontend.async_register_extra_js_url(
            hass, f"/{DOMAIN}/mariadb-stats-card.js"
        )
        _LOGGER.info(f"Registrado recurso JS: /{DOMAIN}/mariadb-stats-card.js")
    except Exception as ex:
        _LOGGER.error(f"Erro ao registrar recursos frontend: {ex}")
    
    # Se houver configuração no YAML, configura o sensor
    if DOMAIN in config:
        hass.async_create_task(
            hass.helpers.discovery.async_load_platform(
                "sensor", 
                DOMAIN, 
                config[DOMAIN], 
                config
            )
        )
    
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up MariaDB Stats from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    
    # Armazena a entrada de configuração para uso pelos sensores
    hass.data[DOMAIN][entry.entry_id] = entry.data
    
    # Configura a plataforma do sensor com base na entrada de configuração
    hass.async_create_task(
        hass.config_entries.async_forward_entry_setup(entry, "sensor")
    )
    
    entry.async_on_unload(entry.add_update_listener(update_listener))
    
    return True

async def update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    await hass.config_entries.async_reload(entry.entry_id)

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_forward_entry_unload(entry, "sensor")
    
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)
    
    return unload_ok
