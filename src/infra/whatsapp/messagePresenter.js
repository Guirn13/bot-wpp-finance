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
    return (
      '⚠️ Formato inválido. Informe o valor e onde gastou.\n' +
      'Ex: `gastei 200 em casa`, `paguei 50 no mercado` ou `uber 35`'
    )
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
      `💡 *Como usar o bot:*\n\n` +
      `🔹 *Registrar gasto:* envie mensagens naturais ou o comando tradicional.\n` +
      ` Exemplos:\n` +
      ` • \`gastei 200 em casa\`\n` +
      ` • \`paguei 120,50 no mercado\`\n` +
      ` • \`uber 35\`\n` +
      ` • \`gasto: alimentação 50\`\n\n` +
      `🔹 *!dia* - Mostra o resumo dos gastos do dia 📅\n` +
      `🔹 *!semana* - Mostra o resumo dos gastos da semana 📅\n` +
      `🔹 *!mes* - Mostra o resumo dos gastos do mês 📅\n` +
      `🔹 *!ajuda* - Exibe esta mensagem de ajuda ⚙️\n\n` +
      `❓ Caso tenha alguma dúvida, não hesite em perguntar!`
    )
  }
}

module.exports = { WhatsappMessagePresenter }
