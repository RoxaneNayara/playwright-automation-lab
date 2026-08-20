import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Structured Output - Array of Objects', () => {
  test('deve retornar uma lista estruturada de casos de teste', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input:
        'Crie exatamente 3 casos de teste para uma funcionalidade de login, incluindo cenários positivo e negativo.',
      text: {
        format: {
          type: 'json_schema',
          name: 'qa_test_cases',
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
                    priority: {
                      type: 'string',
                      enum: ['LOW', 'MEDIUM', 'HIGH'],
                    },
                    expectedResult: {
                      type: 'string',
                    },
                  },
                  required: ['title', 'priority', 'expectedResult'],
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

    expect(Array.isArray(result.testCases)).toBeTruthy();
    expect(result.testCases).toHaveLength(3);

    for (const testCase of result.testCases) {
      expect(typeof testCase.title).toBe('string');
      expect(testCase.title.trim()).not.toBe('');

      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(testCase.priority);

      expect(typeof testCase.expectedResult).toBe('string');
      expect(testCase.expectedResult.trim()).not.toBe('');
    }
  });
});
