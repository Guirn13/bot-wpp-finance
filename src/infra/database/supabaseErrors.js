const { RepositorioIndisponivelError } = require('../../application/errors/RepositorioIndisponivelError')

function traduzirErroSupabase(descricaoDaOperacao, erroDoSupabase) {
  return new RepositorioIndisponivelError(
    `Falha ao ${descricaoDaOperacao} no Supabase: ${erroDoSupabase.message}`,
    { cause: erroDoSupabase }
  )
}

module.exports = { traduzirErroSupabase }

