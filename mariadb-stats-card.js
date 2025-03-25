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

  render() {
    if (!this.entity) {
      return html`
        <ha-card>
          <div class="card-content">
            Entidade não encontrada: ${this.config.entity}
          </div>
        </ha-card>
      `;
    }

    const stateObj = this.entity;
    const title = this.config.title || 'Estatísticas do MariaDB';
    const icon = this.config.icon || 'mdi:database';
    const dbSize = stateObj.state;
    const tables = stateObj.attributes.tables || [];
    const dbName = stateObj.attributes.database_name || 'homeassistant';
    const totalTables = stateObj.attributes.total_tables || 0;
    const error = stateObj.attributes.error;

    return html`
      <ha-card>
        <div class="card-header">
          <ha-icon icon="${icon}"></ha-icon>
          <div class="title">${title}</div>
        </div>
        <div class="card-content">
          ${error ? html`
            <div class="error">
              Erro: ${error}
            </div>
          ` : html`
            <div class="db-info">
              <div class="info-row">
                <span class="label">Banco de dados:</span>
                <span class="value">${dbName}</span>
              </div>
              <div class="info-row">
                <span class="label">Tamanho total:</span>
                <span class="value">${dbSize} MB</span>
              </div>
              <div class="info-row">
                <span class="label">Total de tabelas:</span>
                <span class="value">${totalTables}</span>
              </div>
            </div>

            <div class="tables-container">
              <div class="table-header">
                <div class="table-name">Tabela</div>
                <div class="table-rows">Registros</div>
                <div class="table-size">Tamanho</div>
              </div>
              ${tables.map(table => html`
                <div class="table-row">
                  <div class="table-name">${table.name}</div>
                  <div class="table-rows">${table.rows}</div>
                  <div class="table-size">${table.size_mb} MB</div>
                </div>
              `)}
            </div>
          `}
        </div>
      </ha-card>
    `;
  }

  renderStyle() {
    return html`
      <style>
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
      </style>
    `;
  }

  updated(changedProps) {
    if (!this.entity) {
      this.entity = this.hass.states[this.config.entity];
    }
    
    const root = this.shadowRoot;
    if (root) {
      const elements = [this.renderStyle(), this.render()];
      root.innerHTML = '';
      elements.forEach(el => {
        root.appendChild(el);
      });
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.entity = hass.states[this.config.entity];
    this.updated();
  }
}

const html = (strings, ...values) => {
  const result = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || '');
  }, '');
  const template = document.createElement('template');
  template.innerHTML = result;
  return template.content;
};

customElements.define('mariadb-stats-card', MariaDBStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'mariadb-stats-card',
  name: 'MariaDB Stats Card',
  description: 'Card para exibir estatísticas do banco de dados MariaDB do Home Assistant'
});
