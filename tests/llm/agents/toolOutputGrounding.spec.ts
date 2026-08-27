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

test.describe('LLM - Agents - Tool Output Grounding', () => {
  test('deve responder com base exata no retorno da ferramenta', async () => {
    const client = new OpenAI();

    const firstResponse = await client.responses.create({
      model: 'gpt-5.6-luna',
      input: 'Qual é o saldo atual da conta ACC-123?',
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

    const toolCall = getFunctionCall(firstResponse.output);

    expect(toolCall.name).toBe('getAccountBalance');

    const simulatedToolOutput = JSON.stringify({
      success: true,
      balance: 1847.32,
      currency: 'BRL',
    });

    const finalResponse = await client.responses.create({
      model: 'gpt-5.6-luna',
      previous_response_id: firstResponse.id,
      input: [
        {
          type: 'function_call_output',
          call_id: toolCall.call_id,
          output: simulatedToolOutput,
        },
      ],
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
      ],
    });

    const answer = finalResponse.output_text.trim();

    console.log('\n=== Tool Output Grounding ===');
    console.log({
      toolCall: {
        name: toolCall.name,
        arguments: toolCall.arguments,
      },
      simulatedToolOutput,
      answer,
    });

    expect(answer.length).toBeGreaterThan(0);

    expect(answer).toContain('1.847,32');

    expect(answer.toLowerCase()).toMatch(/r\$|brl|real|reais/);

    expect(answer).not.toContain('2.000');
    expect(answer).not.toContain('2000');
  });
});
