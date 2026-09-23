// GRAL.IA — API da pesquisa, versão 2.0
// Cole em um arquivo .gs no Apps Script. Veja IMPLANTACAO.md antes de publicar.
// A:L preservam o esquema antigo; M:U acrescentam dados e controle de reenvio.
const SPREADSHEET_ID = '1BdVwL6gfQVytVNyr6lkGCDxQ11pv36A5HbwKlpL235Y';
const SHEET_NAME = 'Respostas';
const FORM_VERSION = '2.0';
// Sem limite editorial de texto; respeita a capacidade de uma célula do Sheets.
const MAX_CELL_CHARS = 50000;
// Comporta os nove campos de texto, inclusive caracteres escapados no JSON.
const MAX_BODY_BYTES = 3000000;
const HEADERS = [
  'Timestamp', 'Perfil', 'Frequência de uso', 'Ferramentas usadas',
  'Ferramentas — Outro', 'Satisfação (1-5)', 'Frustração geral',
  'Rotina Professor/Equipe', 'Dificuldade Aluno', 'Funcionalidades desejadas',
  'Sugestão livre', 'Plataformas conhecidas', 'Nível de ensino',
  'Rotina Direção/Gestão', 'Rotina Biblioteca/Apoio', 'Pontos positivos',
  'Outras plataformas', 'ID da resposta', 'Versão do formulário',
  'Timestamp cliente', 'Hash da resposta'
];
const OPTIONS = {
  perfil: ['aluno', 'professor', 'direcao', 'bib'],
  nivel_ensino: ['tecnico', 'superior', 'pos', 'medio', 'livre'],
  frequencia: ['diario', 'semana', 'mes', 'raro'],
  ferramentas: ['gov_oficial', 'ava', 'erp', 'msg', 'nuvem', 'papel', 'outro'],
  funcionalidades: ['painel', 'materiais', 'reservas', 'biblioteca', 'avisos', 'mobile', 'diario', 'matricula'],
  plataformas: ['moodle', 'classroom', 'sigaa', 'siga', 'canvas', 'teams', 'nenhuma']
};
const ROLE_FIELD = {
  aluno: 'resp_aluno', professor: 'resp_professor',
  direcao: 'resp_direcao', bib: 'resp_bib'
};

// Diagnóstico público: confirma somente a versão da API, sem consultar respostas.
function doGet() {
  return json_({ status: 'ready', api_version: FORM_VERSION });
}

function doPost(e) {
  let lock;
  let requestId = '';
  try {
    const data = validatePayload_(parseBody_(e));
    requestId = data.response_id;
    const hash = hashPayload_(data);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) fail_('BUSY', 'Serviço ocupado. Tente novamente.');

    // O ID explícito independe de planilha ativa ou contexto do editor.
    const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID));
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existing = sheet.getRange(2, 18, lastRow - 1, 1)
        .createTextFinder(requestId).matchEntireCell(true)
        .matchCase(true).useRegularExpression(false).findNext();
      if (existing) {
        const rowNumber = existing.getRow();
        if (sheet.getRange(rowNumber, 21).getValue() !== hash) {
          fail_('ID_CONFLICT', 'Este identificador já foi usado com outros dados.');
        }
        return json_(receipt_(data, sheet.getRange(rowNumber, 1).getValue(), true));
      }
    }

    const receivedAt = new Date();
    const rowNumber = lastRow + 1;
    if (rowNumber > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
    const values = [
      receivedAt, data.perfil, data.frequencia, data.ferramentas.join(', '),
      data.ferramentas_outro, data.satisfacao, data.frustracao_geral,
      data.resp_professor, data.resp_aluno, data.funcionalidades.join(', '),
      data.sugestao, data.plataformas.join(', '), data.nivel_ensino,
      data.resp_direcao, data.resp_bib, data.pontos_positivos,
      data.plataformas_outras, requestId, data.form_version,
      new Date(data.timestamp), hash
    ].map(safeCell_);

    // Formatação antes da escrita: falhar aqui não cria resposta parcial.
    sheet.getRange(rowNumber, 1).setNumberFormat('dd/mm/yyyy HH:mm:ss');
    sheet.getRange(rowNumber, 20).setNumberFormat('dd/mm/yyyy HH:mm:ss');
    const range = sheet.getRange(rowNumber, 1, 1, HEADERS.length);
    if (rowNumber % 2 === 0) range.setBackground('#F1F5F9');
    range.setValues([values]);
    SpreadsheetApp.flush();

    // Confirmação só depois da escrita e do flush. Reenvio usa o mesmo ID.
    return json_(receipt_(data, receivedAt, false));
  } catch (err) {
    // Nunca registrar as respostas nem devolver detalhes internos ao navegador.
    const known = Boolean(err && err.publicCode);
    console.error(JSON.stringify({
      code: known ? err.publicCode : 'INTERNAL_ERROR', response_id: requestId
    }));
    return json_({
      status: 'error', api_version: FORM_VERSION,
      code: known ? err.publicCode : 'INTERNAL_ERROR',
      message: known ? err.message : 'Não foi possível confirmar a gravação. Tente novamente.'
    });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function parseBody_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string' || !e.postData.contents) {
    fail_('INVALID_JSON', 'Envie um corpo JSON.');
  }
  const body = e.postData.contents;
  if (body.length > MAX_BODY_BYTES || Number(e.postData.length) > MAX_BODY_BYTES ||
      Utilities.newBlob(body).getBytes().length > MAX_BODY_BYTES) {
    fail_('PAYLOAD_TOO_LARGE', 'Resposta acima do tamanho permitido.');
  }
  const type = String(e.postData.type || '').split(';')[0].trim().toLowerCase();
  if (!['text/plain', 'application/json'].includes(type)) {
    fail_('UNSUPPORTED_MEDIA_TYPE', 'Use JSON em text/plain ou application/json.');
  }
  try {
    return JSON.parse(body);
  } catch (err) {
    fail_('INVALID_JSON', 'O corpo da requisição não contém JSON válido.');
  }
}

function validatePayload_(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    fail_('INVALID_PAYLOAD', 'Resposta inválida.');
  }
  if (raw.form_version !== FORM_VERSION) {
    fail_('UNSUPPORTED_VERSION', 'Atualize a página da pesquisa antes de enviar.');
  }
  const textFields = [
    'ferramentas_outro', 'frustracao_geral', 'resp_aluno', 'resp_professor',
    'resp_direcao', 'resp_bib', 'pontos_positivos', 'sugestao', 'plataformas_outras'
  ];
  const allowed = [
    'form_version', 'response_id', 'timestamp', 'perfil', 'nivel_ensino',
    'frequencia', 'ferramentas', 'satisfacao', 'funcionalidades', 'plataformas'
  ].concat(textFields);
  if (Object.keys(raw).some(key => !allowed.includes(key))) {
    fail_('INVALID_PAYLOAD', 'A resposta contém campos não reconhecidos.');
  }
  if (typeof raw.response_id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.response_id)) {
    fail_('INVALID_PAYLOAD', 'Identificador da resposta inválido.');
  }
  if (typeof raw.timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(raw.timestamp) ||
      !Number.isFinite(Date.parse(raw.timestamp)) || new Date(raw.timestamp).toISOString() !== raw.timestamp) {
    fail_('INVALID_PAYLOAD', 'Data do cliente inválida.');
  }
  const data = {
    form_version: FORM_VERSION, response_id: raw.response_id.toLowerCase(),
    timestamp: raw.timestamp
  };
  ['perfil', 'nivel_ensino', 'frequencia'].forEach(key => {
    if (!OPTIONS[key].includes(raw[key])) fail_('INVALID_PAYLOAD', 'Opção inválida: ' + key);
    data[key] = raw[key];
  });
  data.ferramentas = list_(raw.ferramentas, OPTIONS.ferramentas, 1, 7, 'ferramentas');
  data.funcionalidades = list_(raw.funcionalidades, OPTIONS.funcionalidades, 1, 3, 'funcionalidades');
  data.plataformas = list_(raw.plataformas === undefined ? [] : raw.plataformas, OPTIONS.plataformas, 0, 7, 'plataformas');
  if (data.plataformas.includes('nenhuma') && data.plataformas.length !== 1) {
    fail_('INVALID_PAYLOAD', 'Nenhuma das acima não pode ser combinada com outra opção listada.');
  }
  if (typeof raw.satisfacao !== 'number' || !Number.isInteger(raw.satisfacao) ||
      raw.satisfacao < 1 || raw.satisfacao > 5) {
    fail_('INVALID_PAYLOAD', 'A satisfação deve ser um número inteiro de 1 a 5.');
  }
  data.satisfacao = raw.satisfacao;
  textFields.forEach(key => {
    const value = raw[key] === undefined ? '' : raw[key];
    if (typeof value !== 'string' || /\u0000/.test(value)) {
      fail_('INVALID_PAYLOAD', 'Texto inválido: ' + key);
    }
    data[key] = value.trim();
    // Valida o conteúdo que será escrito, incluindo o escape contra fórmulas.
    if (safeCell_(data[key]).length > MAX_CELL_CHARS) {
      fail_('TEXT_TOO_LONG', 'Texto acima da capacidade de uma célula da planilha: ' + key);
    }
  });
  if (!data.frustracao_geral) fail_('INVALID_PAYLOAD', 'Preencha a principal frustração.');
  if (data.ferramentas.includes('outro') !== Boolean(data.ferramentas_outro)) {
    fail_('INVALID_PAYLOAD', 'Preencha Outra ferramenta somente quando Outro estiver selecionado.');
  }
  Object.values(ROLE_FIELD).forEach(key => {
    if (key !== ROLE_FIELD[data.perfil] && data[key]) {
      fail_('INVALID_PAYLOAD', 'Responda somente a pergunta do perfil selecionado.');
    }
  });
  return data;
}

function list_(value, options, min, max, field) {
  if (!Array.isArray(value) || value.length < min || value.length > max ||
      new Set(value).size !== value.length || value.some(item => !options.includes(item))) {
    fail_('INVALID_PAYLOAD', 'Seleção inválida: ' + field);
  }
  // Ordem estável para comparação de reenvios e leitura na planilha.
  return options.filter(item => value.includes(item));
}

function safeCell_(value) {
  // Sheets interpreta '=' como fórmula. Também protege prefixos comuns em CSV.
  // A apóstrofe instrui o Sheets a tratar o conteúdo como texto literal.
  return typeof value === 'string' && /^[=+\-@']/.test(value) ? "'" + value : value;
}

function hashPayload_(data) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(data), Utilities.Charset.UTF_8)
    .map(byte => ('0' + (byte & 255).toString(16)).slice(-2)).join('');
}

function receipt_(data, date, duplicate) {
  return {
    status: 'ok', api_version: FORM_VERSION, response_id: data.response_id,
    saved_at: new Date(date).toISOString(), duplicate: duplicate
  };
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function fail_(code, message) {
  const err = new Error(message);
  err.publicCode = code;
  throw err;
}

function schemaState_(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return 'empty';
  const count = sheet.getLastColumn();
  if (count !== 12 && count !== HEADERS.length) return 'incompatible';
  const actual = sheet.getRange(1, 1, 1, count).getValues()[0];
  if (actual.some((header, i) => header !== HEADERS[i])) return 'incompatible';
  return count === 12 ? 'legacy' : 'current';
}

function ensureSheet_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  const state = schemaState_(sheet);
  if (state === 'incompatible') {
    fail_('SCHEMA_MISMATCH', 'Cabeçalhos incompatíveis. A equipe da pesquisa precisa verificar a planilha.');
  }
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }
  if (state !== 'current') {
    // Somente linha 1; nunca reordena, apaga ou preenche respostas históricas.
    const start = state === 'legacy' ? 13 : 1;
    const headers = HEADERS.slice(start - 1);
    const range = sheet.getRange(1, start, 1, headers.length);
    range.setBackground('#1A56DB').setFontColor('#FFFFFF')
      .setFontWeight('bold').setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(start, headers.length, 200);
    range.setValues([headers]);
    SpreadsheetApp.flush();
  }
  return sheet;
}

// Execute no editor ANTES de preparar/publicar: somente leitura, sem novas linhas.
function verificarConfiguracao() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const result = {
    planilha: ss.getName(), id: ss.getId(), aba: SHEET_NAME,
    fuso: ss.getSpreadsheetTimeZone(), esquema: schemaState_(sheet)
  };
  console.log(JSON.stringify(result));
  return result;
}

// Execute no editor para criar/complementar somente os cabeçalhos de Respostas.
function prepararPlanilha() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Planilha ocupada. Tente novamente.');
  try {
    ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID));
    SpreadsheetApp.flush();
    console.log('Cabeçalhos preparados. Nenhuma resposta de teste foi criada.');
  } finally {
    lock.releaseLock();
  }
}
