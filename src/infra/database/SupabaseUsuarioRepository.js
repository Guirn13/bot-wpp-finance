const { IUsuarioRepository } = require('../../application/ports/out/IUsuarioRepository')
const { traduzirErroSupabase } = require('./supabaseErrors')
const { Usuario, NOME_USUARIO_PADRAO } = require('../../domain/entities/Usuario')

const TABELA_USUARIOS = 'usuarios'
const COLUNAS_SELECIONADAS = 'id, whatsapp_id, nome'
const CODIGO_VIOLACAO_UNICIDADE_POSTGRES = '23505'

function mapearRegistroParaEntidade(registro) {
  return new Usuario({
    id: registro.id,
    whatsappId: registro.whatsapp_id,
    nome: registro.nome,
  })
}

class SupabaseUsuarioRepository extends IUsuarioRepository {
  constructor(supabaseClient) {
    super()
    this.supabaseClient = supabaseClient
  }

  async obterOuCriarPorWhatsappId(whatsappId, nome) {
    const usuarioExistente = await this.buscarPorWhatsappId(whatsappId)
    if (usuarioExistente) return usuarioExistente

    const nomeNormalizado = (nome || '').trim() || NOME_USUARIO_PADRAO
    const { data, error } = await this.supabaseClient
      .from(TABELA_USUARIOS)
      .insert({ whatsapp_id: whatsappId, nome: nomeNormalizado })
      .select(COLUNAS_SELECIONADAS)
      .single()

    if (error?.code === CODIGO_VIOLACAO_UNICIDADE_POSTGRES) {
      const usuarioCriadoConcorrentemente = await this.buscarPorWhatsappId(whatsappId)
      if (usuarioCriadoConcorrentemente) return usuarioCriadoConcorrentemente
    }

    if (error) throw traduzirErroSupabase('criar usuário', error)
    return mapearRegistroParaEntidade(data)
  }

  async buscarPorWhatsappId(whatsappId) {
    return this.buscarUnicoPorColuna('whatsapp_id', whatsappId)
  }

  async buscarPorId(id) {
    return this.buscarUnicoPorColuna('id', id)
  }

  async buscarUnicoPorColuna(nomeDaColuna, valorProcurado) {
    const { data, error } = await this.supabaseClient
      .from(TABELA_USUARIOS)
      .select(COLUNAS_SELECIONADAS)
      .eq(nomeDaColuna, valorProcurado)
      .maybeSingle()

    if (error) throw traduzirErroSupabase('buscar usuário', error)
    return data ? mapearRegistroParaEntidade(data) : null
  }
}

module.exports = { SupabaseUsuarioRepository }

