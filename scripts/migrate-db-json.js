const fs = require('node:fs')
const path = require('node:path')

const { carregarEnv } = require('../src/config/env')
const { criarSupabaseClient } = require('../src/infra/database/supabaseClient')
const { SupabaseUsuarioRepository } = require('../src/infra/database/SupabaseUsuarioRepository')
const { traduzirErroSupabase } = require('../src/infra/database/supabaseErrors')
const { Gasto } = require('../src/domain/entities/Gasto')

const TAMANHO_DO_LOTE_DE_INSERCAO = 500

function lerUsuariosDoBancoLegado(caminhoDoArquivo) {
  const conteudoJson = JSON.parse(fs.readFileSync(caminhoDoArquivo, 'utf8'))
  return Object.entries(conteudoJson.usuarios || {})
}

function separarGastosValidosEInvalidos(usuarioId, gastosLegados) {
  const gastosValidos = []
  const gastosInvalidos = []

  for (const gastoLegado of gastosLegados || []) {
    try {
      gastosValidos.push(
        Gasto.criar({
          usuarioId,
          categoria: gastoLegado.categoria,
          valor: Number(gastoLegado.valor),
          data: new Date(gastoLegado.data),
        })
      )
    } catch (erro) {
      gastosInvalidos.push({ gastoLegado, motivo: erro.message })
    }
  }

  return { gastosValidos, gastosInvalidos }
}

async function inserirGastosEmLotes(supabaseClient, gastos) {
  for (
    let indiceInicial = 0;
    indiceInicial < gastos.length;
    indiceInicial += TAMANHO_DO_LOTE_DE_INSERCAO
  ) {
    const loteDeRegistros = gastos
      .slice(indiceInicial, indiceInicial + TAMANHO_DO_LOTE_DE_INSERCAO)
      .map((gasto) => ({
        usuario_id: gasto.usuarioId,
        categoria: gasto.categoria,
        valor: gasto.valor,
        data: gasto.data.toISOString(),
      }))

    const { error } = await supabaseClient.from('gastos').insert(loteDeRegistros)
    if (error) {
      throw traduzirErroSupabase('inserir lote de gastos', error)
    }
  }
}

async function executarMigracao() {
  const argumentos = process.argv.slice(2)
  const modoSimulacao = argumentos.includes('--dry-run')
  const caminhoInformado = argumentos.find(
    (argumento) => !argumento.startsWith('--')
  )
  const caminhoDoBancoLegado = path.resolve(caminhoInformado || 'db.json')

  const usuariosLegados = lerUsuariosDoBancoLegado(caminhoDoBancoLegado)
  const sufixoModoSimulacao = modoSimulacao ? ' (dry-run)' : ''
  console.info(
    `📂 ${caminhoDoBancoLegado}: ${usuariosLegados.length} usuário(s) encontrado(s)${sufixoModoSimulacao}`
  )

  let supabaseClient = null
  let usuarioRepository = null
  if (!modoSimulacao) {
    const configuracao = carregarEnv()
    supabaseClient = criarSupabaseClient({
      url: configuracao.SUPABASE_URL,
      key: configuracao.SUPABASE_KEY,
    })
    usuarioRepository = new SupabaseUsuarioRepository(supabaseClient)
  }

  let totalDeGastosMigrados = 0
  let totalDeGastosIgnorados = 0

  for (const [whatsappId, dadosDoUsuario] of usuariosLegados) {
    const usuario = modoSimulacao
      ? { id: 'dry-run' }
      : await usuarioRepository.obterOuCriarPorWhatsappId(
          whatsappId,
          dadosDoUsuario.nome
        )

    const { gastosValidos, gastosInvalidos } = separarGastosValidosEInvalidos(
      usuario.id,
      dadosDoUsuario.gastos
    )

    for (const { gastoLegado, motivo } of gastosInvalidos) {
      console.warn(`  ⚠️ ${whatsappId}: gasto ignorado (${motivo}):`, gastoLegado)
    }

    if (!modoSimulacao) {
      await inserirGastosEmLotes(supabaseClient, gastosValidos)
    }

    const nomeExibido = dadosDoUsuario.nome || 'Desconhecido'
    console.info(
      `  ✅ ${whatsappId} (${nomeExibido}): ${gastosValidos.length} gasto(s)`
    )
    totalDeGastosMigrados += gastosValidos.length
    totalDeGastosIgnorados += gastosInvalidos.length
  }

  console.info(
    `\n🏁 Concluído: ${totalDeGastosMigrados} gasto(s) migrado(s), ${totalDeGastosIgnorados} ignorado(s).`
  )
}

executarMigracao().catch((erro) => {
  console.error(`❌ Falha na migração: ${erro.message}`)
  process.exit(1)
})
