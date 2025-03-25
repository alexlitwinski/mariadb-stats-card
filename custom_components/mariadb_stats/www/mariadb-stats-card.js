class MariaDBStatsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    if (!this.content) {
      // Criar elementos base uma única vez
      const card = document.createElement('ha-card');
      
      const style = document.createElement('style');
      style.textContent = `
        ha-card {
          padding: 16px;
        }
        .header {
          font-size: 1.2em;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
        }
        .header ha-icon {
          margin-right: 8px;
        }
        .db-info {
          margin-bottom: 16px;
        }
        .info-item {
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }
        .info-label {
          font-weight: 500;
        }
        .table-container {
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          margin-top: 16px;
        }
        .table-row {
          display: flex;
          padding: 8px;
          border-bottom: 1px solid var(--divider-color);
        }
        .table-row:last-child {
          border-bottom: none;
        }
        .table-header {
          font-weight: bold;
          background-color: var(--secondary-background-color);
        }
        .table-name {
          flex: 3;
        }
        .table-rows, .table-size {
          flex: 1;
          text-align: right;
        }
      `;

      this.content = document.createElement('div');
      card.appendChild(this.content);
      
      this.shadowRoot.appendChild(style);
      this.shadowRoot.appendChild(card);
    }

    // Obter configuração e entidade
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];
    
    if (!stateObj) {
      this.content.innerHTML = `
        <div>Entidade não encontrada: ${entityId}</div>
      `;
      return;
    }

    // Obter dados
    const title = this.config.title || 'Estatísticas do MariaDB';
    const icon = this.config.icon || 'mdi:database';
    const dbSize = stateObj.state;
    const tables = stateObj.attributes.tables || [];
    const dbName = stateObj.attributes.database_name || 'homeassistant';
    const totalTables = stateObj.attributes.total_tables || 0;
    const error = stateObj.attributes.error;

    // Construir HTML
    let html = `
      <div class="header">
        <ha-icon icon="${icon}"></ha-icon>
        ${title}
      </div>
    `;

    if (error) {
      html += `<div style="color: var(--error-color)">Erro: ${error}</div>`;
    } else {
      html += `
        <div class="db-info">
          <div class="info-item">
            <span class="info-label">Banco de dados:</span>
            <span>${dbName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tamanho total:</span>
            <span>${dbSize} MB</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total de tabelas:</span>
            <span>${totalTables}</span>
          </div>
        </div>
      `;

      if (tables && tables.length > 0) {
        html += `
          <div class="table-container">
            <div class="table-row table-header">
              <div class="table-name">Tabela</div>
              <div class="table-rows">Registros</div>
              <div class="table-size">Tamanho (MB)</div>
            </div>
        `;

        tables.forEach(table => {
          html += `
            <div class="table-row">
              <div class="table-name">${table.name}</div>
              <div class="table-rows">${table.rows}</div>
              <div class="table-size">${table.size_mb}</div>
            </div>
          `;
        });

        html += `</div>`;
      }
    }

    this.content.innerHTML = html;
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
}

customElements.define('mariadb-stats-card', MariaDBStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'mariadb-stats-card',
  name: 'MariaDB Stats Card',
  description: 'Card para exibir estatísticas do banco de dados MariaDB do Home Assistant'
});
