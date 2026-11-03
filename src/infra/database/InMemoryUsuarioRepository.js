const { randomUUID } = require('node:crypto')
const { IUsuarioRepository } = require('../../application/ports/out/IUsuarioRepository')
const { Usuario } = require('../../domain/entities/Usuario')

class InMemoryUsuarioRepository extends IUsuarioRepository {
  constructor() {
    super()
    this.usuarios = new Map()
  }

  async obterOuCriarPorWhatsappId(whatsappId, nome) {
    const usuarioExistente = await this.buscarPorWhatsappId(whatsappId)
    if (usuarioExistente) return usuarioExistente

    const novoUsuario = new Usuario({ id: randomUUID(), whatsappId, nome })
    this.usuarios.set(novoUsuario.id, novoUsuario)
    return novoUsuario
  }

  async buscarPorWhatsappId(whatsappId) {
    for (const usuario of this.usuarios.values()) {
      if (usuario.whatsappId === whatsappId) return usuario
    }
    return null
  }

  async buscarPorId(id) {
    return this.usuarios.get(id) || null
  }
}

module.exports = { InMemoryUsuarioRepository }

