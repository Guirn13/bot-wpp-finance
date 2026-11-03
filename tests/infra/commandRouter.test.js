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
    '200 reais': 200,
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

  it('interpreta mensagens naturais e classifica na categoria correspondente', async () => {
    assert.equal(
      await enviarMensagem('gastei 200 em casa'),
      '✅ *Gasto registrado!*\n🏠 *Categoria:* moradia\n💵 *Valor:* R$200.00'
    )
    assert.equal(
      await enviarMensagem('paguei 50,50 no mercado'),
      '✅ *Gasto registrado!*\n🍽️ *Categoria:* alimentação\n💵 *Valor:* R$50.50'
    )
    assert.equal(
      await enviarMensagem('comprei um remédio por R$ 42,90'),
      '✅ *Gasto registrado!*\n💊 *Categoria:* saúde\n💵 *Valor:* R$42.90'
    )
    assert.equal(
      await enviarMensagem('uber 35'),
      '✅ *Gasto registrado!*\n🚗 *Categoria:* transporte\n💵 *Valor:* R$35.00'
    )
    assert.equal(
      await enviarMensagem('gastei 35 reais no 99'),
      '✅ *Gasto registrado!*\n🚗 *Categoria:* transporte\n💵 *Valor:* R$35.00'
    )
    assert.equal(
      await enviarMensagem('150 de conta de luz'),
      '✅ *Gasto registrado!*\n🏠 *Categoria:* moradia\n💵 *Valor:* R$150.00'
    )
  })

  it('mantém a descrição original quando não reconhece uma categoria padrão', async () => {
    assert.equal(
      await enviarMensagem('gastei 80 com presente'),
      '✅ *Gasto registrado!*\n🏷️ *Categoria:* presente\n💵 *Valor:* R$80.00'
    )
  })

  it('registra gasto com vírgula decimal e categoria composta', async () => {
    const resposta = await enviarMensagem('Gasto: Comida Fora 50,00')
    assert.equal(
      resposta,
      '✅ *Gasto registrado!*\n🍽️ *Categoria:* alimentação\n💵 *Valor:* R$50.00'
    )
  })

  it('mantém compatibilidade com o formato legado', async () => {
    assert.equal(
      await enviarMensagem('gasto: mercado 120.50'),
      '✅ *Gasto registrado!*\n🍽️ *Categoria:* alimentação\n💵 *Valor:* R$120.50'
    )
  })

  for (const comandoInvalido of [
    'gasto:',
    'gasto: mercado',
    'gasto: mercado abc',
    'gasto: 50',
    'gastei',
    'gastei 50',
    'paguei em casa',
  ]) {
    it(`responde formato inválido para "${comandoInvalido}"`, async () => {
      assert.equal(
        await enviarMensagem(comandoInvalido),
        presenter.formatoInvalido()
      )
    })
  }

  it('traduz erros de domínio em mensagens amigáveis', async () => {
    const resposta = await enviarMensagem('gastei 0 em casa')
    assert.match(resposta, /^⚠️ O valor do gasto deve ser/)
  })

  it('monta os resumos de !dia, !semana e !mes com categorias classificadas e ícones', async () => {
    await enviarMensagem('gastei 10 no mercado')
    await enviarMensagem('paguei 5,5 na padaria')
    await enviarMensagem('cinema 20')

    assert.equal(
      await enviarMensagem('!dia'),
      '📊 *Resumo dos gastos de hoje*\n' +
        '────────────────────\n' +
        '🍽️ *alimentação:* R$10.00\n' +
        '🍽️ *alimentação:* R$5.50\n' +
        '🎉 *lazer:* R$20.00\n' +
        '────────────────────\n' +
        '🧾 *Lançamentos:* 3\n' +
        '💰 *Total:* *R$35.50*'
    )
    assert.equal(
      await enviarMensagem(' !SEMANA '),
      '📊 *Resumo dos gastos nesta semana*\n' +
        '────────────────────\n' +
        '🍽️ *alimentação:* R$15.50\n' +
        '🎉 *lazer:* R$20.00\n' +
        '────────────────────\n' +
        '🧾 *Lançamentos:* 3\n' +
        '💰 *Total:* *R$35.50*'
    )
    assert.match(
      await enviarMensagem('!mes'),
      /^📊 \*Resumo dos gastos deste mês\*/
    )
  })

  it('diferencia usuário sem histórico de período vazio', async () => {
    assert.equal(
      await enviarMensagem('!mes'),
      '📭 *Nenhum gasto registrado ainda.*\n💡 Envie algo como `gastei 50 no mercado` para começar!'
    )

    await enviarMensagem('gastei 10 no mercado')
    commandRouter.obterResumoUseCase.relogio = () =>
      new Date('2026-05-01T15:00:00Z')
    assert.equal(await enviarMensagem('!mes'), '📭 *Nenhum gasto neste mês.*')
  })

  for (const comandoDeMenu of ['!ajuda', 'ajuda', '!menu', 'menu']) {
    it(`exibe o menu ao enviar "${comandoDeMenu}"`, async () => {
      assert.equal(await enviarMensagem(comandoDeMenu), presenter.ajuda())
    })
  }

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
      await enviarMensagem('gastei 10 no mercado'),
      presenter.servicoIndisponivel()
    )
  })

  it('responde erro genérico para falhas inesperadas', async () => {
    gastoRepository.buscarPorPeriodo = async () => {
      throw new TypeError('bug')
    }
    await enviarMensagem('gastei 10 no mercado')
    assert.equal(await enviarMensagem('!dia'), presenter.erroInesperado())
  })
})
