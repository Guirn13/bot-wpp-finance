function formatarEmReais(valor) {
  return `R$${valor.toFixed(2)}`
}

const ROTULOS_POR_PERIODO = {
  dia: {
    titulo: 'de hoje',
    mensagemSemGastos: 'Nenhum gasto registrado hoje.',
  },
  semana: {
    titulo: 'nesta semana',
    mensagemSemGastos: 'Nenhum gasto nesta semana.',
  },
  mes: {
    titulo: 'deste mês',
    mensagemSemGastos: 'Nenhum gasto neste mês.',
  },
}

class WhatsappMessagePresenter {
  gastoRegistrado({ categoria, valor }) {
    return `✅ Gasto registrado: *${categoria}* - ${formatarEmReais(valor)}`
  }

  resumo(resumoDeGastos) {
    const rotuloDoPeriodo = ROTULOS_POR_PERIODO[resumoDeGastos.tipoPeriodo]

    if (!resumoDeGastos.usuarioCadastrado) {
      return '📭 Nenhum gasto registrado ainda.'
    }
    if (resumoDeGastos.quantidade === 0) {
      return `📭 ${rotuloDoPeriodo.mensagemSemGastos}`
    }

    const linhasDeGastos =
      resumoDeGastos.tipoPeriodo === 'dia'
        ? resumoDeGastos.itens.map(
            ({ categoria, valor }) => `- ${categoria}: ${formatarEmReais(valor)}`
          )
        : Object.entries(resumoDeGastos.porCategoria).map(
            ([categoria, valor]) => `- ${categoria}: ${formatarEmReais(valor)}`
          )

    return (
      `📅 *Resumo dos gastos ${rotuloDoPeriodo.titulo}*\n\n` +
      `${linhasDeGastos.join('\n')}\n` +
      `\n💰 *Total:* ${formatarEmReais(resumoDeGastos.total)}`
    )
  }

  formatoInvalido() {
    return '⚠️ Formato inválido. Use: gasto: categoria valor\nEx: gasto: mercado 120.50'
  }

  erroDeValidacao(mensagem) {
    return `⚠️ ${mensagem}`
  }

  servicoIndisponivel() {
    return '🔌 Não consegui acessar o banco de dados agora. Tente novamente em alguns instantes.'
  }

  erroInesperado() {
    return '❌ Ocorreu um erro inesperado. Tente novamente mais tarde.'
  }

  ajuda() {
    return (
      `💡 *Comandos disponíveis:*\n\n` +
      `🔹 *gasto: categoria valor* - Registra um gasto.\n Exemplo: \`gasto: alimentação 50\`\n` +
      `🔹 *!dia* - Mostra o resumo dos gastos do dia 📅\n` +
      `🔹 *!semana* - Mostra o resumo dos gastos da semana 📅\n` +
      `🔹 *!mes* - Mostra o resumo dos gastos do mês 📅\n` +
      `🔹 *!ajuda* - Exibe esta mensagem de ajuda ⚙️\n\n` +
      `❓ Caso tenha alguma dúvida, não hesite em perguntar!`
    )
  }
}

module.exports = { WhatsappMessagePresenter }

