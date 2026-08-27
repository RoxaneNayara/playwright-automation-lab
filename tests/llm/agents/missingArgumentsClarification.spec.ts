import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Agents - Missing Arguments Clarification', () => {
  test('deve pedir o parâmetro obrigatório ausente em vez de inventar um valor', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input: 'Qual é o saldo atual da minha conta?',
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
                description: 'Identificador da conta.',
              },
            },
            required: ['accountId'],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: 'auto',
    });

    const toolCall = response.output.find((item) => item.type === 'function_call');

    const answer = response.output_text.trim();

    console.log('\n=== Missing Arguments Clarification ===');
    console.log({
      answer,
      toolCall,
    });

    expect(toolCall).toBeUndefined();

    expect(answer.length).toBeGreaterThan(0);

    expect(answer.toLowerCase()).toContain('identificador');
  });
});
