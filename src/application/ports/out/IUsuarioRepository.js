class IUsuarioRepository {
  async obterOuCriarPorWhatsappId(whatsappId, nome) {
    throw new Error('IUsuarioRepository.obterOuCriarPorWhatsappId não implementado')
  }

  async buscarPorWhatsappId(whatsappId) {
    throw new Error('IUsuarioRepository.buscarPorWhatsappId não implementado')
  }

  async buscarPorId(id) {
    throw new Error('IUsuarioRepository.buscarPorId não implementado')
  }
}

module.exports = { IUsuarioRepository }

