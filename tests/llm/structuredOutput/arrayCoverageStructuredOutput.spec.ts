import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Structured Output - Array Coverage', () => {
  test('deve retornar casos positivos e negativos para login', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input:
        'Crie exatamente 3 casos de teste para login. ' +
        'A lista deve conter pelo menos um cenário positivo e um cenário negativo.',
      text: {
        format: {
          type: 'json_schema',
          name: 'qa_test_cases_coverage',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              testCases: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
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
                    priority: {
                      type: 'string',
                      enum: ['LOW', 'MEDIUM', 'HIGH'],
                    },
                    expectedResult: {
                      type: 'string',
                    },
                  },
                  required: ['title', 'scenarioType', 'priority', 'expectedResult'],
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

    console.log(response.usage);
    console.log(response.output_text);

    const result = JSON.parse(response.output_text);

    expect(result.testCases).toHaveLength(3);

    const scenarioTypes = result.testCases.map(
      (testCase: { scenarioType: string }) => testCase.scenarioType
    );

    expect(scenarioTypes).toContain('POSITIVE');
    expect(scenarioTypes).toContain('NEGATIVE');
  });
});
