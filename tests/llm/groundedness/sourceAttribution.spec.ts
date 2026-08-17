import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Source Attribution', () => {
  test('deve responder com base no contexto e indicar a fonte correta', async () => {
    const client = new OpenAI();

    const context = `
[FONTE_A]
O suporte ao usuário funciona de segunda a sexta-feira,
das 09h às 18h.

[FONTE_B]
Após cinco tentativas consecutivas com senha inválida,
a conta do usuário é bloqueada por 30 minutos.

[FONTE_C]
O prazo médio inicial de resposta do suporte
é de até 4 horas úteis.
`;

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo e não invente informações. ' +
        'Informe a resposta e, em seguida, indique somente a fonte que sustenta essa resposta. ' +
        'Use exatamente o formato: RESPOSTA: <resposta> | FONTE: <identificador>.',
      input: `
Contexto:
${context}

Pergunta:
Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toUpperCase();

    expect(answer).toContain('30 MINUTOS');
    expect(answer).toContain('FONTE_B');

    expect(answer).not.toContain('FONTE_A');
    expect(answer).not.toContain('FONTE_C');
  });
});