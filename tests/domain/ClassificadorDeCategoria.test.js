const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { classificarCategoria } = require('../../src/domain/services/ClassificadorDeCategoria')

describe('classificarCategoria', () => {
  const casosDeClassificacao = [
    ['casa', 'moradia'],
    ['aluguel', 'moradia'],
    ['conta de luz', 'moradia'],
    ['reforma da casa', 'moradia'],
    ['mercado', 'alimentação'],
    ['Comida Fora', 'alimentação'],
    ['ifood', 'alimentação'],
    ['padaria', 'alimentação'],
    ['uber', 'transporte'],
    ['99', 'transporte'],
    ['gasolina', 'transporte'],
    ['farmácia', 'saúde'],
    ['remédio', 'saúde'],
    ['cinema', 'lazer'],
    ['netflix', 'lazer'],
    ['faculdade', 'educação'],
    ['livro', 'educação'],
    ['tênis', 'vestuário'],
    ['barbearia', 'cuidados pessoais'],
    ['ração do cachorro', 'pets'],
    ['conta de celular', 'contas e serviços'],
  ]

  for (const [entrada, categoriaEsperada] of casosDeClassificacao) {
    it(`classifica "${entrada}" como "${categoriaEsperada}"`, () => {
      assert.equal(classificarCategoria(entrada), categoriaEsperada)
    })
  }

  it('mantém a descrição higienizada quando não reconhece a categoria', () => {
    assert.equal(classificarCategoria('  Presente de Aniversário '), 'presente de aniversário')
    assert.equal(classificarCategoria('item-1'), 'item-1')
  })
})

