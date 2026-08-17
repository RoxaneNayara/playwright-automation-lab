import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Instruction Following - Basic', () => {
  test('deve responder em português com no máximo 10 palavras', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda obrigatoriamente em português e use no máximo 10 palavras.',
      input: 'Explique o objetivo do smoke testing.',
    });

    console.log(response.usage);
    console.log(response.output_text);

    const answer = response.output_text.trim();

    const wordCount = answer
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .length;

      const portugueseIndicators = [
        'verificar',
        'funcionalidades',
        'essenciais',
        'funcionam',
        'antes',
        'testes',
        ];

        const containsPortugueseIndicator = portugueseIndicators.some((word) =>
        answer.toLowerCase().includes(word),
        );

    expect(answer).not.toBe('');
    expect(wordCount).toBeLessThanOrEqual(10);
    expect(containsPortugueseIndicator).toBeTruthy();
  });
  
});