import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Structured Output - Complex', () => {
  test('deve retornar uma resposta estruturada com múltiplos tipos de dados', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input:
        'Classifique um cenário de QA para validação de login crítico e retorne os dados conforme o schema.',
      text: {
        format: {
          type: 'json_schema',
          name: 'qa_test_classification',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              area: {
                type: 'string',
                enum: ['QA'],
              },
              priority: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH'],
              },
              automated: {
                type: 'boolean',
              },
              testTypes: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['FUNCTIONAL', 'SMOKE', 'REGRESSION', 'SECURITY'],
                },
              },
            },
            required: ['area', 'priority', 'automated', 'testTypes'],
            additionalProperties: false,
          },
        },
      },
    });

    console.log(response.usage);
    console.log(response.output_text);

    const result = JSON.parse(response.output_text);

    expect(result.area).toBe('QA');
    expect(result.priority).toBe('HIGH');
    expect(typeof result.automated).toBe('boolean');

    expect(Array.isArray(result.testTypes)).toBeTruthy();
    expect(result.testTypes.length).toBeGreaterThan(0);

    for (const testType of result.testTypes) {
      expect(['FUNCTIONAL', 'SMOKE', 'REGRESSION', 'SECURITY']).toContain(testType);
    }
  });
});
