import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Multiple Source Attribution', () => {
  test('deve responder usando múltiplas fontes relevantes', async () => {
    const client = new OpenAI();

    const context = `
[FONTE_A]
O suporte ao usuário funciona de segunda a sexta-feira,
das 09h às 18h.

[FONTE_B]
Chamados relacionados a acesso e autenticação
são tratados pela equipe de suporte técnico.

[FONTE_C]
O prazo médio inicial de resposta do suporte
é de até 4 horas úteis.
`;

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo e não invente informações. ' +
        'Quando a resposta depender de mais de uma fonte, cite todas as fontes relevantes. ' +
        'Use exatamente o formato: RESPOSTA: <resposta> | FONTES: <identificadores separados por vírgula>.',
      input: `
Contexto:
${context}

Pergunta:
Qual é o horário de funcionamento do suporte e qual é o prazo médio inicial de resposta?
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toUpperCase();

    expect(answer).toContain('09H');
    expect(answer).toContain('18H');
    expect(answer).toContain('4 HORAS');

    expect(answer).toContain('FONTE_A');
    expect(answer).toContain('FONTE_C');

    expect(answer).not.toContain('FONTE_B');
  });
});