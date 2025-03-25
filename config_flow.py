"""Config flow for MariaDB Stats integration."""
import logging
import voluptuous as vol
import pymysql

from homeassistant import config_entries
from homeassistant.core import HomeAssistant, callback
from homeassistant.const import (
    CONF_HOST,
    CONF_PORT,
    CONF_USERNAME,
    CONF_PASSWORD,
    CONF_DATABASE,
)
import homeassistant.helpers.config_validation as cv

from .sensor import DEFAULT_HOST, DEFAULT_PORT, DEFAULT_DATABASE
from . import DOMAIN

_LOGGER = logging.getLogger(__name__)

DATA_SCHEMA = vol.Schema({
    vol.Optional(CONF_HOST, default=DEFAULT_HOST): str,
    vol.Optional(CONF_PORT, default=DEFAULT_PORT): int,
    vol.Required(CONF_USERNAME): str,
    vol.Required(CONF_PASSWORD): str,
    vol.Optional(CONF_DATABASE, default=DEFAULT_DATABASE): str,
})


async def validate_input(hass: HomeAssistant, data):
    """Validate the user input allows us to connect."""
    host = data[CONF_HOST]
    port = data[CONF_PORT]
    username = data[CONF_USERNAME]
    password = data[CONF_PASSWORD]
    database = data[CONF_DATABASE]
    
    errors = {}
    
    try:
        # Testa a conexão com o banco de dados
        connection = await hass.async_add_executor_job(
            pymysql.connect,
            host,
            port,
            username,
            password,
            database
        )
        
        # Testa uma consulta básica
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT 
                    COUNT(*) as count
                FROM information_schema.TABLES
                WHERE table_schema = '{database}'
            """)
            result = cursor.fetchone()
            table_count = result[0] if result else 0
            
        connection.close()
        
        # Retorna informações para exibir ao usuário
        return {
            "title": f"MariaDB: {database} ({table_count} tabelas)",
            "host": host,
            "database": database
        }
    except pymysql.err.OperationalError as err:
        _LOGGER.error("Erro de conexão ao MariaDB: %s", err)
        if "Access denied" in str(err):
            errors["base"] = "auth_error"
        elif "Can't connect" in str(err):
            errors["base"] = "conn_error"
        else:
            errors["base"] = "db_error"
    except Exception as err:
        _LOGGER.exception("Erro inesperado: %s", err)
        errors["base"] = "unknown"
    
    return {"errors": errors}


class MariaDBStatsConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for MariaDB Stats."""

    VERSION = 1
    CONNECTION_CLASS = config_entries.CONN_CLASS_LOCAL_POLL

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            info = await validate_input(self.hass, user_input)
            
            if "errors" not in info:
                # Sucesso!
                return self.async_create_entry(
                    title=info["title"],
                    data=user_input
                )
            else:
                errors = info["errors"]

        # Mostra o formulário ao usuário
        return self.async_show_form(
            step_id="user",
            data_schema=DATA_SCHEMA,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Get the options flow for this handler."""
        return MariaDBStatsOptionsFlow(config_entry)


class MariaDBStatsOptionsFlow(config_entries.OptionsFlow):
    """Handle options for MariaDB Stats."""

    def __init__(self, config_entry):
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        options = {
            vol.Optional(
                CONF_HOST,
                default=self.config_entry.options.get(
                    CONF_HOST, self.config_entry.data.get(CONF_HOST, DEFAULT_HOST)
                ),
            ): str,
            vol.Optional(
                CONF_PORT,
                default=self.config_entry.options.get(
                    CONF_PORT, self.config_entry.data.get(CONF_PORT, DEFAULT_PORT)
                ),
            ): int,
            vol.Required(
                CONF_USERNAME,
                default=self.config_entry.options.get(
                    CONF_USERNAME, self.config_entry.data.get(CONF_USERNAME, "")
                ),
            ): str,
            vol.Required(
                CONF_PASSWORD,
                default=self.config_entry.options.get(
                    CONF_PASSWORD, self.config_entry.data.get(CONF_PASSWORD, "")
                ),
            ): str,
            vol.Optional(
                CONF_DATABASE,
                default=self.config_entry.options.get(
                    CONF_DATABASE, self.config_entry.data.get(CONF_DATABASE, DEFAULT_DATABASE)
                ),
            ): str,
        }

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(options)
        )
