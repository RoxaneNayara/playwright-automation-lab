import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Related But Insufficient Context', () => {
  test('deve evitar inferir informação não presente mesmo quando o contexto é relacionado', async () => {
    const client = new OpenAI();

    const context = `
Sistema Quality Portal.

O suporte ao usuário funciona de segunda a sexta-feira,
das 09h às 18h.

Chamados relacionados a acesso e autenticação são tratados
pela equipe de suporte técnico.

O prazo médio inicial de resposta é de até 4 horas úteis.
`;

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo, não faça suposições e não complete informações ausentes. ' +
        'Quando a resposta exata não estiver presente no contexto, informe claramente que não há informação suficiente.',
      input: `
Contexto:
${context}

Pergunta:
Qual é o número de telefone do suporte técnico?
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

    expect(answer).not.toMatch(/\(\d{2}\)\s?\d{4,5}-?\d{4}/);
  });
});