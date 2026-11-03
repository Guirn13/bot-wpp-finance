const { ValorInvalidoError } = require('../errors/ValorInvalidoError')
const { CategoriaInvalidaError } = require('../errors/CategoriaInvalidaError')

const VALOR_MAXIMO_PERMITIDO = 99_999_999.99
const TAMANHO_MAXIMO_CATEGORIA = 50
const CENTAVOS_POR_REAL = 100

function higienizarCategoria(categoria) {
  if (typeof categoria !== 'string') throw new CategoriaInvalidaError()

  const categoriaHigienizada = categoria.trim().replace(/\s+/g, ' ').toLowerCase()

  if (!categoriaHigienizada) throw new CategoriaInvalidaError()
  if (categoriaHigienizada.length > TAMANHO_MAXIMO_CATEGORIA) {
    throw new CategoriaInvalidaError(
      `A categoria deve ter no máximo ${TAMANHO_MAXIMO_CATEGORIA} caracteres.`
    )
  }

  return categoriaHigienizada
}

function validarValorMonetario(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new ValorInvalidoError()
  }

  const valorArredondado = Math.round(valor * CENTAVOS_POR_REAL) / CENTAVOS_POR_REAL

  if (valorArredondado <= 0) throw new ValorInvalidoError()
  if (valorArredondado > VALOR_MAXIMO_PERMITIDO) {
    throw new ValorInvalidoError('O valor informado é grande demais.')
  }

  return valorArredondado
}

function validarData(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new Error('Gasto requer uma data válida.')
  }

  return new Date(data.getTime())
}

class Gasto {
  constructor({ id = null, usuarioId, categoria, valor, data }) {
    if (!usuarioId) throw new Error('Gasto requer um usuarioId.')

    this.id = id
    this.usuarioId = usuarioId
    this.categoria = higienizarCategoria(categoria)
    this.valor = validarValorMonetario(valor)
    this.data = validarData(data)
    Object.freeze(this)
  }

  static criar({ usuarioId, categoria, valor, data = new Date() }) {
    return new Gasto({ usuarioId, categoria, valor, data })
  }

  comId(id) {
    return new Gasto({ ...this, id })
  }

  get valorEmCentavos() {
    return Math.round(this.valor * CENTAVOS_POR_REAL)
  }
}

module.exports = { Gasto, VALOR_MAXIMO_PERMITIDO, TAMANHO_MAXIMO_CATEGORIA }

