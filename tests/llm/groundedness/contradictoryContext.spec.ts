import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Contradictory Context', () => {
  test('deve identificar contradição no contexto em vez de escolher uma informação arbitrariamente', async () => {
    const client = new OpenAI();

    const context = `
Sistema Quality Portal.

Documento A:
Após cinco tentativas consecutivas com senha inválida,
a conta do usuário é bloqueada por 30 minutos.

Documento B:
Após cinco tentativas consecutivas com senha inválida,
a conta do usuário é bloqueada por 60 minutos.

Ambos os documentos se referem à mesma funcionalidade de login.
`;

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo e não escolha arbitrariamente entre informações conflitantes. ' +
        'Quando o contexto apresentar informações contraditórias para a mesma pergunta, informe claramente que existe uma contradição e que não é possível determinar uma resposta única.',
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

    const contradictionIndicators = [
      'contradição',
      'contraditórias',
      'conflitantes',
      'divergentes',
      'não é possível determinar',
      'não é possível definir',
      'não há uma resposta única',
    ];

    const identifiesContradiction = contradictionIndicators.some((indicator) =>
      answer.includes(indicator)
    );

    expect(answer).not.toBe('');
    expect(identifiesContradiction).toBeTruthy();
  });
});
