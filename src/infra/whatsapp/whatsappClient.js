const fs = require('fs')
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

function normalizarMensagemDoWhatsapp(mensagemRecebida) {
  const remetenteId = mensagemRecebida.fromMe
    ? (mensagemRecebida.to || mensagemRecebida.from)
    : mensagemRecebida.from

  return {
    texto: mensagemRecebida.body,
    remetenteId,
    nomeRemetente:
      mensagemRecebida._data?.notifyName ||
      mensagemRecebida._data?.pushname ||
      'Eu',
  }
}

function obterCaminhoDoChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  const caminhosPossiveis = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : null,
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean)

  for (const caminho of caminhosPossiveis) {
    if (fs.existsSync(caminho)) {
      return caminho
    }
  }
  return undefined
}

function iniciarWhatsappBot({ onMessage, logger = console }) {
  const chromePath = obterCaminhoDoChrome()

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  })

  logger.info('⏳ Iniciando WhatsApp Web... Aguarde.')

  client.on('qr', (qrCode) => {
    logger.info('📱 Escaneie o QR Code abaixo com o WhatsApp do seu celular:')
    qrcode.generate(qrCode, { small: true })
  })

  client.on('authenticated', () => {
    logger.info('🔓 Autenticado com sucesso! Carregando conversas...')
  })

  client.on('loading_screen', (percent, message) => {
    logger.info(`⏳ Sincronizando WhatsApp: ${percent}% ${message ? `(${message})` : ''}`)
  })

  client.on('auth_failure', (msg) => {
    logger.error('❌ Falha na autenticação:', msg)
  })

  client.once('ready', () => {
    logger.info('🚀 Bot ativo e pronto para receber mensagens!')
  })

  client.on('message_create', async (mensagemRecebida) => {
    try {
      const mensagemNormalizada = normalizarMensagemDoWhatsapp(mensagemRecebida)
      const textoDeResposta = await onMessage(mensagemNormalizada)
      if (textoDeResposta) {
        const destino = mensagemRecebida.fromMe
          ? (mensagemRecebida.to || mensagemRecebida.from)
          : mensagemRecebida.from

        if (destino) {
          await client.sendMessage(destino, textoDeResposta)
        }
      }
    } catch (erro) {
      logger.error('[whatsapp] falha ao processar mensagem:', erro)
    }
  })

  client.initialize()
  return client
}

module.exports = {
  iniciarWhatsappBot,
  normalizarMensagem: normalizarMensagemDoWhatsapp,
}
