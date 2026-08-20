import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Instruction Following - Exact Word Count', () => {
  test('deve responder com exatamente 5 palavras', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions: 'Responda obrigatoriamente em português usando exatamente 5 palavras.',
      input: 'Explique o objetivo do smoke testing.',
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim();

    const wordCount = answer.split(/\s+/).filter((word) => word.length > 0).length;

    expect(answer).not.toBe('');
    expect(wordCount).toBe(5);
  });
});
