import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Missing Information', () => {
  test('deve informar quando a resposta não está presente no contexto', async () => {
    const client = new OpenAI();

    const context = `
Sistema Quality Portal.

A funcionalidade de login permite autenticação com e-mail e senha.

Após cinco tentativas consecutivas com senha inválida,
a conta do usuário é bloqueada por 30 minutos.

Usuários bloqueados não podem realizar novas tentativas
até o término do período de bloqueio.
`;

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo e não invente informações. ' +
        'Quando a resposta não estiver presente no contexto, informe claramente que não há informação suficiente.',
      input: `
Contexto:
${context}

Pergunta:
Qual é o endereço de e-mail do suporte do Quality Portal?
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toLowerCase();

    const missingInformationIndicators = [
      'não há informação',
      'não há informações',
      'não informado',
      'não foi informado',
      'não consta',
      'não é possível determinar',
      'informação insuficiente',
      'informações insuficientes',
    ];

    const indicatesMissingInformation =
      missingInformationIndicators.some((indicator) =>
        answer.includes(indicator),
      );

    expect(answer).not.toBe('');
    expect(indicatesMissingInformation).toBeTruthy();
  });
});