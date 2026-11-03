const { PeriodoInvalidoError } = require('../errors/PeriodoInvalidoError')

const FUSO_HORARIO_PADRAO = 'America/Sao_Paulo'
const TIPOS_PERIODO_VALIDOS = Object.freeze(['dia', 'semana', 'mes'])
const DIAS_POR_SEMANA = 7
const MILISSEGUNDOS_POR_SEGUNDO = 1000

const formatadoresPorFuso = new Map()

function obterFormatadorDeDataParaFuso(fusoHorario) {
  if (!formatadoresPorFuso.has(fusoHorario)) {
    formatadoresPorFuso.set(
      fusoHorario,
      new Intl.DateTimeFormat('en-US', {
        timeZone: fusoHorario,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
      })
    )
  }

  return formatadoresPorFuso.get(fusoHorario)
}

const INDICE_DIA_DA_SEMANA = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function extrairPartesDaDataNoFuso(instante, fusoHorario) {
  const partesFormatadas = {}
  const formatador = obterFormatadorDeDataParaFuso(fusoHorario)

  for (const { type, value } of formatador.formatToParts(instante)) {
    partesFormatadas[type] = value
  }

  return {
    ano: Number(partesFormatadas.year),
    mes: Number(partesFormatadas.month),
    dia: Number(partesFormatadas.day),
    hora: Number(partesFormatadas.hour),
    minuto: Number(partesFormatadas.minute),
    segundo: Number(partesFormatadas.second),
    diaDaSemana: INDICE_DIA_DA_SEMANA[partesFormatadas.weekday],
  }
}

function calcularDeslocamentoDoFusoEmMs(instanteEmMs, fusoHorario) {
  const partesNoFuso = extrairPartesDaDataNoFuso(new Date(instanteEmMs), fusoHorario)
  const instanteInterpretadoComoUtc = Date.UTC(
    partesNoFuso.ano,
    partesNoFuso.mes - 1,
    partesNoFuso.dia,
    partesNoFuso.hora,
    partesNoFuso.minuto,
    partesNoFuso.segundo
  )
  const instanteTruncadoEmSegundos =
    Math.floor(instanteEmMs / MILISSEGUNDOS_POR_SEGUNDO) * MILISSEGUNDOS_POR_SEGUNDO

  return instanteInterpretadoComoUtc - instanteTruncadoEmSegundos
}

function obterMeiaNoiteNoFuso(ano, mes, dia, fusoHorario) {
  const meiaNoiteUtcEstimada = Date.UTC(ano, mes - 1, dia)
  const primeiraEstimativa =
    meiaNoiteUtcEstimada - calcularDeslocamentoDoFusoEmMs(meiaNoiteUtcEstimada, fusoHorario)
  const instanteAjustado =
    meiaNoiteUtcEstimada - calcularDeslocamentoDoFusoEmMs(primeiraEstimativa, fusoHorario)

  return new Date(instanteAjustado)
}

class Periodo {
  constructor({ tipo, inicio, fim }) {
    this.tipo = tipo
    this.inicio = inicio
    this.fim = fim
    Object.freeze(this)
  }

  static get TIPOS() {
    return TIPOS_PERIODO_VALIDOS
  }

  static ehTipoValido(tipoPeriodo) {
    return TIPOS_PERIODO_VALIDOS.includes(tipoPeriodo)
  }

  static de(tipoPeriodo, { agora = new Date(), fuso = FUSO_HORARIO_PADRAO } = {}) {
    if (!Periodo.ehTipoValido(tipoPeriodo)) {
      throw new PeriodoInvalidoError(tipoPeriodo)
    }

    const { ano, mes, dia, diaDaSemana } = extrairPartesDaDataNoFuso(agora, fuso)

    switch (tipoPeriodo) {
      case 'dia':
        return new Periodo({
          tipo: tipoPeriodo,
          inicio: obterMeiaNoiteNoFuso(ano, mes, dia, fuso),
          fim: obterMeiaNoiteNoFuso(ano, mes, dia + 1, fuso),
        })

      case 'semana': {
        const diaDoDomingoInicial = dia - diaDaSemana
        return new Periodo({
          tipo: tipoPeriodo,
          inicio: obterMeiaNoiteNoFuso(ano, mes, diaDoDomingoInicial, fuso),
          fim: obterMeiaNoiteNoFuso(ano, mes, diaDoDomingoInicial + DIAS_POR_SEMANA, fuso),
        })
      }

      case 'mes':
        return new Periodo({
          tipo: tipoPeriodo,
          inicio: obterMeiaNoiteNoFuso(ano, mes, 1, fuso),
          fim: obterMeiaNoiteNoFuso(ano, mes + 1, 1, fuso),
        })
    }
  }

  contem(data) {
    return data >= this.inicio && data < this.fim
  }
}

module.exports = { Periodo, FUSO_HORARIO_PADRAO }

