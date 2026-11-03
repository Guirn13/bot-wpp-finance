class IGastoRepository {
  async salvar(gasto) {
    throw new Error('IGastoRepository.salvar não implementado')
  }

  async buscarPorPeriodo(usuarioId, dataInicio, dataFim) {
    throw new Error('IGastoRepository.buscarPorPeriodo não implementado')
  }
}

module.exports = { IGastoRepository }

