import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Structured Output - Basic', () => {
  test('deve retornar uma resposta seguindo o schema definido', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input:
        'Classifique a área responsável por qualidade de software e defina uma prioridade alta.',
      text: {
        format: {
          type: 'json_schema',
          name: 'qa_classification',
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
            },
            required: ['area', 'priority'],
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
  });
});