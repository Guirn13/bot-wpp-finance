const { IGastoRepository } = require('../../application/ports/out/IGastoRepository')
const { traduzirErroSupabase } = require('./supabaseErrors')
const { Gasto } = require('../../domain/entities/Gasto')

const TABELA_GASTOS = 'gastos'
const COLUNAS_SELECIONADAS = 'id, usuario_id, categoria, valor, data'

function mapearRegistroParaEntidade(registro) {
  return new Gasto({
    id: registro.id,
    usuarioId: registro.usuario_id,
    categoria: registro.categoria,
    valor: Number(registro.valor),
    data: new Date(registro.data),
  })
}

function mapearEntidadeParaRegistro(gasto) {
  return {
    usuario_id: gasto.usuarioId,
    categoria: gasto.categoria,
    valor: gasto.valor,
    data: gasto.data.toISOString(),
  }
}

class SupabaseGastoRepository extends IGastoRepository {
  constructor(supabaseClient) {
    super()
    this.supabaseClient = supabaseClient
  }

  async salvar(gasto) {
    const { data, error } = await this.supabaseClient
      .from(TABELA_GASTOS)
      .insert(mapearEntidadeParaRegistro(gasto))
      .select(COLUNAS_SELECIONADAS)
      .single()

    if (error) throw traduzirErroSupabase('salvar gasto', error)
    return mapearRegistroParaEntidade(data)
  }

  async buscarPorPeriodo(usuarioId, dataInicio, dataFim) {
    const { data, error } = await this.supabaseClient
      .from(TABELA_GASTOS)
      .select(COLUNAS_SELECIONADAS)
      .eq('usuario_id', usuarioId)
      .gte('data', dataInicio.toISOString())
      .lt('data', dataFim.toISOString())
      .order('data', { ascending: true })

    if (error) throw traduzirErroSupabase('buscar gastos por período', error)
    return data.map(mapearRegistroParaEntidade)
  }
}

module.exports = { SupabaseGastoRepository }

