/// <reference types="cypress" />
import type { Repository } from '../../app/src/domain/types'
type DemoHook = { repo: Repository; reset: () => Promise<void> }
const hook = () => cy.window().its('__graliaTest').should('exist') as Cypress.Chainable<DemoHook>
const control = (label: string) => cy.contains('label', label).then(($label) => {
  const id = $label.attr('for')
  return id ? cy.get(`#${id}`) : cy.wrap($label).find('input,select,textarea')
})
describe('Gral.ia — teclado e foco na demonstração local', () => {
  beforeEach(() => {
    cy.clock(new Date('2026-11-16T12:00:00Z').getTime(), ['Date'])
    cy.visit('/')
    hook().then((test) => test.reset())
    cy.reload()
  })
  it('CT-GR-036/037 teclado opera entrada, matrícula, skip link e foco do modal', () => {
    cy.window().then((win) => win.focus())
    cy.get('.skip-link').focus()
    cy.press(Cypress.Keyboard.Keys.ENTER)
    cy.focused().should('have.attr', 'id', 'main-content')
    control('Conta de teste').focus()
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('match', 'button').and('contain.text', 'Entrar na demonstração').type('{enter}')
    cy.contains('button', 'Sair').should('be.visible')
    cy.contains('a', 'Matrículas').focus()
    cy.press(Cypress.Keyboard.Keys.ENTER)
    control('Matrícula do aluno').focus().type('QA2026001{enter}')
    cy.contains('Aluno Teste A').should('be.visible')
    cy.contains('label', 'OF-TEST-3A').find('input').focus()
    cy.press(Cypress.Keyboard.Keys.SPACE)
    cy.contains('label', 'OF-TEST-3A').find('input').should('be.checked')
    cy.contains('button', 'Registrar matrícula').should('be.enabled').focus()
    cy.press(Cypress.Keyboard.Keys.SPACE)
    cy.get('[role="status"]').should('contain.text', 'Matrícula registrada')
    cy.contains('button', 'Restaurar demonstração').focus()
    cy.press(Cypress.Keyboard.Keys.SPACE)
    cy.get('[role="dialog"]').should('be.visible')
    cy.focused().should('contain.text', 'Manter alterações')
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('contain.text', 'Restaurar dados')
    cy.press(Cypress.Keyboard.Keys.TAB)
    cy.focused().should('contain.text', 'Manter alterações')
    cy.press(Cypress.Keyboard.Keys.ESC)
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('button', 'Restaurar demonstração').should('have.focus')
    cy.screenshot('CT-GR-036/fluxo-teclado-modal', {capture:'fullPage'})
  })

})
