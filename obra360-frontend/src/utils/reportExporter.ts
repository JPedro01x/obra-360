import { Project, ConstructionOccurrence, StockItem, StockMovement, AuditLog } from '../types';

/* ========================================================================= */
/* REPORT EXPORTER UTILITY (PDF & EXCEL/CSV GENERATOR)                      */
/* ========================================================================= */

/**
 * Generates and downloads a formatted CSV / Excel file for data tables
 */
export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates an executive PDF report by opening a styled printable window
 */
export function exportProjectSummaryPdf(project: Project, occurrences: ConstructionOccurrence[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Executivo - ${project.name}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #18181b; margin: 30px; line-height: 1.5; }
        .header { border-bottom: 3px solid #f97316; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 24px; font-weight: 900; color: #f97316; }
        .title { font-size: 20px; font-weight: 800; margin: 0; }
        .badge { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .card-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
        th { background: #f1f5f9; font-weight: 700; color: #334155; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 10px; color: #94a3b8; text-align: center; }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Obra360</div>
          <div class="title">Relatório Executivo de Empreendimento</div>
        </div>
        <div class="badge">${project.type}</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-label">Nome do Empreendimento</div>
          <div class="card-value">${project.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Localização: ${project.location}</div>
        </div>
        <div class="card">
          <div class="card-label">Valor Geral de Vendas (VGV)</div>
          <div class="card-value" style="color: #059669;">R$ ${project.vgv > 0 ? project.vgv.toLocaleString('pt-BR') : 'N/A (Obra Pública)'}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Orçamento WBS: R$ ${project.budget.toLocaleString('pt-BR')}</div>
        </div>
        <div class="card">
          <div class="card-label">Avanço Físico Real</div>
          <div class="card-value" style="color: #d97706;">${project.progressPercent}% Concluído</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Prazo Previsto: ${project.plannedDeadline}</div>
        </div>
        <div class="card">
          <div class="card-label">Equipe Técnica Responsável</div>
          <div class="card-value" style="font-size: 14px;">${project.responsibleEngineer}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Arquitetura: ${project.responsibleArchitect}</div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
        Laudos de Fiscalização & Não Conformidades (ISO 9001)
      </h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Título da Ocorrência</th>
            <th>Categoria</th>
            <th>Gravidade</th>
            <th>Responsável</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${occurrences.map(occ => `
            <tr>
              <td><strong>${occ.id}</strong></td>
              <td>${occ.title}</td>
              <td>${occ.category}</td>
              <td><span style="color: ${occ.severity === 'ALTA' ? '#dc2626' : '#d97706'}; font-weight: 700;">${occ.severity}</span></td>
              <td>${occ.assignedTo}</td>
              <td>${occ.status === 'APROVADA_FISCAL' ? '✓ Aprovado' : 'Em Correção'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Gerado automaticamente via Obra360 Enterprise em ${new Date().toLocaleString('pt-BR')} • Documento Auditado
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Exports occurrences to Excel CSV
 */
export function exportOccurrencesCsv(occurrences: ConstructionOccurrence[]) {
  const headers = ['ID', 'Projeto', 'Titulo', 'Categoria', 'Gravidade', 'Descricao', 'AtribuidoA', 'Status', 'ReportadoPor', 'Data'];
  const rows = occurrences.map(occ => [
    occ.id,
    occ.projectId,
    occ.title,
    occ.category,
    occ.severity,
    occ.description,
    occ.assignedTo,
    occ.status,
    occ.reportedBy,
    occ.createdAt
  ]);

  downloadCsvFile(`Relatorio_Ocorrencias_ISO9001_${Date.now()}`, headers, rows);
}

/**
 * Exports stock inventory and movements to Excel CSV
 */
export function exportStockReportCsv(items: StockItem[], movements: StockMovement[]) {
  const headers = ['SKU', 'Produto', 'Categoria', 'Quantidade', 'EstoqueMinimo', 'Unidade', 'Localizacao'];
  const rows = items.map(stk => [
    stk.sku,
    stk.name,
    stk.category,
    stk.quantity,
    stk.minStock,
    stk.unit,
    stk.location
  ]);

  downloadCsvFile(`Relatorio_Estoque_Almoxarifado_${Date.now()}`, headers, rows);
}
