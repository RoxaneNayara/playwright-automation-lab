import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Groundedness - Unsupported Source Attribution', () => {
  test('deve informar quando nenhuma fonte sustenta a resposta solicitada', async () => {
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
        'Não utilize conhecimento externo, não invente informações e não atribua uma fonte sem evidência. ' +
        'Se nenhuma fonte sustentar a resposta solicitada, informe que a informação não está disponível ' +
        'e use exatamente FONTE: NENHUMA.',
      input: `
Contexto:
${context}

Pergunta:
Qual é o número de telefone do suporte?
      `,
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toUpperCase();

    const missingInformationIndicators = [
      'NÃO HÁ INFORMAÇÃO',
      'NÃO HÁ INFORMAÇÕES',
      'NÃO INFORMADO',
      'NÃO FOI INFORMADO',
      'NÃO CONSTA',
      'NÃO É POSSÍVEL DETERMINAR',
      'INFORMAÇÃO NÃO ESTÁ DISPONÍVEL',
      'INFORMAÇÃO INDISPONÍVEL',
    ];

    const indicatesMissingInformation = missingInformationIndicators.some((indicator) =>
      answer.includes(indicator)
    );

    expect(answer).not.toBe('');
    expect(indicatesMissingInformation).toBeTruthy();

    expect(answer).toContain('FONTE: NENHUMA');

    expect(answer).not.toContain('FONTE_A');
    expect(answer).not.toContain('FONTE_B');
    expect(answer).not.toContain('FONTE_C');

    expect(answer).not.toMatch(/\(\d{2}\)\s?\d{4,5}-?\d{4}/);
  });
});
