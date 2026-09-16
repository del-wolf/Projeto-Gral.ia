// ═══════════════════════════════════════════════════════
// GRAL.IA — Google Apps Script
// Cole este código no Apps Script da sua planilha
// Extensões → Apps Script → Substituir tudo → Salvar
// Depois: Implantar → Nova implantação → App da Web
// ═══════════════════════════════════════════════════════

const SHEET_NAME = 'Respostas'; // nome da aba que será criada

function doPost(e) {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Cria a aba e o cabeçalho se ainda não existir
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        'Timestamp',
        'Perfil',
        'Frequência de uso',
        'Ferramentas usadas',
        'Ferramentas — Outro',
        'Satisfação (1-5)',
        'Frustração geral',
        'Rotina Professor/Equipe',
        'Dificuldade Aluno',
        'Funcionalidades desejadas',
        'Sugestão livre',
        'Plataformas conhecidas'
      ];
      sheet.appendRow(headers);

      // Formata cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1A56DB');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);

      // Largura das colunas
      sheet.setColumnWidth(1, 160);  // Timestamp
      sheet.setColumnWidth(2, 120);  // Perfil
      sheet.setColumnWidth(3, 160);  // Frequência
      sheet.setColumnWidth(4, 200);  // Ferramentas
      sheet.setColumnWidth(5, 140);  // Outro
      sheet.setColumnWidth(6, 100);  // Satisfação
      sheet.setColumnWidth(7, 280);  // Frustração
      sheet.setColumnWidth(8, 280);  // Rotina prof
      sheet.setColumnWidth(9, 280);  // Dificuldade aluno
      sheet.setColumnWidth(10, 240); // Funcionalidades
      sheet.setColumnWidth(11, 280); // Sugestão
      sheet.setColumnWidth(12, 200); // Plataformas
    }

    // Parse dos dados enviados pelo formulário
    const data = JSON.parse(e.postData.contents);

    const row = [
      new Date(data.timestamp),
      data.perfil            || '',
      data.frequencia        || '',
      Array.isArray(data.ferramentas) ? data.ferramentas.join(', ') : '',
      data.ferramentas_outro || '',
      data.satisfacao        || '',
      data.frustracao_geral  || '',
      data.rotina_professor  || '',
      data.dificuldade_aluno || '',
      Array.isArray(data.funcionalidades_desejadas) ? data.funcionalidades_desejadas.join(', ') : '',
      data.sugestao          || '',
      Array.isArray(data.plataformas_conhecidas) ? data.plataformas_conhecidas.join(', ') : '',
    ];

    sheet.appendRow(row);

    // Formata a linha de data
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNumberFormat('dd/mm/yyyy HH:mm:ss');

    // Zebra alternado
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, 12).setBackground('#F1F5F9');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste manual — rode esta função no editor para verificar a conexão
function testeManual() {
  const mockData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        perfil: 'aluno',
        frequencia: 'todos',
        ferramentas: ['whatsapp', 'estudante_online'],
        ferramentas_outro: '',
        satisfacao: '2',
        frustracao_geral: 'Não consigo ver minhas notas antes do conselho.',
        rotina_professor: '',
        dificuldade_aluno: 'PDF fica perdido no WhatsApp.',
        funcionalidades_desejadas: ['painel', 'materiais'],
        sugestao: 'Notificação quando a nota for lançada.',
        plataformas_conhecidas: ['classroom']
      })
    }
  };
  const result = doPost(mockData);
  Logger.log(result.getContent());
}
