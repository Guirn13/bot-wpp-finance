const { DomainError } = require('../../domain/errors/DomainError')
const { RepositorioIndisponivelError } = require('../../application/errors/RepositorioIndisponivelError')

const PERIODO_POR_COMANDO_DE_RESUMO = {
  '!dia': 'dia',
  '!semana': 'semana',
  '!mes': 'mes',
}

const COMANDOS_DE_MENU = new Set(['!ajuda', 'ajuda', '!menu', 'menu'])

const REGEX_PREFIXO_DE_GASTO =
  /^(?:(?:hoje|ontem|agora)\s+)?(?:gasto\s*:\s*|despesa\s*:\s*)?(?:(?:gastei|paguei|comprei|torrei|investi|foi|foram|deu|saiu|custou)\b\s*)?/i

const REGEX_INTENCAO_EXPLICITA_DE_GASTO =
  /^(?:(?:hoje|ontem|agora)\s+)?(?:gasto\s*:|despesa\s*:|(?:gastei|paguei|comprei|torrei|investi)\b)/i

const REGEX_VALOR_NO_INICIO_COM_PREPOSICAO =
  /^((?:r\$\s*)?\S+(?:\s+(?:reais|real|contos?|pilas?))?)\s+((?:em|no|na|nos|nas|com|de|do|da|dos|das|para|pra|pro|por|num|numa|pelo|pela)\b.+)$/i

const REGEX_VALOR_NO_FIM =
  /^(.+?)\s+((?:r\$\s*)?\S+(?:\s+(?:reais|real|contos?|pilas?))?)$/i

const REGEX_VALOR_NO_INICIO =
  /^((?:r\$\s*)?\S+(?:\s+(?:reais|real|contos?|pilas?))?)\s+(.+)$/i

const CONECTORES_DE_BORDA = new Set([
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'com',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'para',
  'pra',
  'pro',
  'por',
  'num',
  'numa',
  'pelo',
  'pela',
  'pelos',
  'pelas',
  'um',
  'uma',
  'uns',
  'umas',
  'o',
  'a',
  'os',
  'as',
  'hoje',
  'ontem',
  'agora',
])

function interpretarValorMonetario(textoDoValor) {
  let valorNormalizado = String(textoDoValor)
    .trim()
    .replace(/^r\$\s*/i, '')
    .replace(/\s*(?:reais|real|contos?|pilas?)$/i, '')
    .trim()

  if (valorNormalizado.includes(',')) {
    valorNormalizado = valorNormalizado.replace(/\./g, '').replace(',', '.')
  }

  if (!/^\d+(\.\d{1,2})?$/.test(valorNormalizado)) {
    return null
  }

  return Number(valorNormalizado)
}

function limparDescricaoDaCategoria(descricaoBruta) {
  const palavras = (descricaoBruta || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  while (
    palavras.length > 0 &&
    CONECTORES_DE_BORDA.has(palavras[0].toLowerCase())
  ) {
    palavras.shift()
  }

  while (
    palavras.length > 0 &&
    CONECTORES_DE_BORDA.has(palavras[palavras.length - 1].toLowerCase())
  ) {
    palavras.pop()
  }

  return palavras.join(' ')
}

function tentarMontarGasto(textoDaCategoria, textoDoValor) {
  const valor = interpretarValorMonetario(textoDoValor)
  if (valor === null) {
    return null
  }

  const categoria = limparDescricaoDaCategoria(textoDaCategoria)
  if (!categoria) {
    return null
  }

  return { categoria, valor }
}

function extrairCategoriaEValorDoComando(textoBruto) {
  const textoSemPrefixo = (textoBruto || '')
    .trim()
    .replace(REGEX_PREFIXO_DE_GASTO, '')
    .replace(/\s+(?:hoje|ontem|agora)$/i, '')
    .trim()

  if (!textoSemPrefixo) {
    return null
  }

  const correspondenciaInicioComPreposicao = textoSemPrefixo.match(
    REGEX_VALOR_NO_INICIO_COM_PREPOSICAO
  )
  if (correspondenciaInicioComPreposicao) {
    const [, textoDoValor, textoDaCategoria] = correspondenciaInicioComPreposicao
    const gastoExtraido = tentarMontarGasto(textoDaCategoria, textoDoValor)
    if (gastoExtraido) return gastoExtraido
  }

  const correspondenciaNoFim = textoSemPrefixo.match(REGEX_VALOR_NO_FIM)
  if (correspondenciaNoFim) {
    const [, textoDaCategoria, textoDoValor] = correspondenciaNoFim
    const gastoExtraido = tentarMontarGasto(textoDaCategoria, textoDoValor)
    if (gastoExtraido) return gastoExtraido
  }

  const correspondenciaNoInicio = textoSemPrefixo.match(REGEX_VALOR_NO_INICIO)
  if (correspondenciaNoInicio) {
    const [, textoDoValor, textoDaCategoria] = correspondenciaNoInicio
    const gastoExtraido = tentarMontarGasto(textoDaCategoria, textoDoValor)
    if (gastoExtraido) return gastoExtraido
  }

  return null
}

class CommandRouter {
  constructor({
    registrarGastoUseCase,
    obterResumoUseCase,
    presenter,
    logger = console,
  }) {
    this.registrarGastoUseCase = registrarGastoUseCase
    this.obterResumoUseCase = obterResumoUseCase
    this.presenter = presenter
    this.logger = logger
  }

  async handle({ texto, remetenteId, nomeRemetente }) {
    const comandoNormalizado = (texto || '').trim().toLowerCase()
    if (!comandoNormalizado) {
      return null
    }

    try {
      if (Object.hasOwn(PERIODO_POR_COMANDO_DE_RESUMO, comandoNormalizado)) {
        const tipoPeriodo = PERIODO_POR_COMANDO_DE_RESUMO[comandoNormalizado]
        return await this.executarResumoDeGastos(tipoPeriodo, remetenteId)
      }

      if (COMANDOS_DE_MENU.has(comandoNormalizado)) {
        return this.presenter.ajuda()
      }

      const dadosDoGasto = extrairCategoriaEValorDoComando(comandoNormalizado)
      if (dadosDoGasto) {
        return await this.executarRegistroDeGasto(
          dadosDoGasto,
          remetenteId,
          nomeRemetente
        )
      }

      if (REGEX_INTENCAO_EXPLICITA_DE_GASTO.test(comandoNormalizado)) {
        return this.presenter.formatoInvalido()
      }

      return null
    } catch (erro) {
      return this.traduzirErroParaMensagem(erro)
    }
  }

  async executarRegistroDeGasto(dadosDoGasto, whatsappId, nome) {
    const gastoRegistrado = await this.registrarGastoUseCase.execute({
      whatsappId,
      nome,
      ...dadosDoGasto,
    })

    return this.presenter.gastoRegistrado(gastoRegistrado)
  }

  async executarResumoDeGastos(tipoPeriodo, whatsappId) {
    const resumoDeGastos = await this.obterResumoUseCase.execute({
      whatsappId,
      tipoPeriodo,
    })

    return this.presenter.resumo(resumoDeGastos)
  }

  traduzirErroParaMensagem(erro) {
    if (erro instanceof DomainError) {
      return this.presenter.erroDeValidacao(erro.message)
    }

    if (erro instanceof RepositorioIndisponivelError) {
      this.logger.error('[repositorio]', erro.message)
      return this.presenter.servicoIndisponivel()
    }

    this.logger.error('[erro inesperado]', erro)
    return this.presenter.erroInesperado()
  }
}

module.exports = {
  CommandRouter,
  interpretarValor: interpretarValorMonetario,
  interpretarGasto: extrairCategoriaEValorDoComando,
}
