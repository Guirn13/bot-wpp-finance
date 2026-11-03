const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { ObterResumoGastosUseCase } = require('../../src/application/use-cases/ObterResumoGastosUseCase')
const { InMemoryGastoRepository } = require('../../src/infra/database/InMemoryGastoRepository')
const { InMemoryUsuarioRepository } = require('../../src/infra/database/InMemoryUsuarioRepository')
const { Gasto } = require('../../src/domain/entities/Gasto')

const INSTANTE_DE_REFERENCIA = new Date('2026-03-11T15:00:00Z')

describe('ObterResumoGastosUseCase', () => {
  let gastoRepository
  let usuarioRepository
  let obterResumoUseCase
  let usuarioPrincipal

  const salvarGastoNoBanco = (
    categoria,
    valor,
    dataIso,
    usuarioId = usuarioPrincipal.id
  ) =>
    gastoRepository.salvar(
      Gasto.criar({
        usuarioId,
        categoria,
        valor,
        data: new Date(dataIso),
      })
    )

  beforeEach(async () => {
    gastoRepository = new InMemoryGastoRepository()
    usuarioRepository = new InMemoryUsuarioRepository()
    obterResumoUseCase = new ObterResumoGastosUseCase(
      gastoRepository,
      usuarioRepository,
      { relogio: () => INSTANTE_DE_REFERENCIA }
    )
    usuarioPrincipal = await usuarioRepository.obterOuCriarPorWhatsappId(
      'usuario-principal',
      'Eu'
    )
    const outroUsuario =
      await usuarioRepository.obterOuCriarPorWhatsappId('outro-usuario')

    await salvarGastoNoBanco('mercado', 0.1, '2026-03-11T13:00:00Z')
    await salvarGastoNoBanco('mercado', 0.2, '2026-03-11T14:00:00Z')
    await salvarGastoNoBanco('lazer', 50, '2026-03-11T02:30:00Z')
    await salvarGastoNoBanco('transporte', 10, '2026-03-02T12:00:00Z')
    await salvarGastoNoBanco('mercado', 999, '2026-02-28T12:00:00Z')
    await salvarGastoNoBanco(
      'mercado',
      777,
      '2026-03-11T13:00:00Z',
      outroUsuario.id
    )
  })

  it('resume o dia no fuso de São Paulo, listando os itens', async () => {
    const resumo = await obterResumoUseCase.execute({
      whatsappId: 'usuario-principal',
      tipoPeriodo: 'dia',
    })

    assert.equal(resumo.usuarioCadastrado, true)
    assert.equal(resumo.quantidade, 2)
    assert.equal(resumo.total, 0.3)
    assert.deepEqual(resumo.porCategoria, { mercado: 0.3 })
    assert.deepEqual(
      resumo.itens.map((item) => item.valor),
      [0.1, 0.2]
    )
  })

  it('resume a semana agrupando por categoria', async () => {
    const resumo = await obterResumoUseCase.execute({
      whatsappId: 'usuario-principal',
      tipoPeriodo: 'semana',
    })

    assert.equal(resumo.quantidade, 3)
    assert.equal(resumo.total, 50.3)
    assert.deepEqual(resumo.porCategoria, { lazer: 50, mercado: 0.3 })
  })

  it('resume o mês', async () => {
    const resumo = await obterResumoUseCase.execute({
      whatsappId: 'usuario-principal',
      tipoPeriodo: 'mes',
    })

    assert.equal(resumo.quantidade, 4)
    assert.equal(resumo.total, 60.3)
    assert.deepEqual(resumo.porCategoria, {
      transporte: 10,
      lazer: 50,
      mercado: 0.3,
    })
  })

  it('sinaliza usuário inexistente sem criá-lo', async () => {
    const resumo = await obterResumoUseCase.execute({
      whatsappId: 'usuario-desconhecido',
      tipoPeriodo: 'mes',
    })

    assert.equal(resumo.usuarioCadastrado, false)
    assert.equal(resumo.quantidade, 0)
    assert.equal(resumo.total, 0)
    assert.equal(
      await usuarioRepository.buscarPorWhatsappId('usuario-desconhecido'),
      null
    )
  })

  it('delega a filtragem por período ao repositório', async () => {
    const chamadasRecebidas = []
    gastoRepository.buscarPorPeriodo = async (...argumentos) => {
      chamadasRecebidas.push(argumentos)
      return []
    }

    await obterResumoUseCase.execute({
      whatsappId: 'usuario-principal',
      tipoPeriodo: 'dia',
    })

    assert.deepEqual(chamadasRecebidas, [
      [
        usuarioPrincipal.id,
        new Date('2026-03-11T03:00:00Z'),
        new Date('2026-03-12T03:00:00Z'),
      ],
    ])
  })
})

