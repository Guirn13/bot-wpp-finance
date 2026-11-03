const { FUSO_HORARIO_PADRAO } = require('../domain/value-objects/Periodo')

const VARIAVEIS_OBRIGATORIAS = ['SUPABASE_URL', 'SUPABASE_KEY']

class ConfiguracaoInvalidaError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfiguracaoInvalidaError'
  }
}

function validarUrlDoSupabase(url) {
  try {
    const { protocol } = new URL(url)
    if (protocol !== 'https:' && protocol !== 'http:') {
      throw new Error()
    }
  } catch {
    throw new ConfiguracaoInvalidaError(`SUPABASE_URL inválida: "${url}"`)
  }
}

function validarFusoHorario(fusoHorario) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: fusoHorario })
  } catch {
    throw new ConfiguracaoInvalidaError(`TIMEZONE inválido: "${fusoHorario}"`)
  }
}

function carregarEnv(variaveisDeAmbiente) {
  if (!variaveisDeAmbiente) {
    require('dotenv').config({ quiet: true })
    variaveisDeAmbiente = process.env
  }

  const variaveisAusentes = VARIAVEIS_OBRIGATORIAS.filter(
    (nomeDaVariavel) => !variaveisDeAmbiente[nomeDaVariavel]?.trim()
  )

  if (variaveisAusentes.length > 0) {
    throw new ConfiguracaoInvalidaError(
      `Variáveis de ambiente ausentes: ${variaveisAusentes.join(', ')}. ` +
        'Copie o arquivo .env.example para .env e preencha os valores.'
    )
  }

  const configuracao = {
    SUPABASE_URL: variaveisDeAmbiente.SUPABASE_URL.trim(),
    SUPABASE_KEY: variaveisDeAmbiente.SUPABASE_KEY.trim(),
    TIMEZONE: variaveisDeAmbiente.TIMEZONE?.trim() || FUSO_HORARIO_PADRAO,
  }

  validarUrlDoSupabase(configuracao.SUPABASE_URL)
  validarFusoHorario(configuracao.TIMEZONE)

  return Object.freeze(configuracao)
}

module.exports = { carregarEnv, ConfiguracaoInvalidaError }

