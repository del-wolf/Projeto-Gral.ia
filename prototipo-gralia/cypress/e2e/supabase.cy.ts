/// <reference types="cypress" />
// Real local Supabase only. Every test restores fixture 1.0 through guarded Node
// preparation; assertions use signed-in test users, never service-role clients.
type Counts = { total: number; activeTarget: number }
type RpcResult = { status: number; errorCode: string | null; rejected: boolean; before: Counts; after: Counts }

const login = () => {
  cy.task<{ email: string; password: string }>('browserAdminCredentials', null, { log: false }).then(credentials => {
    cy.get('input[type="email"]').type(credentials.email, { log: false })
    cy.get('input[type="password"]').type(credentials.password, { log: false })
    cy.contains('button', /^Entrar$/).click()
  })
  cy.contains('button', 'Sair').should('be.visible')
}
const search = () => {
  cy.get('#student-search').clear().type('QA2026001').should('have.value', 'QA2026001')
  cy.contains('button', 'Buscar aluno').click()
  cy.contains('Aluno Teste A').should('be.visible')
}

describe('Gral.ia — casos acadêmicos com Auth/Data API Supabase local reais', () => {
  beforeEach(() => {
    cy.task<Counts>('prepareSupabaseFixture', null, { log: false }).then(baseline => {
      expect(baseline.total, 'fixture reiniciada independentemente do caso anterior').to.equal(2)
      expect(baseline.activeTarget, 'par acadêmico inicia ausente').to.equal(0)
    })
    cy.visit('/')
    cy.contains('Demonstração com dados fictícios').should('not.exist')
    cy.get('#demo-account').should('not.exist')
    cy.contains('button', 'Restaurar demonstração').should('not.exist')
    login()
    cy.contains('a', 'Matrículas').click()
  })

  it('CT-GR-001 matrícula válida: uma linha real, confirmação acessível e persistência após recarga', () => {
    cy.task<Counts>('independentEnrollmentCount', null, { log: false }).then(before => expect(before).to.deep.equal({ total: 2, activeTarget: 0 }))
    search()
    cy.intercept('POST', '**/rest/v1/rpc/registrar_matriculas').as('createEnrollment')
    cy.contains('label', 'OF-TEST-3A').find('input[type="checkbox"]').check()
    cy.contains('button', 'Registrar matrícula').click()
    cy.wait('@createEnrollment').its('response.statusCode').should('be.within', 200, 299)
    cy.get('[role="status"]').should('contain.text', 'Matrícula registrada')
    cy.get('#student-search').should('have.value', '')
    cy.get('input[type="checkbox"]:checked').should('have.length', 0)
    cy.get('@createEnrollment.all').should('have.length', 1)
    cy.task<Counts>('independentEnrollmentCount', null, { log: false }).then(after => expect(after).to.deep.equal({ total: 3, activeTarget: 1 }))
    cy.screenshot('CT-GR-001/supabase-confirmacao-real', { capture: 'fullPage' })
    cy.reload()
    search()
    cy.get('[data-testid="enrollment-list"]').should('contain.text', 'OF-TEST-3A')
    cy.task<Counts>('independentEnrollmentCount', null, { log: false }).then(afterReload => {
      expect(afterReload).to.deep.equal({ total: 3, activeTarget: 1 })
      cy.screenshot('CT-GR-001/supabase-vinculo-apos-recarga', { capture: 'fullPage' })
      cy.task('recordCase', {
        id: 'CT-GR-001', titulo: 'Matricular aluno em uma oferta válida', objetivo: 'Confirmar gravação real e persistência da matrícula.',
        pre_condicoes: 'Fixture 1.0 restaurada neste caso; par ALUNO-A/OF-TEST-3A inicia ausente; conta ADMIN-QA provisionada no Auth local.',
        dados: { matricula: 'QA2026001', oferta: 'OF-TEST-3A', status: 'ativa' },
        passos: ['Entrar com e-mail/senha reais do ADMIN-QA', 'Abrir Matrículas', 'Buscar QA2026001', 'Selecionar OF-TEST-3A', 'Enviar uma vez', 'Conferir confirmação e limpeza', 'Consultar Data API independentemente com token admin próprio', 'Recarregar e consultar novamente'],
        esperado: { total: 3, vinculos_ativos_do_par: 1, selecao_limpa: true, mensagem_acessivel: true, permanece_apos_recarga: true },
        obtido: { consulta_independente_apos_recarga: afterReload, chamadas_ui: 1, selecao_limpa: true, mensagem_role_status: true, vinculo_visivel_apos_recarga: true },
        status: 'Aprovado', prioridade: 'Alta', severidade: null, ambiente: 'Cypress + navegador + Auth/Data API Supabase local reais', responsavel: 'Executor automatizado; autoria do projeto Igor Felipe Wolff', evidencias: 'screenshots/CT-GR-001; cypress-results.json; cypress-junit.xml',
      }, { log: false })
    })
  })

  it('CT-GR-002 sem oferta: zero chamada da tela e rejeição RPC autenticada sem alteração real', () => {
    search()
    cy.intercept('POST', '**/rest/v1/rpc/registrar_matriculas').as('createEnrollment')
    cy.get('input[type="checkbox"]:checked').should('have.length', 0)
    cy.contains('button', 'Registrar matrícula').should('be.disabled')
    cy.contains('Selecione ao menos uma oferta').should('be.visible')
    cy.get('#student-search').focus().type('{enter}')
    cy.contains('button', 'Buscar aluno').should('not.be.disabled')
    cy.contains('button', 'Registrar matrícula').should('be.disabled')
    cy.get('@createEnrollment.all').should('have.length', 0)
    cy.task<Counts>('independentEnrollmentCount', null, { log: false }).then(before => expect(before).to.deep.equal({ total: 2, activeTarget: 0 }))
    cy.screenshot('CT-GR-002/supabase-botao-desabilitado', { capture: 'fullPage' })
    // Separate backend exercise: this is not a message produced by clicking the disabled button.
    cy.task<RpcResult>('emptyEnrollmentRpc', null, { log: false }).then(observed => {
      expect(observed.rejected).to.equal(true)
      expect(observed.status).to.be.within(400, 499)
      expect(observed.errorCode).to.equal('23514')
      expect(observed.before).to.deep.equal({ total: 2, activeTarget: 0 })
      expect(observed.after).to.deep.equal(observed.before)
      cy.get('@createEnrollment.all').should('have.length', 0)
      cy.contains('Aluno Teste A').should('be.visible')
      cy.task('recordCase', {
        id: 'CT-GR-002', titulo: 'Bloquear matrícula sem oferta selecionada', objetivo: 'Distinguir bloqueio da tela da rejeição autenticada do backend.',
        pre_condicoes: 'Fixture 1.0 reiniciada independentemente; duas matrículas base, nenhuma ALUNO-A/OF-TEST-3A.', dados: { matricula: 'QA2026001', ofertaIds: [] },
        passos: ['Entrar como ADMIN-QA no Auth real', 'Buscar QA2026001', 'Não selecionar oferta', 'Conferir botão desabilitado e ajuda', 'Conferir zero chamada de criação pela UI', 'Chamar RPC com [] em task Node autenticada como ADMIN-QA', 'Consultar contagem real antes/depois'],
        esperado: { chamadas_ui: 0, botao_desabilitado: true, backend_rejeita_lista_vazia: true, novas_matriculas: 0 },
        obtido: { chamadas_ui: 0, botao_desabilitado: true, orientacao_visivel: true, aluno_preservado: true, rpc_independente: observed },
        status: 'Aprovado', prioridade: 'Alta', severidade: null, ambiente: 'Cypress + Auth/Data API Supabase local reais; validação de domínio é suíte Vitest separada', responsavel: 'Executor automatizado; autoria do projeto Igor Felipe Wolff', evidencias: 'screenshots/CT-GR-002; cypress-results.json; cypress-junit.xml',
      }, { log: false })
    })
  })

  it('CT-GR-006 API nega matrícula com tokens próprios dos dois alunos e dois professores', () => {
    for (const alias of ['ALUNO-A', 'ALUNO-B', 'PROF-A', 'PROF-B']) {
      cy.task<RpcResult>('nonAdminEnrollmentRpc', alias, { log: false }).then(observed => {
        expect(observed.rejected, alias).to.equal(true)
        expect(observed.status, alias).to.equal(403)
        expect(observed.errorCode, alias).to.equal('42501')
      })
    }
    cy.task<Counts>('independentEnrollmentCount', null, { log: false }).then(after => expect(after).to.deep.equal({ total: 2, activeTarget: 0 }))
  })
})
