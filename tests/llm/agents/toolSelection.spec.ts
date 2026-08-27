import { expect, test } from '@playwright/test';
import OpenAI from 'openai';
import type {
  ResponseFunctionToolCall,
  ResponseOutputItem,
} from 'openai/resources/responses/responses';

const getFunctionCall = (output: ResponseOutputItem[]): ResponseFunctionToolCall => {
  const toolCall = output.find(
    (item): item is ResponseFunctionToolCall => item.type === 'function_call'
  );

  if (!toolCall) {
    throw new Error('Nenhuma chamada de ferramenta foi realizada.');
  }

  return toolCall;
};

test.describe('LLM - Agents - Tool Selection', () => {
  test('deve selecionar a ferramenta correta para consultar saldo da conta', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input: 'Qual é o saldo atual da minha conta? O identificador da conta é ACC-123.',
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
        {
          type: 'function',
          name: 'searchProducts',
          description: 'Busca produtos disponíveis em um catálogo.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
              },
            },
            required: ['query'],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: 'auto',
    });

    const toolCall = getFunctionCall(response.output);

    console.log('\n=== Tool Selection ===');
    console.log(toolCall);

    expect(toolCall.type).toBe('function_call');
    expect(toolCall.name).toBe('getAccountBalance');
  });
});
