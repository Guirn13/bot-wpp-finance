class RepositorioIndisponivelError extends Error {
  constructor(message = 'Repositório indisponível', { cause } = {}) {
    super(message, { cause })
    this.name = 'RepositorioIndisponivelError'
  }
}

module.exports = { RepositorioIndisponivelError }

