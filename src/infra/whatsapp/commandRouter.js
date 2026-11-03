const { DomainError } = require('../../domain/errors/DomainError')
const { RepositorioIndisponivelError } = require('../../application/errors/RepositorioIndisponivelError')

const PREFIXO_COMANDO_GASTO = 'gasto:'
const PERIODO_POR_COMANDO_DE_RESUMO = {
  '!dia': 'dia',
  '!semana': 'semana',
  '!mes': 'mes',
}

function interpretarValorMonetario(textoDoValor) {
  let valorNormalizado = textoDoValor.replace(/^r\$\s*/i, '')

  if (valorNormalizado.includes(',')) {
    valorNormalizado = valorNormalizado.replace(/\./g, '').replace(',', '.')
  }

  if (!/^\d+(\.\d{1,2})?$/.test(valorNormalizado)) {
    return null
  }

  return Number(valorNormalizado)
}

function extrairCategoriaEValorDoComando(argumentosDoComando) {
  const termos = argumentosDoComando.split(/\s+/).filter(Boolean)
  if (termos.length < 2) {
    return null
  }

  const ultimoTermo = termos.pop()
  const valor = interpretarValorMonetario(ultimoTermo)
  if (valor === null) {
    return null
  }

  return {
    categoria: termos.join(' '),
    valor,
  }
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

    try {
      if (comandoNormalizado.startsWith(PREFIXO_COMANDO_GASTO)) {
        const argumentosDoGasto = comandoNormalizado.slice(
          PREFIXO_COMANDO_GASTO.length
        )
        return await this.executarRegistroDeGasto(
          argumentosDoGasto,
          remetenteId,
          nomeRemetente
        )
      }

      if (Object.hasOwn(PERIODO_POR_COMANDO_DE_RESUMO, comandoNormalizado)) {
        const tipoPeriodo = PERIODO_POR_COMANDO_DE_RESUMO[comandoNormalizado]
        return await this.executarResumoDeGastos(tipoPeriodo, remetenteId)
      }

      if (comandoNormalizado === '!ajuda') {
        return this.presenter.ajuda()
      }

      return null
    } catch (erro) {
      return this.traduzirErroParaMensagem(erro)
    }
  }

  async executarRegistroDeGasto(argumentosDoComando, whatsappId, nome) {
    const dadosDoGasto = extrairCategoriaEValorDoComando(argumentosDoComando)
    if (!dadosDoGasto) {
      return this.presenter.formatoInvalido()
    }

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

