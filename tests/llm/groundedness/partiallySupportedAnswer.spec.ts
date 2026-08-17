import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Partially Supported Answer', () => {
  test('deve responder apenas o que está suportado e sinalizar o que está ausente', async () => {
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
        'Não utilize conhecimento externo e não invente informações. ' +
        'Quando uma pergunta possuir várias partes, responda somente às partes suportadas pelo contexto ' +
        'e informe claramente quando alguma parte não puder ser determinada.',
      input: `
Contexto:
${context}

Pergunta:
Qual é o horário de funcionamento do suporte e qual é o telefone para contato?
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toLowerCase();

    const supportedInformationIndicators = [
      '09h',
      '18h',
      'segunda',
      'sexta',
    ];

    const missingInformationIndicators = [
      'não há informação',
      'não há informações',
      'não informado',
      'não foi informado',
      'não consta',
      'não é possível determinar',
      'informação insuficiente',
    ];

    const containsSupportedInformation =
      supportedInformationIndicators.some((indicator) =>
        answer.includes(indicator),
      );

    const indicatesMissingInformation =
      missingInformationIndicators.some((indicator) =>
        answer.includes(indicator),
      );

    expect(answer).not.toBe('');
    expect(containsSupportedInformation).toBeTruthy();
    expect(indicatesMissingInformation).toBeTruthy();

    expect(answer).not.toMatch(/\(\d{2}\)\s?\d{4,5}-?\d{4}/);
  });
});