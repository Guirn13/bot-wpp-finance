const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { Gasto } = require('../../src/domain/entities/Gasto')
const { ValorInvalidoError } = require('../../src/domain/errors/ValorInvalidoError')
const { CategoriaInvalidaError } = require('../../src/domain/errors/CategoriaInvalidaError')

const dadosBaseDoGasto = {
  usuarioId: 'usuario-1',
  categoria: 'Mercado',
  valor: 10,
  data: new Date('2026-03-10T12:00:00Z'),
}

describe('Gasto', () => {
  it('higieniza a categoria', () => {
    const gasto = Gasto.criar({
      ...dadosBaseDoGasto,
      categoria: '  Comida   Fora ',
    })
    assert.equal(gasto.categoria, 'comida fora')
  })

  it('arredonda o valor para centavos', () => {
    assert.equal(Gasto.criar({ ...dadosBaseDoGasto, valor: 10.005 }).valor, 10.01)
    assert.equal(
      Gasto.criar({ ...dadosBaseDoGasto, valor: 0.1 }).valorEmCentavos,
      10
    )
  })

  for (const valorInvalido of [0, -5, NaN, Infinity, '10', 0.001, 1e9]) {
    it(`rejeita valor inválido: ${String(valorInvalido)}`, () => {
      assert.throws(
        () => Gasto.criar({ ...dadosBaseDoGasto, valor: valorInvalido }),
        ValorInvalidoError
      )
    })
  }

  for (const categoriaInvalida of ['', '   ', null, 'x'.repeat(51)]) {
    it(`rejeita categoria inválida: ${JSON.stringify(categoriaInvalida)}`, () => {
      assert.throws(
        () => Gasto.criar({ ...dadosBaseDoGasto, categoria: categoriaInvalida }),
        CategoriaInvalidaError
      )
    })
  }

  it('é imutável e comId devolve nova instância', () => {
    const gastoSemId = Gasto.criar(dadosBaseDoGasto)
    const gastoComId = gastoSemId.comId('gasto-1')

    assert.equal(gastoSemId.id, null)
    assert.equal(gastoComId.id, 'gasto-1')
    assert.equal(gastoComId.categoria, gastoSemId.categoria)
    assert.ok(Object.isFrozen(gastoSemId))
  })
})

