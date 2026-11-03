const { DomainError } = require('./DomainError')

class PeriodoInvalidoError extends DomainError {
  constructor(tipoPeriodo) {
    super(`Período inválido: "${tipoPeriodo}". Use "dia", "semana" ou "mes".`)
  }
}

module.exports = { PeriodoInvalidoError }

