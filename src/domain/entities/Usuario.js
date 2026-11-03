const NOME_USUARIO_PADRAO = 'Desconhecido'

class Usuario {
  constructor({ id, whatsappId, nome }) {
    if (!id) throw new Error('Usuario requer um id.')
    if (!whatsappId) throw new Error('Usuario requer um whatsappId.')

    this.id = id
    this.whatsappId = whatsappId
    this.nome = (nome || '').trim() || NOME_USUARIO_PADRAO
    Object.freeze(this)
  }
}

module.exports = { Usuario, NOME_USUARIO_PADRAO }

