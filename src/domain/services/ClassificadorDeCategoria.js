const REGRAS_DE_CATEGORIA = [
  {
    categoria: 'moradia',
    palavrasChave: [
      'casa',
      'moradia',
      'aluguel',
      'condominio',
      'luz',
      'energia',
      'agua',
      'gas',
      'internet',
      'iptu',
      'reforma',
      'moveis',
      'eletrodomestico',
      'eletrodomesticos',
      'manutencao',
      'faxina',
      'diarista',
    ],
  },
  {
    categoria: 'alimentação',
    palavrasChave: [
      'alimentacao',
      'mercado',
      'supermercado',
      'feira',
      'padaria',
      'acougue',
      'hortifruti',
      'restaurante',
      'lanche',
      'comida',
      'ifood',
      'delivery',
      'almoco',
      'jantar',
      'cafe',
      'pizza',
      'hamburguer',
      'marmita',
      'bar',
      'sorvete',
      'doce',
      'bebida',
    ],
  },
  {
    categoria: 'transporte',
    palavrasChave: [
      'transporte',
      'uber',
      '99',
      'taxi',
      'onibus',
      'metro',
      'passagem',
      'gasolina',
      'combustivel',
      'etanol',
      'alcool',
      'estacionamento',
      'pedagio',
      'ipva',
      'oficina',
      'mecanico',
      'carro',
      'moto',
    ],
  },
  {
    categoria: 'saúde',
    palavrasChave: [
      'saude',
      'farmacia',
      'remedio',
      'remedios',
      'medicamento',
      'medicamentos',
      'medico',
      'consulta',
      'exame',
      'exames',
      'dentista',
      'hospital',
      'plano de saude',
      'psicologo',
      'terapia',
      'academia',
      'suplemento',
    ],
  },
  {
    categoria: 'lazer',
    palavrasChave: [
      'lazer',
      'cinema',
      'filme',
      'ingresso',
      'show',
      'festa',
      'viagem',
      'hotel',
      'passeio',
      'jogos',
      'jogo',
      'game',
      'streaming',
      'netflix',
      'spotify',
      'prime',
      'assinatura',
      'hobby',
    ],
  },
  {
    categoria: 'educação',
    palavrasChave: [
      'educacao',
      'curso',
      'faculdade',
      'escola',
      'livro',
      'livros',
      'material escolar',
      'mensalidade',
      'apostila',
      'aula',
      'idioma',
      'ingles',
    ],
  },
  {
    categoria: 'vestuário',
    palavrasChave: [
      'vestuario',
      'roupa',
      'roupas',
      'calcado',
      'calcados',
      'tenis',
      'sapato',
      'camisa',
      'camiseta',
      'calca',
      'vestido',
      'jaqueta',
      'shopping',
    ],
  },
  {
    categoria: 'cuidados pessoais',
    palavrasChave: [
      'cuidados pessoais',
      'beleza',
      'cabelo',
      'barbearia',
      'salao',
      'manicure',
      'estetica',
      'perfume',
      'cosmetico',
      'higiene',
    ],
  },
  {
    categoria: 'pets',
    palavrasChave: [
      'pet',
      'pets',
      'racao',
      'veterinario',
      'banho e tosa',
      'cachorro',
      'gato',
      'petshop',
      'pet shop',
    ],
  },
  {
    categoria: 'contas e serviços',
    palavrasChave: [
      'conta',
      'contas',
      'celular',
      'telefone',
      'tim',
      'vivo',
      'claro',
      'taxa',
      'imposto',
      'tarifa',
      'banco',
      'cartao',
      'seguro',
    ],
  },
]

function normalizarParaComparacao(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function classificarCategoria(descricao) {
  if (typeof descricao !== 'string') {
    return descricao
  }

  const descricaoLimpa = descricao.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!descricaoLimpa) {
    return descricaoLimpa
  }

  const textoComparavel = ` ${normalizarParaComparacao(descricaoLimpa)} `

  for (const regra of REGRAS_DE_CATEGORIA) {
    const encontrouPalavraChave = regra.palavrasChave.some((palavraChave) =>
      textoComparavel.includes(` ${palavraChave} `)
    )

    if (encontrouPalavraChave) {
      return regra.categoria
    }
  }

  return descricaoLimpa
}

module.exports = {
  classificarCategoria,
  REGRAS_DE_CATEGORIA,
}

