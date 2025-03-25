class MariaDBStatsCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      this.innerHTML = `
        <ha-card>
          <div class="card-content">
            <div id="mariadb-content"></div>
          </div>
        </ha-card>
      `;
      this.content = this.querySelector('#mariadb-content');
    }

    const entityId = this.config.entity;
    if (!entityId || !hass.states[entityId]) {
      this.content.innerHTML = `Entidade não encontrada: ${entityId || 'não especificada'}`;
      return;
    }

    const state = hass.states[entityId];
    const title = this.config.title || 'Estatísticas do MariaDB';
    const dbSize = state.state;
    const dbName = state.attributes.database_name || '';
    const totalTables = state.attributes.total_tables || 0;
    const tables = state.attributes.tables || [];

    let html = `<h3>${title}</h3>
                <p>Banco de dados: ${dbName}</p>
                <p>Tamanho total: ${dbSize} MB</p>
                <p>Total de tabelas: ${totalTables}</p>`;

    if (tables.length > 0) {
      html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
      html += '<tr style="font-weight: bold; background-color: #f0f0f0;">';
      html += '<td style="padding: 8px; border: 1px solid #ddd;">Tabela</td>';
      html += '<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Registros</td>';
      html += '<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">Tamanho (MB)</td>';
      html += '</tr>';
      
      tables.forEach(table => {
        html += `<tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${table.name}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${table.rows}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${table.size_mb}</td>
                </tr>`;
      });
      
      html += '</table>';
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
    return 4;
  }
}

customElements.define('mariadb-stats-card', MariaDBStatsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'mariadb-stats-card',
  name: 'MariaDB Stats Card',
  description: 'Card para estatísticas do MariaDB'
});
