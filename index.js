const { carregarEnv } = require('./src/config/env')
const { criarSupabaseClient } = require('./src/infra/database/supabaseClient')
const { SupabaseGastoRepository } = require('./src/infra/database/SupabaseGastoRepository')
const { SupabaseUsuarioRepository } = require('./src/infra/database/SupabaseUsuarioRepository')
const { RegistrarGastoUseCase } = require('./src/application/use-cases/RegistrarGastoUseCase')
const { ObterResumoGastosUseCase } = require('./src/application/use-cases/ObterResumoGastosUseCase')
const { WhatsappMessagePresenter } = require('./src/infra/whatsapp/messagePresenter')
const { CommandRouter } = require('./src/infra/whatsapp/commandRouter')
const { iniciarWhatsappBot } = require('./src/infra/whatsapp/whatsappClient')

function iniciarAplicacao() {
  const configuracao = carregarEnv()

  const supabaseClient = criarSupabaseClient({
    url: configuracao.SUPABASE_URL,
    key: configuracao.SUPABASE_KEY,
  })
  const gastoRepository = new SupabaseGastoRepository(supabaseClient)
  const usuarioRepository = new SupabaseUsuarioRepository(supabaseClient)

  const registrarGastoUseCase = new RegistrarGastoUseCase(
    gastoRepository,
    usuarioRepository
  )
  const obterResumoUseCase = new ObterResumoGastosUseCase(
    gastoRepository,
    usuarioRepository,
    { fuso: configuracao.TIMEZONE }
  )

  const commandRouter = new CommandRouter({
    registrarGastoUseCase,
    obterResumoUseCase,
    presenter: new WhatsappMessagePresenter(),
  })

  iniciarWhatsappBot({
    onMessage: (mensagem) => commandRouter.handle(mensagem),
  })
}

try {
  iniciarAplicacao()
} catch (erro) {
  console.error(`❌ Falha ao iniciar o bot: ${erro.message}`)
  process.exit(1)
}

