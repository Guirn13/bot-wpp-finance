const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

function normalizarMensagemDoWhatsapp(mensagemRecebida) {
  return {
    texto: mensagemRecebida.body,
    remetenteId: mensagemRecebida.from,
    nomeRemetente:
      mensagemRecebida._data?.notifyName || mensagemRecebida._data?.pushname,
  }
}

function iniciarWhatsappBot({ onMessage, logger = console }) {
  const client = new Client({
    authStrategy: new LocalAuth(),
  })

  client.on('qr', (qrCode) => {
    qrcode.generate(qrCode, { small: true })
  })

  client.once('ready', () => {
    logger.info('Bot ativo!')
  })

  client.on('message_create', async (mensagemRecebida) => {
    try {
      const mensagemNormalizada = normalizarMensagemDoWhatsapp(mensagemRecebida)
      const textoDeResposta = await onMessage(mensagemNormalizada)
      if (textoDeResposta) {
        await mensagemRecebida.reply(textoDeResposta)
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

