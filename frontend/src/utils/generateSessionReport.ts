export interface SessionReportData {
  initialBalance: number;
  operationResult: number;
  entryValue: number;
  selectedNumbers: number[];
  startTime: string;
  endTime: string;
  totalDuration: string;
  blackCount: number;
  blackPercentage: string;
  redCount: number;
  redPercentage: string;
  greenCount: number;
  greenPercentage: string;
  wins: number;
  winPercentage: string;
  winValue: number;
  losses: number;
  lossPercentage: string;
  lossValue: number;
  balanceHistory: number[];
}

export const generateSessionReport = (data: SessionReportData): void => {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'green';
    if (redNumbers.includes(num)) return 'red';
    if (blackNumbers.includes(num)) return 'black';
    return 'gray';
  };

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumo da Sessão de Apostas - Roleta 171</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 16px;
      opacity: 0.9;
    }

    .content {
      padding: 40px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
      padding: 24px;
      border-left: 4px solid #3b82f6;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .stat-card.positive {
      border-left-color: #10b981;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .stat-card.negative {
      border-left-color: #ef4444;
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-value.positive {
      color: #10b981;
    }

    .stat-value.negative {
      color: #ef4444;
    }

    .section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #e2e8f0;
    }

    .numbers-container {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .numbers-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .number-chip {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: white;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .number-chip.red {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .number-chip.black {
      background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    }

    .number-chip.green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .color-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .color-stat {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 2px solid #e2e8f0;
    }

    .color-stat-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .color-stat-value {
      font-size: 24px;
      font-weight: 700;
    }

    .win-loss-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }

    .win-loss-card {
      border-radius: 12px;
      padding: 24px;
      border: 2px solid;
    }

    .win-loss-card.win {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #10b981;
    }

    .win-loss-card.loss {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border-color: #ef4444;
    }

    .win-loss-label {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .win-loss-label.win {
      color: #059669;
    }

    .win-loss-label.loss {
      color: #dc2626;
    }

    .win-loss-value {
      font-size: 28px;
      font-weight: 700;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .win-loss-value.win {
      color: #10b981;
    }

    .win-loss-value.loss {
      color: #ef4444;
    }

    .win-loss-percentage {
      font-size: 18px;
      font-weight: 600;
    }

    .win-loss-money {
      font-size: 20px;
      font-weight: 600;
      margin-left: auto;
    }

    .chart-container {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .chart-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
    }

    .chart {
      position: relative;
      height: 400px;
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 2px solid #e2e8f0;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(249, 115, 22, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 1000;
    }

    .print-button:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 24px rgba(249, 115, 22, 0.5);
    }

    .print-button:active {
      transform: scale(0.95);
    }

    .time-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }

    .time-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #f59e0b;
    }

    .time-label {
      font-size: 12px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .time-value {
      font-size: 24px;
      font-weight: 700;
      color: #78350f;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .print-button {
        display: none;
      }

      .container {
        box-shadow: none;
      }

      .stat-card:hover,
      .print-button:hover {
        transform: none;
        box-shadow: none;
      }
    }

    @media (max-width: 768px) {
      .stats-grid,
      .color-stats,
      .win-loss-grid,
      .time-info {
        grid-template-columns: 1fr;
      }

      .header h1 {
        font-size: 24px;
      }

      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Resumo da Sessão de Apostas</h1>
      <p>Progressão de Cores - Roleta 171</p>
    </div>

    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Saldo Inicial na Operação</div>
          <div class="stat-value">R$ ${data.initialBalance.toFixed(2)}</div>
        </div>

        <div class="stat-card ${data.operationResult >= 0 ? 'positive' : 'negative'}">
          <div class="stat-label">Resultado da Operação</div>
          <div class="stat-value ${data.operationResult >= 0 ? 'positive' : 'negative'}">
            R$ ${data.operationResult.toFixed(2)}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Valor de Entrada</div>
          <div class="stat-value">R$ ${data.entryValue.toFixed(2)}</div>
        </div>
      </div>

      <div class="time-info">
        <div class="time-card">
          <div class="time-label">Hora Inicial</div>
          <div class="time-value">${data.startTime}</div>
        </div>

        <div class="time-card">
          <div class="time-label">Hora Final</div>
          <div class="time-value">${data.endTime}</div>
        </div>

        <div class="time-card">
          <div class="time-label">Tempo Total da Operação</div>
          <div class="time-value">${data.totalDuration}</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Números Selecionados (${data.selectedNumbers.length})</h2>
        <div class="numbers-container">
          <div class="numbers-grid">
            ${data.selectedNumbers.map(num => `
              <div class="number-chip ${getNumberColor(num)}">
                ${num}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="color-stats">
          <div class="color-stat">
            <div class="color-stat-label">Total Preto</div>
            <div class="color-stat-value" style="color: #374151;">
              ${data.blackCount} (${data.blackPercentage}%)
            </div>
          </div>

          <div class="color-stat">
            <div class="color-stat-label">Total Vermelho</div>
            <div class="color-stat-value" style="color: #ef4444;">
              ${data.redCount} (${data.redPercentage}%)
            </div>
          </div>

          <div class="color-stat">
            <div class="color-stat-label">Total Verde</div>
            <div class="color-stat-value" style="color: #10b981;">
              ${data.greenCount} (${data.greenPercentage}%)
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Resultados</h2>
        <div class="win-loss-grid">
          <div class="win-loss-card win">
            <div class="win-loss-label win">Total Win</div>
            <div class="win-loss-value win">
              <span>${data.wins}</span>
              <span class="win-loss-percentage">(${data.winPercentage}%)</span>
              <span class="win-loss-money">R$ ${data.winValue.toFixed(2)}</span>
            </div>
          </div>

          <div class="win-loss-card loss">
            <div class="win-loss-label loss">Total Loss</div>
            <div class="win-loss-value loss">
              <span>${data.losses}</span>
              <span class="win-loss-percentage">(${data.lossPercentage}%)</span>
              <span class="win-loss-money">R$ ${data.lossValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Gráfico de Progressão</h2>
        <div class="chart-container">
          <div class="chart-title">Evolução do Saldo ao Longo da Operação</div>
          <div class="chart">
            <svg class="chart-svg" id="progressChart"></svg>
          </div>
        </div>
      </div>
    </div>
  </div>

  <button class="print-button" onclick="window.print()" title="Imprimir Relatório">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  </button>

  <script>
    function drawChart() {
      const svg = document.getElementById('progressChart');
      const balanceHistory = ${JSON.stringify(data.balanceHistory)};
      
      if (!svg || balanceHistory.length === 0) return;

      const width = svg.clientWidth;
      const height = svg.clientHeight;
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      svg.innerHTML = '';

      const maxBalance = Math.max(...balanceHistory, 0);
      const minBalance = Math.min(...balanceHistory, 0);
      const range = maxBalance - minBalance || 1;

      const xStep = chartWidth / (balanceHistory.length - 1 || 1);
      const yScale = chartHeight / range;

      const zeroY = padding + (maxBalance * yScale);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', padding);
      line.setAttribute('y1', zeroY);
      line.setAttribute('x2', width - padding);
      line.setAttribute('y2', zeroY);
      line.setAttribute('stroke', '#94a3b8');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '5,5');
      svg.appendChild(line);

      const zeroText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      zeroText.setAttribute('x', padding - 10);
      zeroText.setAttribute('y', zeroY + 5);
      zeroText.setAttribute('text-anchor', 'end');
      zeroText.setAttribute('fill', '#64748b');
      zeroText.setAttribute('font-size', '12');
      zeroText.textContent = 'R$ 0.00';
      svg.appendChild(zeroText);

      let pathData = '';
      balanceHistory.forEach((balance, index) => {
        const x = padding + (index * xStep);
        const y = padding + ((maxBalance - balance) * yScale);
        
        if (index === 0) {
          pathData += \`M \${x} \${y}\`;
        } else {
          pathData += \` L \${x} \${y}\`;
        }
      });

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#3b82f6');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);

      balanceHistory.forEach((balance, index) => {
        const x = padding + (index * xStep);
        const y = padding + ((maxBalance - balance) * yScale);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', balance >= 0 ? '#10b981' : '#ef4444');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = \`Aposta \${index + 1}: R$ \${balance.toFixed(2)}\`;
        circle.appendChild(title);
      });

      const maxText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      maxText.setAttribute('x', padding - 10);
      maxText.setAttribute('y', padding + 5);
      maxText.setAttribute('text-anchor', 'end');
      maxText.setAttribute('fill', '#10b981');
      maxText.setAttribute('font-size', '12');
      maxText.setAttribute('font-weight', 'bold');
      maxText.textContent = \`R$ \${maxBalance.toFixed(2)}\`;
      svg.appendChild(maxText);

      const minText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      minText.setAttribute('x', padding - 10);
      minText.setAttribute('y', height - padding + 5);
      minText.setAttribute('text-anchor', 'end');
      minText.setAttribute('fill', '#ef4444');
      minText.setAttribute('font-size', '12');
      minText.setAttribute('font-weight', 'bold');
      minText.textContent = \`R$ \${minBalance.toFixed(2)}\`;
      svg.appendChild(minText);

      // Add intermediate metric labels on the left side
      const quarterRange = range / 4;
      for (let i = 1; i <= 3; i++) {
        const value = maxBalance - (quarterRange * i);
        const y = padding + (chartHeight * i / 4);
        
        const metricLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        metricLine.setAttribute('x1', padding);
        metricLine.setAttribute('y1', y);
        metricLine.setAttribute('x2', width - padding);
        metricLine.setAttribute('y2', y);
        metricLine.setAttribute('stroke', '#e2e8f0');
        metricLine.setAttribute('stroke-width', '1');
        metricLine.setAttribute('stroke-dasharray', '3,3');
        svg.appendChild(metricLine);
        
        const metricText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        metricText.setAttribute('x', padding - 10);
        metricText.setAttribute('y', y + 4);
        metricText.setAttribute('text-anchor', 'end');
        metricText.setAttribute('fill', '#94a3b8');
        metricText.setAttribute('font-size', '11');
        metricText.textContent = \`R$ \${value.toFixed(2)}\`;
        svg.appendChild(metricText);
      }

      // Add summary metrics on the right side
      const finalBalance = balanceHistory[balanceHistory.length - 1] || 0;
      const profitLossPercentage = ${data.initialBalance} > 0 ? ((finalBalance / ${data.initialBalance}) * 100).toFixed(1) : '0.0';
      const profitLossText = finalBalance >= 0 ? 'Lucro' : 'Prejuízo';
      const profitLossColor = finalBalance >= 0 ? '#10b981' : '#ef4444';
      
      const summaryY = padding + 20;
      
      const summaryBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      summaryBg.setAttribute('x', width - padding - 150);
      summaryBg.setAttribute('y', summaryY - 15);
      summaryBg.setAttribute('width', '140');
      summaryBg.setAttribute('height', '80');
      summaryBg.setAttribute('fill', 'white');
      summaryBg.setAttribute('stroke', '#e2e8f0');
      summaryBg.setAttribute('stroke-width', '2');
      summaryBg.setAttribute('rx', '8');
      svg.appendChild(summaryBg);
      
      const summaryTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      summaryTitle.setAttribute('x', width - padding - 80);
      summaryTitle.setAttribute('y', summaryY);
      summaryTitle.setAttribute('text-anchor', 'middle');
      summaryTitle.setAttribute('fill', '#64748b');
      summaryTitle.setAttribute('font-size', '12');
      summaryTitle.setAttribute('font-weight', 'bold');
      summaryTitle.textContent = 'Resultado Final';
      svg.appendChild(summaryTitle);
      
      const summaryValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      summaryValue.setAttribute('x', width - padding - 80);
      summaryValue.setAttribute('y', summaryY + 25);
      summaryValue.setAttribute('text-anchor', 'middle');
      summaryValue.setAttribute('fill', profitLossColor);
      summaryValue.setAttribute('font-size', '16');
      summaryValue.setAttribute('font-weight', 'bold');
      summaryValue.textContent = \`R$ \${finalBalance.toFixed(2)}\`;
      svg.appendChild(summaryValue);
      
      const summaryPercentage = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      summaryPercentage.setAttribute('x', width - padding - 80);
      summaryPercentage.setAttribute('y', summaryY + 45);
      summaryPercentage.setAttribute('text-anchor', 'middle');
      summaryPercentage.setAttribute('fill', profitLossColor);
      summaryPercentage.setAttribute('font-size', '14');
      summaryPercentage.setAttribute('font-weight', '600');
      summaryPercentage.textContent = \`\${profitLossText}: \${profitLossPercentage}%\`;
      svg.appendChild(summaryPercentage);

      const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      xAxisLabel.setAttribute('x', width / 2);
      xAxisLabel.setAttribute('y', height - 5);
      xAxisLabel.setAttribute('text-anchor', 'middle');
      xAxisLabel.setAttribute('fill', '#64748b');
      xAxisLabel.setAttribute('font-size', '14');
      xAxisLabel.setAttribute('font-weight', '600');
      xAxisLabel.textContent = 'Numero de Apostas: ' + balanceHistory.length;
      svg.appendChild(xAxisLabel);

      const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yAxisLabel.setAttribute('x', -height / 2);
      yAxisLabel.setAttribute('y', 15);
      yAxisLabel.setAttribute('text-anchor', 'middle');
      yAxisLabel.setAttribute('fill', '#64748b');
      yAxisLabel.setAttribute('font-size', '14');
      yAxisLabel.setAttribute('font-weight', '600');
      yAxisLabel.setAttribute('transform', \`rotate(-90 0 0)\`);
      yAxisLabel.textContent = 'Saldo (R$)';
      svg.appendChild(yAxisLabel);
    }

    window.addEventListener('load', drawChart);
    window.addEventListener('resize', drawChart);
  </script>
</body>
</html>
  `;

  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
};
