const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { RegistrarGastoUseCase } = require('../../src/application/use-cases/RegistrarGastoUseCase')
const { InMemoryGastoRepository } = require('../../src/infra/database/InMemoryGastoRepository')
const { InMemoryUsuarioRepository } = require('../../src/infra/database/InMemoryUsuarioRepository')
const { ValorInvalidoError } = require('../../src/domain/errors/ValorInvalidoError')

const INSTANTE_FIXO = new Date('2026-03-10T15:00:00Z')

describe('RegistrarGastoUseCase', () => {
  let gastoRepository
  let usuarioRepository
  let registrarGastoUseCase

  beforeEach(() => {
    gastoRepository = new InMemoryGastoRepository()
    usuarioRepository = new InMemoryUsuarioRepository()
    registrarGastoUseCase = new RegistrarGastoUseCase(
      gastoRepository,
      usuarioRepository,
      { relogio: () => INSTANTE_FIXO }
    )
  })

  it('cria o usuário, classifica a categoria e persiste o gasto', async () => {
    const gastoRegistrado = await registrarGastoUseCase.execute({
      whatsappId: '5511@c.us',
      nome: 'Ana',
      categoria: 'casa',
      valor: 200,
    })

    assert.ok(gastoRegistrado.id)
    assert.deepEqual(
      { ...gastoRegistrado, id: undefined },
      {
        id: undefined,
        categoria: 'moradia',
        valor: 200,
        data: INSTANTE_FIXO,
      }
    )

    const usuario = await usuarioRepository.buscarPorWhatsappId('5511@c.us')
    assert.equal(usuario.nome, 'Ana')
    assert.equal(gastoRepository.gastos.length, 1)
    assert.equal(gastoRepository.gastos[0].usuarioId, usuario.id)
  })

  it('mantém a categoria original quando não há correspondência', async () => {
    const gastoRegistrado = await registrarGastoUseCase.execute({
      whatsappId: '5511@c.us',
      nome: 'Ana',
      categoria: 'Presente',
      valor: 80,
    })

    assert.equal(gastoRegistrado.categoria, 'presente')
  })

  it('reaproveita o usuário existente e cacheia a resolução', async () => {
    let quantidadeDeConsultas = 0
    const obterOuCriarOriginal =
      usuarioRepository.obterOuCriarPorWhatsappId.bind(usuarioRepository)
    usuarioRepository.obterOuCriarPorWhatsappId = (...argumentos) => {
      quantidadeDeConsultas++
      return obterOuCriarOriginal(...argumentos)
    }

    await Promise.all([
      registrarGastoUseCase.execute({
        whatsappId: 'usuario-a',
        categoria: 'item-1',
        valor: 1,
      }),
      registrarGastoUseCase.execute({
        whatsappId: 'usuario-a',
        categoria: 'item-2',
        valor: 2,
      }),
    ])
    await registrarGastoUseCase.execute({
      whatsappId: 'usuario-a',
      categoria: 'item-3',
      valor: 3,
    })

    assert.equal(quantidadeDeConsultas, 1)
    assert.equal(usuarioRepository.usuarios.size, 1)
    assert.equal(gastoRepository.gastos.length, 3)
  })

  it('não cacheia falhas na resolução do usuário', async () => {
    let deveFalhar = true
    const obterOuCriarOriginal =
      usuarioRepository.obterOuCriarPorWhatsappId.bind(usuarioRepository)
    usuarioRepository.obterOuCriarPorWhatsappId = async (...argumentos) => {
      if (deveFalhar) throw new Error('falha de rede')
      return obterOuCriarOriginal(...argumentos)
    }

    await assert.rejects(
      registrarGastoUseCase.execute({
        whatsappId: 'usuario-a',
        categoria: 'item-1',
        valor: 1,
      }),
      /falha de rede/
    )

    deveFalhar = false
    await registrarGastoUseCase.execute({
      whatsappId: 'usuario-a',
      categoria: 'item-1',
      valor: 1,
    })

    assert.equal(gastoRepository.gastos.length, 1)
  })

  it('propaga erros de domínio sem persistir', async () => {
    await assert.rejects(
      registrarGastoUseCase.execute({
        whatsappId: 'usuario-a',
        categoria: 'item-1',
        valor: 0,
      }),
      ValorInvalidoError
    )
    assert.equal(gastoRepository.gastos.length, 0)
  })
})
