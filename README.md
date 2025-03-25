# MariaDB Stats for Home Assistant

Este componente permite monitorar estatísticas do banco de dados MariaDB utilizado pelo Home Assistant, exibindo informações como tamanho total do banco de dados e estatísticas de cada tabela.

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

![Exemplo do Card](./images/card_example.png)

## Recursos

- Exibe o tamanho total do banco de dados do Home Assistant
- Lista todas as tabelas com suas estatísticas
  - Nome da tabela
  - Número de registros
  - Tamanho de cada tabela
- Atualização periódica das informações

## Pré-requisitos

- Home Assistant instalado
- Banco de dados MariaDB/MySQL configurado para o Home Assistant
- HACS (Home Assistant Community Store) instalado

## Instalação

### Instalação via HACS

1. Acesse o HACS no seu Home Assistant
2. Clique em "Integrações"
3. Clique no botão de menu (três pontos) no canto superior direito
4. Selecione "Repositórios Personalizados"
5. Adicione o URL deste repositório: `https://github.com/seu_usuario/ha-mariadb-stats`
6. Categoria: Integração
7. Clique em "Adicionar"
8. Procure por "MariaDB Stats" e instale

### Instalação Manual

1. Baixe o repositório
2. Copie a pasta `custom_components/mariadb_stats` para o diretório `custom_components` do seu Home Assistant
3. Reinicie o Home Assistant

## Configuração

### Configuração via Interface

1. Navegue até Configurações -> Integrações
2. Clique no botão "+" para adicionar uma nova integração
3. Procure por "MariaDB Stats"
4. Preencha os dados de conexão ao seu banco de dados:
   - Host (padrão: localhost)
   - Porta (padrão: 3306)
   - Usuário
   - Senha
   - Nome do banco de dados (padrão: homeassistant)

### Configuração via YAML

Adicione o seguinte ao seu arquivo `configuration.yaml`:

```yaml
sensor:
  - platform: mariadb_stats
    host: localhost
    port: 3306
    username: seu_usuario
    password: sua_senha
    database: homeassistant
```

## Uso no Lovelace

Depois de instalado e configurado, você pode adicionar o card ao seu painel do Lovelace:

1. Abra seu painel do Lovelace
2. Clique em "Editar Painel"
3. Clique em "+" para adicionar um novo card
4. Procure por "MariaDB Stats Card"
5. Configure o card:

```yaml
type: 'custom:mariadb-stats-card'
entity: sensor.mariadb_stats
title: 'Estatísticas do MariaDB'
```

## Resolução de Problemas

Se você encontrar problemas:

1. Verifique os logs do Home Assistant para mensagens de erro
2. Verifique se as credenciais do banco de dados estão corretas
3. Certifique-se de que o usuário do banco de dados tem permissões para acessar as informações do schema

## Limitações Conhecidas

- O componente atualiza os dados a cada 30 minutos para reduzir a carga no banco de dados
- O usuário do banco de dados precisa ter privilégios para consultar tabelas no `information_schema`

## Suporte

Se você encontrar bugs ou quiser solicitar novos recursos, abra uma issue no [GitHub](https://github.com/seu_usuario/ha-mariadb-stats/issues).

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
