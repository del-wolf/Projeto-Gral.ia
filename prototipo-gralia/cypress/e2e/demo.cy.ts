/// <reference types="cypress" />
import type { Repository, State } from '../../app/src/domain/types'

type DemoHook = { repo: Repository; reset: () => Promise<void> }
const hook = () => cy.window().its('__graliaTest').should('exist') as Cypress.Chainable<DemoHook>
const control = (label: string) => cy.contains('label', label).then(($label) => {
  const id = $label.attr('for')
  return id ? cy.get(`#${id}`) : cy.wrap($label).find('input,select,textarea')
})
const login = (alias = 'ADMIN-QA') => {
  control('Conta de teste').select(alias)
  cy.contains('button', 'Entrar na demonstração').click()
  cy.contains('button', 'Sair').should('be.visible')
}
const search = (matricula = 'QA2026001') => {
  control('Matrícula do aluno').clear().type(matricula)
  cy.contains('button', 'Buscar aluno').click()
}
const targetRows = (state: State) => {
  const student = state.alunos.find((item) => item.matricula === 'QA2026001')!
  const offer = state.ofertas_disciplina.find((item) => item.codigo === 'OF-TEST-3A')!
  return state.matriculas.filter((item) => item.aluno_id === student.id && item.oferta_id === offer.id && item.status === 'ativa')
}
const selectOffer = (code = 'OF-TEST-3A') => {
  cy.contains('label', code).find('input[type="checkbox"]').check()
  return cy.contains('label', code).find('input[type="checkbox"]').should('be.checked')
}

describe('Gral.ia — fluxos reais da demonstração local', () => {
  beforeEach(() => {
    cy.clock(new Date('2026-11-16T12:00:00Z').getTime(), ['Date'])
    cy.visit('/')
    hook().then((test) => test.reset())
    cy.reload()
  })

  it('CT-GR-001 matrícula válida: persiste exatamente um vínculo e limpa a seleção', () => {
    cy.screenshot('apresentacao/entrada-gralia', {capture:'fullPage'})
    login()
    cy.screenshot('apresentacao/visao-geral-admin', {capture:'fullPage'})
    cy.contains('a', 'Matrículas').click()
    hook().then((test) => test.repo.read()).then((state) => expect(targetRows(state)).to.have.length(0))
    search()
    cy.contains('Aluno Teste A').should('be.visible')
    selectOffer()
    cy.contains('button', 'Registrar matrícula').click()
    cy.get('[role="status"]').should('contain.text', 'Matrícula')
    control('Matrícula do aluno').should('have.value', '')
    cy.get('input[type="checkbox"]:checked').should('have.length', 0)
    hook().then((test) => test.repo.read()).then((state) => expect(targetRows(state)).to.have.length(1))
    cy.reload()
    search()
    cy.get('[data-testid="enrollment-list"]').should('contain.text', 'OF-TEST-3A')
    hook().then((test) => test.repo.read()).then((state) => expect(targetRows(state)).to.have.length(1))
    cy.screenshot('CT-GR-001/matricula-persistida', { capture: 'fullPage' })
    hook().then((test) => test.repo.read()).then((state) => cy.task('recordCase', {
      id: 'CT-GR-001', titulo: 'Matricular aluno em uma oferta válida', objetivo: 'Confirmar persistência de exatamente um vínculo ativo.',
      pre_condicoes: 'Fixture 1.0 restaurada independentemente; ADMIN-QA ativo; par começa com zero vínculos.', dados: { matricula: 'QA2026001', oferta: 'OF-TEST-3A' },
      passos: ['Entrar como ADMIN-QA', 'Buscar aluno', 'Selecionar OF-TEST-3A', 'Registrar uma vez', 'Conferir anúncio e limpeza', 'Recarregar e consultar repositório independentemente'],
      esperado: { vinculos_ativos: 1, selecao_limpa: true, persistencia_apos_recarga: true },
      observado: { vinculos_ativos: targetRows(state).length, anuncio_e_limpeza: 'verificados por assertions Cypress', recarga_e_lista: 'verificadas por assertions Cypress' },
      status: 'APROVADO — demo local', prioridade: 'Alta', severidade: null, ambiente: 'Cypress demo; localStorage; Electron headless; detalhes em ambiente.json', responsavel: 'Execução automatizada Codex; autoria Igor Felipe Wolff', evidencia: 'screenshots/demo.cy.ts/CT-GR-001/matricula-persistida.png',
    }))
  })

  it('CT-GR-002 nenhuma oferta: botão desabilitado, ajuda e zero chamadas de criação', () => {
    login()
    cy.contains('a', 'Matrículas').click()
    hook().then((test) => cy.spy(test.repo, 'enroll').as('enroll'))
    search()
    cy.contains('Aluno Teste A').should('be.visible')
    cy.contains('button', 'Registrar matrícula').should('be.disabled')
    cy.contains(/selecione.*oferta/i).should('be.visible')
    cy.get('@enroll').should('not.have.been.called')
    hook().then((test) => test.repo.read()).then((state) => {
      expect(targetRows(state)).to.have.length(0)
      expect(state.matriculas).to.have.length(2)
    })
    cy.screenshot('CT-GR-002/sem-oferta-selecionada', { capture: 'fullPage' })
    hook().then((test) => test.repo.read()).then((state) => cy.get('@enroll').its('callCount').then((count) => cy.task('recordCase', {
      id: 'CT-GR-002', titulo: 'Bloquear matrícula sem oferta selecionada', objetivo: 'Impedir envio pela UI sem criar vínculos.',
      pre_condicoes: 'Fixture 1.0 restaurada independentemente; ADMIN-QA ativo; par começa com zero vínculos.', dados: { matricula: 'QA2026001', ofertaIds: [] },
      passos: ['Entrar como ADMIN-QA', 'Buscar aluno', 'Manter seleção vazia', 'Conferir botão desabilitado e instrução', 'Contar chamadas do repositório e vínculos'],
      esperado: { novas_matriculas: 0, chamadas_criacao_pela_tela: 0, botao_desabilitado: true },
      observado: { vinculos_ativos_par_alvo: targetRows(state).length, total_matriculas: state.matriculas.length, chamadas_criacao_pela_tela: count, botao_e_instrucao: 'verificados por assertions Cypress' },
      status: 'APROVADO — UI demo local; rejeição vazia do serviço é teste unitário separado; RPC requer integração', prioridade: 'Alta', severidade: null, ambiente: 'Cypress demo; localStorage; Electron headless; detalhes em ambiente.json', responsavel: 'Execução automatizada Codex; autoria Igor Felipe Wolff', evidencia: 'screenshots/demo.cy.ts/CT-GR-002/sem-oferta-selecionada.png',
    })))
  })

  it('CT-GR-004 e CT-GR-005 mudança da busca invalida aluno e seleção anteriores', () => {
    login()
    cy.contains('a', 'Matrículas').click()
    search()
    selectOffer()
    control('Matrícula do aluno').clear().type('QA9999999')
    cy.contains('button', 'Registrar matrícula').should('be.disabled')
    cy.get('input[type="checkbox"]:checked').should('have.length', 0)
    cy.contains('button', 'Buscar aluno').click()
    cy.contains(/não encontrado|nenhum aluno/i).should('be.visible')
    hook().then((test) => test.repo.read()).then((state) => expect(targetRows(state)).to.have.length(0))
  })

  it('CT-GR-034 erro de armazenamento preserva formulário e não anuncia sucesso', () => {
    login()
    cy.contains('a', 'Matrículas').click()
    search()
    selectOffer()
    cy.window().then((win) => {
      const original = win.Storage.prototype.setItem
      cy.stub(win.Storage.prototype, 'setItem').callsFake(function (this: Storage, key: string, value: string) {
        if (key === 'gralia.demo.state.v1') throw new DOMException('Falha controlada de quota', 'QuotaExceededError')
        return original.call(this, key, value)
      }).as('storageFailure')
    })
    cy.contains('button', 'Registrar matrícula').click()
    cy.get('[role="alert"]').should('be.visible')
    control('Matrícula do aluno').should('have.value', 'QA2026001')
    cy.get('input[type="checkbox"]:checked').should('have.length', 1)
    hook().then((test) => test.repo.read()).then((state) => expect(targetRows(state)).to.have.length(0))
  })

  it('CT-GR-006 e CT-GR-027 aluno recebe acesso negado ao endereço admin e logout encerra sessão', () => {
    login('ALUNO-A')
    cy.visit('/#/matriculas')
    cy.contains(/acesso negado/i).should('be.visible')
    cy.contains('button', 'Sair').click()
    cy.contains('button', 'Entrar na demonstração').should('be.visible')
    cy.reload()
    cy.contains('button', 'Entrar na demonstração').should('be.visible')
  })

  it('CT-GR-029 aluno A e B recebem apenas as próprias ofertas', () => {
    login('ALUNO-A')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.contains('h2', 'Programação Web').should('be.visible')
    cy.contains('Banco de Dados').should('not.exist')
    cy.contains('button', 'Sair').click()
    login('ALUNO-B')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.contains('h2', 'Banco de Dados').should('be.visible')
    cy.contains('Programação Web').should('not.exist')
  })

  it('CT-GR-004 respostas invertidas não restauram um aluno obsoleto', () => {
    login()
    cy.contains('a', 'Matrículas').click()
    let releaseOld: (() => void) | undefined
    hook().then((test) => {
      const original = test.repo.findStudent.bind(test.repo)
      cy.stub(test.repo, 'findStudent').callsFake(async (query: string) => {
        if (query === 'QA2026001') await new Promise<void>((resolve) => { releaseOld = resolve })
        return original(query)
      })
    })
    search()
    control('Matrícula do aluno').clear().type('QA9999999')
    cy.contains('button', 'Buscar aluno').click()
    cy.contains(/nenhum aluno encontrado/i).should('be.visible')
    cy.then(() => { expect(releaseOld).to.be.a('function'); releaseOld!() })
    cy.contains(/nenhum aluno encontrado/i).should('be.visible')
    cy.contains('button', 'Registrar matrícula').should('be.disabled')
    cy.get('.student-result').should('not.exist')
  })

  it('CT-GR-013/015 zero completa a média e a nota decimal persiste após recarga', () => {
    login('PROF-A')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.get('[data-testid="grade-average"]').should('contain.text', 'Média parcial: 7,33')
    cy.get('form[aria-label="Lançar ou editar nota"]').within(() => {
      control('Aluno para nota').select('Aluno Teste A')
      control('Avaliação').select('A3-PWEB')
      control('Nota (0 a 10)').type('0')
      cy.contains('button', 'Salvar').click()
    })
    cy.get('[data-testid="grade-average"]').should('contain.text', 'Média completa: 5,50')
    cy.reload()
    cy.get('[data-testid="grade-average"]').should('contain.text', 'Média completa: 5,50')
    cy.get('form[aria-label="Lançar ou editar nota"]').within(() => {
      control('Aluno para nota').select('Aluno Teste A')
      control('Avaliação').select('A3-PWEB')
      control('Nota (0 a 10)').type('8,75')
      cy.contains('button', 'Salvar').click()
    })
    cy.reload()
    cy.contains('tr', 'A3-PWEB').should('contain.text', '8,75')
    cy.screenshot('CT-GR-013/nota-decimal-persistida', { capture: 'fullPage' })
  })

  it('CT-GR-017/018 professor lança presença pendente sem duplicar registros', () => {
    login('PROF-A')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.get('[data-testid="attendance-summary"]').should('contain.text', '1 presença(s) · 1 falta(s) · 1 pendência(s)').and('contain.text', '50,00%')
    cy.get('form[aria-label="Registrar ou editar frequência"]').within(() => {
      control('Aluno para frequência').select('Aluno Teste A')
      control('Aula').select('a9f97c79-dea4-57f9-af94-bd299583ce9b')
      control('Presença ou falta').select('presente')
      cy.contains('button', 'Salvar').click()
    })
    cy.get('[data-testid="attendance-summary"]').should('contain.text', '2 presença(s) · 1 falta(s) · 0 pendência(s)').and('contain.text', '66,67%')
    cy.reload()
    cy.get('[data-testid="attendance-summary"]').should('contain.text', '66,67%')
    hook().then((test) => test.repo.read()).then((state) => expect(state.frequencias.filter((item) => item.aula_id === 'a9f97c79-dea4-57f9-af94-bd299583ce9b')).to.have.length(1))
  })

  it('CT-GR-020/041 material e avaliação aparecem na oferta do aluno correto', () => {
    login('PROF-A')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.get('form[aria-label="Publicar material"]').within(() => {
      control('Título do material').type('Guia de estudo sintético')
      control('URL do material').clear().type('https://example.test/guia', { delay: 30 }).should('have.value', 'https://example.test/guia')
      cy.contains('button', 'Salvar').click()
    })
    cy.contains('a', 'Guia de estudo sintético').should('have.attr', 'href', 'https://example.test/guia')
    cy.get('form[aria-label="Criar avaliação"]').within(() => {
      control('Título da avaliação').type('Avaliação sintética agendada')
      control('Data da avaliação').type('2026-11-20')
      cy.contains('button', 'Salvar').click()
    })
    cy.contains('button', 'Sair').click()
    login('ALUNO-A')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.contains('a', 'Guia de estudo sintético').should('be.visible')
    cy.get('[aria-labelledby="agenda-title"]').should('contain.text', 'Avaliação sintética agendada')
    cy.contains('button', 'Sair').click()
    login('ALUNO-B')
    cy.contains('a', 'Minhas disciplinas').click()
    cy.contains('Guia de estudo sintético').should('not.exist')
    cy.contains('Avaliação sintética agendada').should('not.exist')
  })

  it('CT-GR-021/022/023/025 reserva persiste, rejeita conflito, permite adjacência e cancela', () => {
    login('PROF-A')
    cy.contains('a', 'Salas e laboratórios').click()
    const reserve = (start: string, end: string, reason: string) => {
      cy.get('form[aria-label="Criar reserva"]').within(() => {
        control('Ambiente da reserva').select('Laboratório 02')
        control('Data da reserva').clear().type('2026-11-20')
        control('Início').clear().type(start)
        control('Fim').clear().type(end)
        control('Motivo da reserva').clear().type(reason)
        cy.contains('button', 'Registrar reserva').click()
      })
    }
    reserve('14:00', '15:00', 'Aula sintética E2E')
    cy.get('[role="status"]').should('contain.text', 'Reserva registrada')
    cy.reload()
    cy.get('[data-testid="reservation-list"]').should('contain.text', 'Aula sintética E2E')
    reserve('14:30', '15:30', 'Conflito sintético')
    cy.get('[role="alert"]').should('be.visible')
    cy.get('[data-testid="reservation-list"]').should('not.contain.text', 'Conflito sintético')
    reserve('15:00', '16:00', 'Aula adjacente E2E')
    cy.get('[data-testid="reservation-list"]').should('contain.text', 'Aula adjacente E2E')
    cy.contains('[data-testid="reservation-list"] article', 'Aula sintética E2E').within(() => cy.contains('button', 'Cancelar reserva').click())
    cy.contains('[data-testid="reservation-list"] article', 'Aula sintética E2E').should('contain.text', 'Cancelada')
    cy.screenshot('CT-GR-021/reservas-persistidas', { capture: 'fullPage' })
  })

  it('CT-GR-035/037 reset confirma, preserva outras chaves e devolve foco ao cancelar', () => {
    login()
    cy.window().then((win) => win.localStorage.setItem('outra-aplicacao', 'preservar'))
    cy.contains('button', 'Restaurar demonstração').as('reset').focus().click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.focused().should('be.visible')
    cy.get('[role="dialog"]').within(() => cy.contains('button', 'Manter alterações').click())
    cy.get('@reset').should('have.focus')
    cy.contains('button', 'Sair').should('be.visible')
    cy.get('@reset').click()
    cy.get('[role="dialog"]').within(() => cy.contains('button', 'Restaurar dados').click())
    cy.contains('button', 'Entrar na demonstração').should('be.visible')
    cy.window().then((win) => expect(win.localStorage.getItem('outra-aplicacao')).to.equal('preservar'))
  })

  it('CT-GR-038 reflow 320px mantém matrícula operável', () => {
    cy.viewport(320, 800)
    login()
    cy.contains('a', 'Matrículas').click()
    search()
    selectOffer()
    cy.contains('button', 'Registrar matrícula').should('be.visible').and('be.enabled').click()
    cy.get('[role="status"]').should('contain.text', 'Matrícula')
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(321))
    cy.screenshot('CT-GR-038/matricula-320px', { capture: 'fullPage' })
  })

  it('CT-GR-039 axe verifica entrada e matrícula nos temas claro e escuro', () => {
    cy.injectAxe()
    cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    login()
    cy.contains('a', 'Matrículas').click()
    search()
    cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    cy.get('button[aria-label="Alternar tema"]').click()
    cy.checkA11y(undefined, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })
    cy.screenshot('CT-GR-039/matricula-tema-escuro', { capture: 'fullPage' })
  })
})
