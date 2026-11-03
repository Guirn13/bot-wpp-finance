const { randomUUID } = require('node:crypto')
const { IGastoRepository } = require('../../application/ports/out/IGastoRepository')

class InMemoryGastoRepository extends IGastoRepository {
  constructor() {
    super()
    this.gastos = []
  }

  async salvar(gasto) {
    const gastoSalvo = gasto.comId(gasto.id || randomUUID())
    this.gastos.push(gastoSalvo)
    return gastoSalvo
  }

  async buscarPorPeriodo(usuarioId, dataInicio, dataFim) {
    return this.gastos
      .filter(
        (gasto) =>
          gasto.usuarioId === usuarioId &&
          gasto.data >= dataInicio &&
          gasto.data < dataFim
      )
      .sort((primeiro, segundo) => primeiro.data - segundo.data)
  }
}

module.exports = { InMemoryGastoRepository }

