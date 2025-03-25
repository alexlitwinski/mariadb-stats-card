"""
Home Assistant Component para mostrar estatísticas do banco de dados MariaDB.
Arquivo: sensor.py
"""
import logging
from typing import Optional, Any, Dict
import voluptuous as vol
import pymysql

from homeassistant.components.sensor import (
    SensorEntity,
    PLATFORM_SCHEMA
)
from homeassistant.const import (
    CONF_HOST,
    CONF_PORT,
    CONF_USERNAME,
    CONF_PASSWORD,
    CONF_DATABASE
)
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers.typing import (
    ConfigType,
    DiscoveryInfoType,
    HomeAssistantType
)
from homeassistant.util import Throttle
from datetime import timedelta

from . import DOMAIN

_LOGGER = logging.getLogger(__name__)

DEFAULT_NAME = "MariaDB Stats"
DEFAULT_HOST = "localhost"
DEFAULT_PORT = 3306
DEFAULT_DATABASE = "homeassistant"

MIN_TIME_BETWEEN_UPDATES = timedelta(minutes=30)

PLATFORM_SCHEMA = PLATFORM_SCHEMA.extend({
    vol.Optional(CONF_HOST, default=DEFAULT_HOST): cv.string,
    vol.Optional(CONF_PORT, default=DEFAULT_PORT): cv.port,
    vol.Required(CONF_USERNAME): cv.string,
    vol.Required(CONF_PASSWORD): cv.string,
    vol.Optional(CONF_DATABASE, default=DEFAULT_DATABASE): cv.string,
})

async def async_setup_platform(
    hass: HomeAssistantType,
    config: ConfigType,
    async_add_entities,
    discovery_info: Optional[DiscoveryInfoType] = None
):
    """Set up the MariaDB Stats sensor from YAML config."""
    host = config.get(CONF_HOST)
    port = config.get(CONF_PORT)
    username = config.get(CONF_USERNAME)
    password = config.get(CONF_PASSWORD)
    database = config.get(CONF_DATABASE)

    db_stats = MariaDBStats(host, port, username, password, database)
    
    # Verifica a conexão
    await hass.async_add_executor_job(db_stats.update)
    
    if db_stats.connected:
        async_add_entities([MariaDBStatsSensor(db_stats)], True)
    else:
        _LOGGER.error("Falha ao conectar ao banco de dados MariaDB")

async def async_setup_entry(hass, config_entry, async_add_entities):
    """Set up the MariaDB Stats sensor from a config entry."""
    config = hass.data[DOMAIN][config_entry.entry_id]
    
    host = config.get(CONF_HOST, DEFAULT_HOST)
    port = config.get(CONF_PORT, DEFAULT_PORT)
    username = config.get(CONF_USERNAME)
    password = config.get(CONF_PASSWORD)
    database = config.get(CONF_DATABASE, DEFAULT_DATABASE)

    db_stats = MariaDBStats(host, port, username, password, database)
    
    # Verifica a conexão
    await hass.async_add_executor_job(db_stats.update)
    
    if db_stats.connected:
        async_add_entities([MariaDBStatsSensor(db_stats)], True)
    else:
        _LOGGER.error("Falha ao conectar ao banco de dados MariaDB")


class MariaDBStats:
    """Classe para obter estatísticas do MariaDB."""

    def __init__(self, host, port, username, password, database):
        """Inicializa o objeto MariaDBStats."""
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.database = database
        self.connected = False
        self.total_size = 0
        self.tables = []
        self.error_message = None

    @Throttle(MIN_TIME_BETWEEN_UPDATES)
    def update(self):
        """Atualiza as estatísticas do banco de dados."""
        try:
            connection = pymysql.connect(
                host=self.host,
                port=self.port,
                user=self.username,
                password=self.password,
                database=self.database
            )
            
            self.connected = True
            self.error_message = None
            
            with connection.cursor() as cursor:
                # Obter tamanho total do banco de dados
                cursor.execute(f"""
                    SELECT 
                        SUM(data_length + index_length) as size
                    FROM information_schema.TABLES
                    WHERE table_schema = '{self.database}'
                """)
                result = cursor.fetchone()
                self.total_size = result[0] if result[0] else 0
                
                # Obter informações sobre cada tabela
                cursor.execute(f"""
                    SELECT 
                        table_name,
                        table_rows,
                        data_length + index_length as size
                    FROM information_schema.TABLES
                    WHERE table_schema = '{self.database}'
                    ORDER BY size DESC
                """)
                
                self.tables = []
                for table in cursor.fetchall():
                    self.tables.append({
                        "name": table[0],
                        "rows": table[1],
                        "size": table[2]
                    })
                    
            connection.close()
            
        except Exception as e:
            self.connected = False
            self.error_message = str(e)
            _LOGGER.error("Erro ao conectar ao MariaDB: %s", str(e))


class MariaDBStatsSensor(SensorEntity):
    """Sensor para mostrar estatísticas do MariaDB."""

    def __init__(self, db_stats):
        """Inicializa o sensor."""
        self._db_stats = db_stats
        self._name = DEFAULT_NAME
        self._state = None
        self._attributes = {}
        self._attr_unique_id = f"mariadb_stats_{db_stats.host}_{db_stats.database}"

    @property
    def name(self):
        """Retorna o nome do sensor."""
        return self._name

    @property
    def state(self):
        """Retorna o estado do sensor (tamanho total do banco em MB)."""
        if self._db_stats.connected and self._db_stats.total_size:
            return round(self._db_stats.total_size / (1024 * 1024), 2)
        return None

    @property
    def unit_of_measurement(self):
        """Retorna a unidade de medida."""
        return "MB"

    @property
    def icon(self):
        """Ícone para o sensor."""
        return "mdi:database"

    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        """Retorna atributos adicionais do sensor."""
        attributes = {}
        
        if self._db_stats.connected:
            tables_info = []
            for table in self._db_stats.tables:
                tables_info.append({
                    "name": table["name"],
                    "rows": table["rows"],
                    "size_mb": round(table["size"] / (1024 * 1024), 2) if table["size"] else 0
                })
                
            attributes["tables"] = tables_info
            attributes["database_name"] = self._db_stats.database
            attributes["total_tables"] = len(self._db_stats.tables)
        else:
            attributes["error"] = self._db_stats.error_message
            
        return attributes

    async def async_update(self):
        """Atualiza o estado do sensor."""
        await self.hass.async_add_executor_job(self._db_stats.update)
