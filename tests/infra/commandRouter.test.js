const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { CommandRouter, interpretarValor } = require('../../src/infra/whatsapp/commandRouter')
const { WhatsappMessagePresenter } = require('../../src/infra/whatsapp/messagePresenter')
const { RegistrarGastoUseCase } = require('../../src/application/use-cases/RegistrarGastoUseCase')
const { ObterResumoGastosUseCase } = require('../../src/application/use-cases/ObterResumoGastosUseCase')
const { RepositorioIndisponivelError } = require('../../src/application/errors/RepositorioIndisponivelError')
const { InMemoryGastoRepository } = require('../../src/infra/database/InMemoryGastoRepository')
const { InMemoryUsuarioRepository } = require('../../src/infra/database/InMemoryUsuarioRepository')

const INSTANTE_FIXO = new Date('2026-03-11T15:00:00Z')
const loggerSilencioso = { error: () => {} }

describe('interpretarValor', () => {
  const casosDeTeste = {
    50: 50,
    50.5: 50.5,
    '50,50': 50.5,
    '120.50': 120.5,
    r$50: 50,
    'R$ 12,30': 12.3,
    '1.234,56': 1234.56,
    abc: null,
    50.123: null,
    '-5': null,
    '': null,
    '1,2,3': null,
  }

  for (const [textoDeEntrada, valorEsperado] of Object.entries(casosDeTeste)) {
    it(`"${textoDeEntrada}" → ${valorEsperado}`, () => {
      assert.equal(interpretarValor(textoDeEntrada), valorEsperado)
    })
  }
})

describe('CommandRouter', () => {
  let commandRouter
  let gastoRepository
  const presenter = new WhatsappMessagePresenter()

  const enviarMensagem = (texto, remetenteId = 'usuario-padrao') =>
    commandRouter.handle({ texto, remetenteId, nomeRemetente: 'Eu' })

  beforeEach(() => {
    gastoRepository = new InMemoryGastoRepository()
    const usuarioRepository = new InMemoryUsuarioRepository()
    const relogioFixo = () => INSTANTE_FIXO

    commandRouter = new CommandRouter({
      registrarGastoUseCase: new RegistrarGastoUseCase(
        gastoRepository,
        usuarioRepository,
        { relogio: relogioFixo }
      ),
      obterResumoUseCase: new ObterResumoGastosUseCase(
        gastoRepository,
        usuarioRepository,
        { relogio: relogioFixo }
      ),
      presenter,
      logger: loggerSilencioso,
    })
  })

  it('registra gasto com vírgula decimal e categoria composta', async () => {
    const resposta = await enviarMensagem('Gasto: Comida Fora 50,00')
    assert.equal(resposta, '✅ Gasto registrado: *comida fora* - R$50.00')
  })

  it('mantém compatibilidade com o formato legado', async () => {
    assert.equal(
      await enviarMensagem('gasto: mercado 120.50'),
      '✅ Gasto registrado: *mercado* - R$120.50'
    )
  })

  for (const comandoInvalido of [
    'gasto:',
    'gasto: mercado',
    'gasto: mercado abc',
    'gasto: 50',
  ]) {
    it(`responde formato inválido para "${comandoInvalido}"`, async () => {
      assert.equal(
        await enviarMensagem(comandoInvalido),
        presenter.formatoInvalido()
      )
    })
  }

  it('traduz erros de domínio em mensagens amigáveis', async () => {
    const resposta = await enviarMensagem('gasto: mercado 0')
    assert.match(resposta, /^⚠️ O valor do gasto deve ser/)
  })

  it('monta os resumos de !dia, !semana e !mes', async () => {
    await enviarMensagem('gasto: mercado 10')
    await enviarMensagem('gasto: mercado 5,5')
    await enviarMensagem('gasto: lazer 20')

    assert.equal(
      await enviarMensagem('!dia'),
      '📅 *Resumo dos gastos de hoje*\n\n- mercado: R$10.00\n- mercado: R$5.50\n- lazer: R$20.00\n\n💰 *Total:* R$35.50'
    )
    assert.equal(
      await enviarMensagem(' !SEMANA '),
      '📅 *Resumo dos gastos nesta semana*\n\n- mercado: R$15.50\n- lazer: R$20.00\n\n💰 *Total:* R$35.50'
    )
    assert.match(
      await enviarMensagem('!mes'),
      /^📅 \*Resumo dos gastos deste mês\*/
    )
  })

  it('diferencia usuário sem histórico de período vazio', async () => {
    assert.equal(
      await enviarMensagem('!mes'),
      '📭 Nenhum gasto registrado ainda.'
    )

    await enviarMensagem('gasto: mercado 10')
    commandRouter.obterResumoUseCase.relogio = () =>
      new Date('2026-05-01T15:00:00Z')
    assert.equal(await enviarMensagem('!mes'), '📭 Nenhum gasto neste mês.')
  })

  it('responde !ajuda', async () => {
    assert.equal(await enviarMensagem('!ajuda'), presenter.ajuda())
  })

  it('ignora mensagens que não são comandos', async () => {
    assert.equal(await enviarMensagem('oi, tudo bem?'), null)
    assert.equal(await enviarMensagem('constructor'), null)
    assert.equal(await enviarMensagem(''), null)
  })

  it('responde mensagem amigável quando o banco está indisponível', async () => {
    gastoRepository.salvar = async () => {
      throw new RepositorioIndisponivelError('timeout')
    }
    assert.equal(
      await enviarMensagem('gasto: mercado 10'),
      presenter.servicoIndisponivel()
    )
  })

  it('responde erro genérico para falhas inesperadas', async () => {
    gastoRepository.buscarPorPeriodo = async () => {
      throw new TypeError('bug')
    }
    await enviarMensagem('gasto: mercado 10')
    assert.equal(await enviarMensagem('!dia'), presenter.erroInesperado())
  })
})

