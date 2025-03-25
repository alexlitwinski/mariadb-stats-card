# MariaDB Stats para Home Assistant

Este componente permite visualizar estatísticas do banco de dados MariaDB utilizado pelo Home Assistant.

## Características

- Exibe o tamanho total do banco de dados
- Lista todas as tabelas com o número de registros e tamanho
- Atualizações periódicas das informações
- Interface amigável em um card para o Lovelace

## Configuração Rápida

```yaml
# Via configuration.yaml
sensor:
  - platform: mariadb_stats
    host: localhost
    port: 3306
    username: seu_usuario
    password: sua_senha
    database: homeassistant

# No Lovelace
type: 'custom:mariadb-stats-card'
entity: sensor.mariadb_stats
title: 'Estatísticas do MariaDB'
```

## Captura de Tela

![Exemplo do Card](https://raw.githubusercontent.com/seu_usuario/ha-mariadb-stats/main/images/card_example.png)
