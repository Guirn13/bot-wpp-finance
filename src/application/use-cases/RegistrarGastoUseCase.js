const { IRegistrarGastoUseCase } = require('../ports/in/IRegistrarGastoUseCase')
const { Gasto } = require('../../domain/entities/Gasto')
const { classificarCategoria } = require('../../domain/services/ClassificadorDeCategoria')

class RegistrarGastoUseCase extends IRegistrarGastoUseCase {
  constructor(
    gastoRepository,
    usuarioRepository,
    { relogio = () => new Date() } = {}
  ) {
    super()
    this.gastoRepository = gastoRepository
    this.usuarioRepository = usuarioRepository
    this.relogio = relogio
    this.promessasDeUsuarioPorWhatsappId = new Map()
  }

  async execute({ whatsappId, nome, categoria, valor }) {
    const usuario = await this.resolverUsuario(whatsappId, nome)
    const categoriaClassificada = classificarCategoria(categoria)

    const novoGasto = Gasto.criar({
      usuarioId: usuario.id,
      categoria: categoriaClassificada,
      valor,
      data: this.relogio(),
    })

    const gastoSalvo = await this.gastoRepository.salvar(novoGasto)

    return {
      id: gastoSalvo.id,
      categoria: gastoSalvo.categoria,
      valor: gastoSalvo.valor,
      data: gastoSalvo.data,
    }
  }

  resolverUsuario(whatsappId, nome) {
    if (!this.promessasDeUsuarioPorWhatsappId.has(whatsappId)) {
      const promessaDeResolucao = this.usuarioRepository
        .obterOuCriarPorWhatsappId(whatsappId, nome)
        .catch((erro) => {
          this.promessasDeUsuarioPorWhatsappId.delete(whatsappId)
          throw erro
        })

      this.promessasDeUsuarioPorWhatsappId.set(whatsappId, promessaDeResolucao)
    }

    return this.promessasDeUsuarioPorWhatsappId.get(whatsappId)
  }
}

module.exports = { RegistrarGastoUseCase }
