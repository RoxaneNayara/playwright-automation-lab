import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Grounded Answer', () => {
  test('deve responder somente com informações presentes no contexto', async () => {
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
        'Se a resposta estiver presente no contexto, responda objetivamente em português.',
      input: `
Contexto:
${context}

Pergunta:
Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toLowerCase();

    expect(answer).not.toBe('');
    expect(answer).toContain('30 minutos');
  });
});