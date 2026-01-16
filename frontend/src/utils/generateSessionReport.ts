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
  betProgression?: number[];
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 10px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      position: relative;
    }

    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }

    .header h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .header p {
      font-size: 13px;
      opacity: 0.9;
    }

    .content {
      padding: 15px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 8px;
      padding: 12px;
      border-left: 3px solid #3b82f6;
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
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-value {
      font-size: 16px;
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
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title-count {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }

    .numbers-container {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .numbers-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-height: 120px;
      overflow-y: auto;
    }

    .numbers-grid::-webkit-scrollbar {
      width: 8px;
    }

    .numbers-grid::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }

    .numbers-grid::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .numbers-grid::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .number-chip {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: white;
      font-weight: 700;
      font-size: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
      gap: 10px;
      margin-bottom: 12px;
    }

    .color-stat {
      background: white;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    .color-stat-label {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .color-stat-value {
      font-size: 16px;
      font-weight: 700;
    }

    .win-loss-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .win-loss-card {
      border-radius: 8px;
      padding: 12px;
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
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .win-loss-label.win {
      color: #059669;
    }

    .win-loss-label.loss {
      color: #dc2626;
    }

    .win-loss-value {
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .win-loss-value.win {
      color: #10b981;
    }

    .win-loss-value.loss {
      color: #ef4444;
    }

    .win-loss-percentage {
      font-size: 13px;
      font-weight: 600;
    }

    .win-loss-money {
      font-size: 14px;
      font-weight: 600;
      margin-left: auto;
    }

    .chart-container {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
    }

    .chart-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 10px;
    }

    .chart {
      position: relative;
      height: 250px;
      background: white;
      border-radius: 6px;
      padding: 8px;
      border: 1px solid #e2e8f0;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .progression-container {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .progression-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
    }

    .progression-item {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      border: 2px solid #f59e0b;
    }

    .progression-number {
      font-size: 10px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .progression-value {
      font-size: 14px;
      font-weight: 700;
      color: #78350f;
    }

    .pdf-buttons {
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    }

    .pdf-button {
      width: 50px;
      height: 50px;
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
    }

    .pdf-button:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 24px rgba(249, 115, 22, 0.5);
    }

    .pdf-button:active {
      transform: scale(0.95);
    }

    .pdf-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .time-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .time-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 8px;
      padding: 10px;
      border-left: 3px solid #f59e0b;
    }

    .time-label {
      font-size: 9px;
      color: #92400e;
      font-weight: 600;
      margin-bottom: 3px;
      text-transform: uppercase;
    }

    .time-value {
      font-size: 14px;
      font-weight: 700;
      color: #78350f;
    }

    @media print {
      @page {
        size: A4;
        margin: 8mm;
      }

      body {
        background: white;
        padding: 0;
        margin: 0;
      }

      .pdf-buttons {
        display: none;
      }

      .container {
        box-shadow: none;
        border-radius: 0;
        max-width: 100%;
        page-break-inside: avoid;
      }

      .header {
        padding: 8px 12px;
        page-break-after: avoid;
      }

      .header h1 {
        font-size: 16px;
        margin-bottom: 3px;
      }

      .header p {
        font-size: 11px;
      }

      .content {
        padding: 10px 12px;
      }

      .stats-grid {
        gap: 6px;
        margin-bottom: 8px;
      }

      .stat-card {
        padding: 6px 8px;
        page-break-inside: avoid;
      }

      .stat-label {
        font-size: 8px;
        margin-bottom: 2px;
      }

      .stat-value {
        font-size: 12px;
      }

      .time-info {
        gap: 6px;
        margin-bottom: 8px;
      }

      .time-card {
        padding: 6px 8px;
      }

      .time-label {
        font-size: 8px;
        margin-bottom: 2px;
      }

      .time-value {
        font-size: 12px;
      }

      .section {
        margin-bottom: 8px;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 12px;
        margin-bottom: 5px;
        padding-bottom: 3px;
        border-bottom-width: 2px;
      }

      .section-title-count {
        font-size: 10px;
      }

      .numbers-container {
        padding: 6px;
        margin-bottom: 5px;
      }

      .numbers-grid {
        max-height: none;
        gap: 3px;
      }

      .number-chip {
        width: 24px;
        height: 24px;
        font-size: 10px;
      }

      .color-stats {
        gap: 6px;
        margin-bottom: 5px;
      }

      .color-stat {
        padding: 5px 6px;
      }

      .color-stat-label {
        font-size: 8px;
        margin-bottom: 2px;
      }

      .color-stat-value {
        font-size: 12px;
      }

      .win-loss-grid {
        gap: 6px;
        margin-bottom: 8px;
      }

      .win-loss-card {
        padding: 6px 8px;
      }

      .win-loss-label {
        font-size: 10px;
        margin-bottom: 4px;
      }

      .win-loss-value {
        font-size: 14px;
      }

      .win-loss-percentage {
        font-size: 11px;
      }

      .win-loss-money {
        font-size: 12px;
      }

      .chart-container {
        padding: 8px;
        margin-bottom: 0;
        page-break-inside: avoid;
      }

      .chart-title {
        font-size: 11px;
        margin-bottom: 5px;
      }

      .chart {
        height: 280px;
        padding: 8px;
      }

      .stat-card:hover,
      .pdf-button:hover {
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

        <div class="stat-card">
          <div class="stat-label">Data da Operação</div>
          <div class="stat-value" style="font-size: 13px; line-height: 1.2;">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</div>
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
        <h2 class="section-title">
          <span>${String(data.selectedNumbers.length).padStart(2, '0')} - Números Selecionados</span>
        </h2>
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

          <div class="win-loss-card ${data.operationResult >= 0 ? 'win' : 'loss'}">
            <div class="win-loss-label ${data.operationResult >= 0 ? 'win' : 'loss'}">Resultado da Operação</div>
            <div class="win-loss-value ${data.operationResult >= 0 ? 'win' : 'loss'}">
              <span style="font-size: 32px;">R$ ${data.operationResult.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Progressão de Apostas</h2>
        ${data.betProgression && data.betProgression.length > 0 ? `
        <div class="progression-container">
          <div class="progression-grid">
            ${data.betProgression.map((value, index) => `
              <div class="progression-item">
                <div class="progression-number">#${index + 1}</div>
                <div class="progression-value">R$ ${value.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
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

  <div class="pdf-buttons">
    <button class="pdf-button" id="downloadPdfBtn" title="Gerar PDF">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    </button>
  </div>

  <script>
    // PDF Generation with jsPDF + html2canvas
    document.getElementById('downloadPdfBtn').addEventListener('click', async function() {
      const button = this;
      button.disabled = true;
      button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
      
      try {
        // Hide buttons before capturing
        const buttons = document.querySelector('.pdf-buttons');
        buttons.style.display = 'none';
        
        const element = document.querySelector('.container');
        
        // Capture the element as canvas
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // A4 dimensions in mm
        const a4Width = 210;
        const a4Height = 297;
        const margin = 10;
        
        // Available space for content
        const contentWidth = a4Width - (margin * 2);
        const contentHeight = a4Height - (margin * 2);
        
        // Canvas dimensions in pixels
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate aspect ratio
        const canvasRatio = canvasHeight / canvasWidth;
        const contentRatio = contentHeight / contentWidth;
        
        // Calculate final dimensions to fit in A4
        let finalWidth, finalHeight;
        if (canvasRatio > contentRatio) {
          // Height is the limiting factor
          finalHeight = contentHeight;
          finalWidth = finalHeight / canvasRatio;
        } else {
          // Width is the limiting factor
          finalWidth = contentWidth;
          finalHeight = finalWidth * canvasRatio;
        }
        
        // Center the content
        const xOffset = margin + (contentWidth - finalWidth) / 2;
        const yOffset = margin;
        
        // Create PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        // Add image to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
        
        // Open PDF in new tab instead of downloading
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        
        // Restore buttons
        buttons.style.display = 'flex';
        button.disabled = false;
        button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
        
      } catch (error) {
        console.error('PDF generation error:', error);
        const buttons = document.querySelector('.pdf-buttons');
        buttons.style.display = 'flex';
        button.disabled = false;
        button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
        alert('Erro ao gerar PDF: ' + error.message);
      }
    });

    function drawChart() {
      const svg = document.getElementById('progressChart');
      const balanceHistory = ${JSON.stringify(data.balanceHistory)};
      
      if (!svg || balanceHistory.length === 0) return;

      const width = svg.clientWidth;
      const height = svg.clientHeight;
      const padding = 60;
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
      zeroText.setAttribute('x', padding - 15);
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
      maxText.setAttribute('x', padding - 15);
      maxText.setAttribute('y', padding + 5);
      maxText.setAttribute('text-anchor', 'end');
      maxText.setAttribute('fill', '#10b981');
      maxText.setAttribute('font-size', '12');
      maxText.setAttribute('font-weight', 'bold');
      maxText.textContent = \`R$ \${maxBalance.toFixed(2)}\`;
      svg.appendChild(maxText);

      const minText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      minText.setAttribute('x', padding - 15);
      minText.setAttribute('y', height - padding + 5);
      minText.setAttribute('text-anchor', 'end');
      minText.setAttribute('fill', '#ef4444');
      minText.setAttribute('font-size', '12');
      minText.setAttribute('font-weight', 'bold');
      minText.textContent = \`R$ \${minBalance.toFixed(2)}\`;
      svg.appendChild(minText);

      // Add intermediate metric labels on the left side with better spacing
      const numIntermediateLines = 2;
      const stepRange = range / (numIntermediateLines + 1);
      for (let i = 1; i <= numIntermediateLines; i++) {
        const value = maxBalance - (stepRange * i);
        const y = padding + (chartHeight * i / (numIntermediateLines + 1));
        
        // Only add line if it's not too close to zero line
        if (Math.abs(y - zeroY) > 20) {
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
          metricText.setAttribute('x', padding - 15);
          metricText.setAttribute('y', y + 4);
          metricText.setAttribute('text-anchor', 'end');
          metricText.setAttribute('fill', '#94a3b8');
          metricText.setAttribute('font-size', '10');
          metricText.textContent = \`R$ \${value.toFixed(2)}\`;
          svg.appendChild(metricText);
        }
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
