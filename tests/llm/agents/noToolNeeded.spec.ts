import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Agents - No Tool Needed', () => {
  test('não deve chamar ferramenta quando a resposta não depende de uma tool', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input: 'Explique em uma frase o que é qualidade de software.',
      tools: [
        {
          type: 'function',
          name: 'getAccountBalance',
          description: 'Consulta o saldo atual de uma conta bancária.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              accountId: {
                type: 'string',
              },
            },
            required: ['accountId'],
            additionalProperties: false,
          },
        },
        {
          type: 'function',
          name: 'getWeather',
          description: 'Consulta a previsão do tempo para uma cidade.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
              },
            },
            required: ['city'],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: 'auto',
    });

    const toolCall = response.output.find((item) => item.type === 'function_call');

    console.log('\n=== No Tool Needed ===');
    console.log({
      answer: response.output_text.trim(),
      toolCall,
    });

    expect(toolCall).toBeUndefined();
    expect(response.output_text.trim().length).toBeGreaterThan(0);
  });
});
