import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Structured Output - Scenario Type Semantic Validation', () => {
  test('deve validar se o tipo do cenário corresponde ao conteúdo gerado', async () => {
    const client = new OpenAI();

    const generationResponse = await client.responses.create({
      model: 'gpt-5.6-luna',
      input:
        'Crie exatamente 2 casos de teste para login: ' +
        'um cenário positivo e um cenário negativo.',
      text: {
        format: {
          type: 'json_schema',
          name: 'qa_login_scenarios',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              testCases: {
                type: 'array',
                minItems: 2,
                maxItems: 2,
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                    },
                    scenarioType: {
                      type: 'string',
                      enum: ['POSITIVE', 'NEGATIVE'],
                    },
                    expectedResult: {
                      type: 'string',
                    },
                  },
                  required: [
                    'title',
                    'scenarioType',
                    'expectedResult',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['testCases'],
            additionalProperties: false,
          },
        },
      },
    });

    console.log('Generation usage:', generationResponse.usage);
    console.log('Generated cases:', generationResponse.output_text);

    const generatedResult = JSON.parse(generationResponse.output_text);

    expect(generatedResult.testCases).toHaveLength(2);

    const judgeResponse = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Você é um avaliador de casos de teste de software. ' +
        'Valide se cada scenarioType corresponde semanticamente ao conteúdo do caso. ' +
        'POSITIVE deve representar fluxo válido ou sucesso esperado. ' +
        'NEGATIVE deve representar entrada inválida, erro, bloqueio ou rejeição esperada. ' +
        'Responda somente com VALID ou INVALID.',
      input: JSON.stringify(generatedResult.testCases),
    });

    console.log('Judge usage:', judgeResponse.usage);
    console.log('Judge result:', judgeResponse.output_text);

    const evaluation = judgeResponse.output_text.trim().toUpperCase();

    expect(evaluation).toBe('VALID');
  });
});