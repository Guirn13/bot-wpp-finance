const { FUSO_HORARIO_PADRAO } = require('../domain/value-objects/Periodo')

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

function obterChaveSecretaDoSupabase(variaveisDeAmbiente) {
  return (
    variaveisDeAmbiente.SUPABASE_SECRET_KEY?.trim() ||
    variaveisDeAmbiente.SUPABASE_KEY?.trim() ||
    ''
  )
}

function carregarEnv(variaveisDeAmbiente) {
  if (!variaveisDeAmbiente) {
    require('dotenv').config({ quiet: true })
    variaveisDeAmbiente = process.env
  }

  const supabaseUrl = variaveisDeAmbiente.SUPABASE_URL?.trim() || ''
  const supabaseKey = obterChaveSecretaDoSupabase(variaveisDeAmbiente)

  const variaveisAusentes = []
  if (!supabaseUrl) variaveisAusentes.push('SUPABASE_URL')
  if (!supabaseKey) variaveisAusentes.push('SUPABASE_SECRET_KEY')

  if (variaveisAusentes.length > 0) {
    throw new ConfiguracaoInvalidaError(
      `Variáveis de ambiente ausentes: ${variaveisAusentes.join(', ')}. ` +
        'Copie o arquivo .env.example para .env e preencha os valores.'
    )
  }

  const configuracao = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_KEY: supabaseKey,
    TIMEZONE: variaveisDeAmbiente.TIMEZONE?.trim() || FUSO_HORARIO_PADRAO,
  }

  validarUrlDoSupabase(configuracao.SUPABASE_URL)
  validarFusoHorario(configuracao.TIMEZONE)

  return Object.freeze(configuracao)
}

module.exports = { carregarEnv, ConfiguracaoInvalidaError }
