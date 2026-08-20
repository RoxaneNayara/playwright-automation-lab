import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fundamentals - Short Response', () => {
  test('deve explicar smoke testing em uma frase curta', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda em português, usando apenas uma frase curta com no máximo 15 palavras.',
      input: 'Qual é o objetivo do smoke testing?',
    });

    console.log(response.usage);
    console.log(response.output_text);

    const actualAnswer = response.output_text.trim().toLowerCase();

    const acceptedTerms = ['críticas', 'críticos', 'essenciais', 'principais', 'fundamentais'];

    const containsRelevantTerm = acceptedTerms.some((term) => actualAnswer.includes(term));

    expect(actualAnswer).not.toBe('');
    expect(containsRelevantTerm).toBeTruthy();

    const wordCount = response.output_text.trim().split(/\s+/).length;

    expect(wordCount).toBeLessThanOrEqual(15);
  });
});
