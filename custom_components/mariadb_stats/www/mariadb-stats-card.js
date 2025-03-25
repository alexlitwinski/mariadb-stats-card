class MariaDBStatsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Você precisa definir uma entidade');
    }
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  static getStubConfig() {
    return {
      entity: 'sensor.mariadb_stats',
      title: 'Estatísticas do MariaDB'
    };
  }

  _createElementWithText(type, text) {
    const element = document.createElement(type);
    element.textContent = text;
    return element;
  }

  render() {
    if (!this.hass || !this.config) {
      return;
    }

    const entityId = this.config.entity;
    if (!entityId || !this.hass.states[entityId]) {
      const errorCard = document.createElement('ha-card');
      const content = document.createElement('div');
      content.className = 'card-content';
      content.textContent = `Entidade não encontrada: ${entityId || 'não especificada'}`;
      errorCard.appendChild(content);
      return errorCard;
    }

    const stateObj = this.hass.states[entityId];
    const title = this.config.title || 'Estatísticas do MariaDB';
    const icon = this.config.icon || 'mdi:database';
    const dbSize = stateObj.state;
    const tables = stateObj.attributes.tables || [];
    const dbName = stateObj.attributes.database_name || 'homeassistant';
    const totalTables = stateObj.attributes.total_tables || 0;
    const error = stateObj.attributes.error;

    // Criar o card
    const card = document.createElement('ha-card');
    
    // Criar cabeçalho
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const iconElement = document.createElement('ha-icon');
    iconElement.setAttribute('icon', icon);
    
    const titleElement = document.createElement('div');
    titleElement.className = 'title';
    titleElement.textContent = title;
    
    header.appendChild(iconElement);
    header.appendChild(titleElement);
    card.appendChild(header);
    
    // Criar conteúdo
    const content = document.createElement('div');
    content.className = 'card-content';
    
    if (error) {
      const errorElement = document.createElement('div');
      errorElement.className = 'error';
      errorElement.textContent = `Erro: ${error}`;
      content.appendChild(errorElement);
    } else {
      // Info do banco
      const dbInfo = document.createElement('div');
      dbInfo.className = 'db-info';
      
      // Linha 1: Nome do banco
      const dbNameRow = document.createElement('div');
      dbNameRow.className = 'info-row';
      
      const dbNameLabel = document.createElement('span');
      dbNameLabel.className = 'label';
      dbNameLabel.textContent = 'Banco de dados:';
      
      const dbNameValue = document.createElement('span');
      dbNameValue.className = 'value';
      dbNameValue.textContent = dbName;
      
      dbNameRow.appendChild(dbNameLabel);
      dbNameRow.appendChild(dbNameValue);
      dbInfo.appendChild(dbNameRow);
      
      // Linha 2: Tamanho total
      const dbSizeRow = document.createElement('div');
      dbSizeRow.className = 'info-row';
      
      const dbSizeLabel = document.createElement('span');
      dbSizeLabel.className = 'label';
      dbSizeLabel.textContent = 'Tamanho total:';
      
      const dbSizeValue = document.createElement('span');
      dbSizeValue.className = 'value';
      dbSizeValue.textContent = `${dbSize} MB`;
      
      dbSizeRow.appendChild(dbSizeLabel);
      dbSizeRow.appendChild(dbSizeValue);
      dbInfo.appendChild(dbSizeRow);
      
      // Linha 3: Total de tabelas
      const tablesRow = document.createElement('div');
      tablesRow.className = 'info-row';
      
      const tablesLabel = document.createElement('span');
      tablesLabel.className = 'label';
      tablesLabel.textContent = 'Total de tabelas:';
      
      const tablesValue = document.createElement('span');
      tablesValue.className = 'value';
      tablesValue.textContent = totalTables;
      
      tablesRow.appendChild(tablesLabel);
      tablesRow.appendChild(tablesValue);
      dbInfo.appendChild(tablesRow);
      
      content.appendChild(dbInfo);
      
      // Contêiner de tabelas
      if (tables && tables.length > 0) {
        const tablesContainer = document.createElement('div');
        tablesContainer.className = 'tables-container';
        
        // Cabeçalho da tabela
        const tableHeader = document.createElement('div');
        tableHeader.className = 'table-header';
        
        const tableNameHeader = document.createElement('div');
        tableNameHeader.className = 'table-name';
        tableNameHeader.textContent = 'Tabela';
        
        const tableRowsHeader = document.createElement('div');
        tableRowsHeader.className = 'table-rows';
        tableRowsHeader.textContent = 'Registros';
        
        const tableSizeHeader = document.createElement('div');
        tableSizeHeader.className = 'table-size';
        tableSizeHeader.textContent = 'Tamanho';
        
        tableHeader.appendChild(tableNameHeader);
        tableHeader.appendChild(tableRowsHeader);
        tableHeader.appendChild(tableSizeHeader);
        tablesContainer.appendChild(tableHeader);
        
        // Linhas da tabela
        tables.forEach(table => {
          const tableRow = document.createElement('div');
          tableRow.className = 'table-row';
          
          const tableName = document.createElement('div');
          tableName.className = 'table-name';
          tableName.textContent = table.name;
          
          const tableRows = document.createElement('div');
          tableRows.className = 'table-rows';
          tableRows.textContent = table.rows;
          
          const tableSize = document.createElement('div');
          tableSize.className = 'table-size';
          tableSize.textContent = `${table.size_mb} MB`;
          
          tableRow.appendChild(tableName);
          tableRow.appendChild(tableRows);
          tableRow.appendChild(tableSize);
          tablesContainer.appendChild(tableRow);
        });
        
        content.appendChild(tablesContainer);
      }
    }
    
    card.appendChild(content);
    
    // Adicionar estilos
    const style = document.createElement('style');
    style.textContent = `
      ha-card {
        padding: 16px 0;
      }
      .card-header {
        display: flex;
        align-items: center;
        padding: 0 16px 16px;
        color: var(--ha-card-header-color, --primary-text-color);
      }
      .card-header ha-icon {
        color: var(--ha-card-header-color, --primary-text-color);
        margin-right: 8px;
      }
      .card-content {
        padding: 0 16px;
      }
      .title {
        font-size: 1.2em;
        font-weight: 500;
      }
      .db-info {
        margin-bottom: 16px;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .label {
        font-weight: 500;
      }
      .tables-container {
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        overflow: hidden;
      }
      .table-header {
        display: flex;
        background-color: var(--secondary-background-color);
        padding: 8px;
        font-weight: 500;
      }
      .table-row {
        display: flex;
        padding: 8px;
        border-top: 1px solid var(--divider-color);
      }
      .table-name {
        flex: 3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .table-rows {
        flex: 1;
        text-align: right;
      }
      .table-size {
        flex: 1;
        text-align: right;
      }
      .error {
        color: var(--error-color);
      }
    `;
    
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }
}

customElements.define('mariadb-stats-card', MariaDBStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'mariadb-stats-card',
  name: 'MariaDB Stats Card',
  description: 'Card para exibir estatísticas do banco de dados MariaDB do Home Assistant'
});
