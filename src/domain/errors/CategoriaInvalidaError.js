const { DomainError } = require('./DomainError')

class CategoriaInvalidaError extends DomainError {
  constructor(message = 'A categoria do gasto não pode ser vazia.') {
    super(message)
  }
}

module.exports = { CategoriaInvalidaError }

