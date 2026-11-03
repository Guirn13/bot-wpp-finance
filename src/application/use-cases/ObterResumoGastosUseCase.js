const { IObterResumoGastosUseCase } = require('../ports/in/IObterResumoGastosUseCase')
const { Periodo, FUSO_HORARIO_PADRAO } = require('../../domain/value-objects/Periodo')

const CENTAVOS_POR_REAL = 100

function converterCentavosParaReais(valorEmCentavos) {
  return valorEmCentavos / CENTAVOS_POR_REAL
}

class ObterResumoGastosUseCase extends IObterResumoGastosUseCase {
  constructor(
    gastoRepository,
    usuarioRepository,
    { relogio = () => new Date(), fuso = FUSO_HORARIO_PADRAO } = {}
  ) {
    super()
    this.gastoRepository = gastoRepository
    this.usuarioRepository = usuarioRepository
    this.relogio = relogio
    this.fuso = fuso
  }

  async execute({ whatsappId, tipoPeriodo }) {
    const periodo = Periodo.de(tipoPeriodo, {
      agora: this.relogio(),
      fuso: this.fuso,
    })
    const usuario = await this.usuarioRepository.buscarPorWhatsappId(whatsappId)

    if (!usuario) {
      return consolidarResumoDeGastos(periodo, [], { usuarioCadastrado: false })
    }

    const gastosDoPeriodo = await this.gastoRepository.buscarPorPeriodo(
      usuario.id,
      periodo.inicio,
      periodo.fim
    )

    return consolidarResumoDeGastos(periodo, gastosDoPeriodo, {
      usuarioCadastrado: true,
    })
  }
}

function consolidarResumoDeGastos(periodo, gastos, { usuarioCadastrado }) {
  const centavosAgrupadosPorCategoria = new Map()
  let totalEmCentavos = 0

  for (const gasto of gastos) {
    const centavosAcumulados = centavosAgrupadosPorCategoria.get(gasto.categoria) || 0
    centavosAgrupadosPorCategoria.set(
      gasto.categoria,
      centavosAcumulados + gasto.valorEmCentavos
    )
    totalEmCentavos += gasto.valorEmCentavos
  }

  const totalPorCategoria = {}
  for (const [categoria, centavos] of centavosAgrupadosPorCategoria) {
    totalPorCategoria[categoria] = converterCentavosParaReais(centavos)
  }

  return {
    tipoPeriodo: periodo.tipo,
    inicio: periodo.inicio,
    fim: periodo.fim,
    usuarioCadastrado,
    total: converterCentavosParaReais(totalEmCentavos),
    quantidade: gastos.length,
    porCategoria: totalPorCategoria,
    itens: gastos.map(({ categoria, valor, data }) => ({
      categoria,
      valor,
      data,
    })),
  }
}

module.exports = { ObterResumoGastosUseCase }

