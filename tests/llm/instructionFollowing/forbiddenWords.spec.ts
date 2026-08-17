import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Instruction Following - Forbidden Words', () => {
  test('deve explicar smoke testing sem usar palavras proibidas', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda em português. ' +
        'Explique o objetivo do smoke testing sem usar as palavras "teste" ou "testes".',
      input: 'Qual é o objetivo do smoke testing?',
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim().toLowerCase();

    const forbiddenWords = ['teste', 'testes'];

    for (const forbiddenWord of forbiddenWords) {
      expect(answer).not.toContain(forbiddenWord);
    }

    expect(answer).not.toBe('');
  });
});