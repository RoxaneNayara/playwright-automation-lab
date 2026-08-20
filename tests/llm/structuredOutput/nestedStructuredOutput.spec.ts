import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Structured Output - Nested Object', () => {
  test('deve retornar uma resposta estruturada com objetos aninhados', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input:
        'Crie uma classificação para um caso de teste de login crítico e retorne os dados conforme o schema.',
      text: {
        format: {
          type: 'json_schema',
          name: 'qa_nested_classification',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              testCase: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                  priority: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH'],
                  },
                },
                required: ['title', 'priority'],
                additionalProperties: false,
              },
              execution: {
                type: 'object',
                properties: {
                  automated: {
                    type: 'boolean',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
                required: ['automated', 'tags'],
                additionalProperties: false,
              },
            },
            required: ['testCase', 'execution'],
            additionalProperties: false,
          },
        },
      },
    });

    console.log(response.usage);
    console.log(response.output_text);

    const result = JSON.parse(response.output_text);

    expect(result.testCase).toBeDefined();
    expect(result.execution).toBeDefined();

    expect(typeof result.testCase.title).toBe('string');
    expect(result.testCase.title.trim()).not.toBe('');

    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.testCase.priority);

    expect(typeof result.execution.automated).toBe('boolean');

    expect(Array.isArray(result.execution.tags)).toBeTruthy();
  });
});
