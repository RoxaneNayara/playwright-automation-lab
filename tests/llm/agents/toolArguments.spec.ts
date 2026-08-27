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

test.describe('LLM - Agents - Tool Arguments', () => {
  test('deve enviar os argumentos corretos para a ferramenta selecionada', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      input: 'Transfira 250 reais da conta ACC-123 para a conta ACC-999.',
      tools: [
        {
          type: 'function',
          name: 'transferFunds',
          description: 'Realiza transferência de valor entre duas contas.',
          strict: true,
          parameters: {
            type: 'object',
            properties: {
              sourceAccountId: {
                type: 'string',
                description: 'Conta de origem.',
              },
              destinationAccountId: {
                type: 'string',
                description: 'Conta de destino.',
              },
              amount: {
                type: 'number',
                description: 'Valor da transferência.',
              },
            },
            required: ['sourceAccountId', 'destinationAccountId', 'amount'],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: 'auto',
    });

    const toolCall = getFunctionCall(response.output);

    console.log('\n=== Tool Arguments ===');
    console.log(toolCall);

    expect(toolCall.type).toBe('function_call');
    expect(toolCall.name).toBe('transferFunds');

    const args = JSON.parse(toolCall.arguments) as {
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
    };

    console.log('\nParsed arguments:');
    console.log(args);

    expect(args.sourceAccountId).toBe('ACC-123');
    expect(args.destinationAccountId).toBe('ACC-999');
    expect(args.amount).toBe(250);
  });
});
