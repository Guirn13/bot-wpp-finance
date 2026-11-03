const { DomainError } = require('./DomainError')

class ValorInvalidoError extends DomainError {
  constructor(message = 'O valor do gasto deve ser um número maior que zero.') {
    super(message)
  }
}

module.exports = { ValorInvalidoError }

