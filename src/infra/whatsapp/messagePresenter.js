function formatarEmReais(valor) {
  return `R$${valor.toFixed(2)}`
}

const SEPARADOR = '────────────────────'

const ICONES_POR_CATEGORIA = {
  moradia: '🏠',
  alimentação: '🍽️',
  transporte: '🚗',
  saúde: '💊',
  lazer: '🎉',
  educação: '📚',
  vestuário: '👕',
  'cuidados pessoais': '💇',
  pets: '🐾',
  'contas e serviços': '📄',
}

function obterIconeDaCategoria(categoria) {
  return ICONES_POR_CATEGORIA[categoria] || '🏷️'
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
    const icone = obterIconeDaCategoria(categoria)
    return (
      `✅ *Gasto registrado!*\n` +
      `${icone} *Categoria:* ${categoria}\n` +
      `💵 *Valor:* ${formatarEmReais(valor)}`
    )
  }

  resumo(resumoDeGastos) {
    const rotuloDoPeriodo = ROTULOS_POR_PERIODO[resumoDeGastos.tipoPeriodo]

    if (!resumoDeGastos.usuarioCadastrado) {
      return (
        '📭 *Nenhum gasto registrado ainda.*\n' +
        '💡 Envie algo como `gastei 50 no mercado` para começar!'
      )
    }
    if (resumoDeGastos.quantidade === 0) {
      return `📭 *${rotuloDoPeriodo.mensagemSemGastos}*`
    }

    const linhasDeGastos =
      resumoDeGastos.tipoPeriodo === 'dia'
        ? resumoDeGastos.itens.map(
            ({ categoria, valor }) =>
              `${obterIconeDaCategoria(categoria)} *${categoria}:* ${formatarEmReais(valor)}`
          )
        : Object.entries(resumoDeGastos.porCategoria).map(
            ([categoria, valor]) =>
              `${obterIconeDaCategoria(categoria)} *${categoria}:* ${formatarEmReais(valor)}`
          )

    return (
      `📊 *Resumo dos gastos ${rotuloDoPeriodo.titulo}*\n` +
      `${SEPARADOR}\n` +
      `${linhasDeGastos.join('\n')}\n` +
      `${SEPARADOR}\n` +
      `🧾 *Lançamentos:* ${resumoDeGastos.quantidade}\n` +
      `💰 *Total:* *${formatarEmReais(resumoDeGastos.total)}*`
    )
  }

  formatoInvalido() {
    return (
      '⚠️ *Não consegui entender esse gasto.*\n\n' +
      'Informe o *valor* e *onde gastou*. Exemplos:\n' +
      '• `gastei 200 em casa`\n' +
      '• `paguei 50 no mercado`\n' +
      '• `uber 35`\n\n' +
      '💡 Digite *!menu* para ver todas as opções.'
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
      `🤖 *Menu do Assistente Financeiro*\n` +
      `${SEPARADOR}\n\n` +
      `✍️ *COMO REGISTRAR UM GASTO*\n` +
      `Escreva naturalmente quanto e onde gastou:\n` +
      `• \`gastei 200 em casa\` → 🏠 *moradia*\n` +
      `• \`paguei 50,50 no mercado\` → 🍽️ *alimentação*\n` +
      `• \`uber 35\` → 🚗 *transporte*\n` +
      `• \`comprei remédio por 42,90\` → 💊 *saúde*\n\n` +
      `📊 *RELATÓRIOS E RESUMOS*\n` +
      `• *!dia* — Gastos detalhados de hoje\n` +
      `• *!semana* — Resumo da semana por categoria\n` +
      `• *!mes* — Resumo do mês por categoria\n\n` +
      `🏷️ *CATEGORIAS AUTOMÁTICAS*\n` +
      `🏠 Moradia • 🍽️ Alimentação • 🚗 Transporte\n` +
      `💊 Saúde • 🎉 Lazer • 📚 Educação\n` +
      `👕 Vestuário • 💇 Cuidados • 🐾 Pets • 📄 Contas\n\n` +
      `⚙️ *AJUDA*\n` +
      `• *!menu* ou *!ajuda* — Exibe este menu`
    )
  }
}

module.exports = { WhatsappMessagePresenter, obterIconeDaCategoria }
