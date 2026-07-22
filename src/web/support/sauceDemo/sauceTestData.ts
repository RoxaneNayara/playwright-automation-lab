export const sauceUsuarios = {
  usuarioPadrao: {
    usuario: 'standard_user',
    senha: 'secret_sauce',
  },

  usuarioBloqueado: {
    usuario: 'locked_out_user',
    senha: 'secret_sauce',
  },

  credencialInvalida: {
    usuario: 'usuario_invalido',
    senha: 'senha_invalida',
  },
} as const;

export const sauceProdutos = {
  mochila: {
    nome: 'Sauce Labs Backpack',
    preco: '$29.99',
  },

  luzDeBicicleta: {
    nome: 'Sauce Labs Bike Light',
    preco: '$9.99',
  },
} as const;

export const sauceCheckout = {
  clientePadrao: {
    nome: 'Roxy',
    sobrenome: 'QA',
    cep: '01001-000',
  },
} as const;

export function converterPrecoParaNumero(preco: string): number {
  const valorConvertido = Number(preco.replace('$', '').trim());

  if (Number.isNaN(valorConvertido)) {
    throw new Error(`Preço inválido: ${preco}`);
  }

  return valorConvertido;
}

export function extrairValorMonetario(texto: string): number {
  const valorEncontrado = texto.match(/\$(\d+\.\d{2})/);

  if (!valorEncontrado) {
    throw new Error(`Valor monetário não encontrado no texto: ${texto}`);
  }

  return Number(valorEncontrado[1]);
}
