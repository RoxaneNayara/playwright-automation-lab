import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Embeddings - Basic', () => {
  test('deve gerar um vetor de embedding para um texto', async () => {
    const client = new OpenAI();

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'Smoke testing verifica rapidamente funcionalidades críticas.',
    });

    const embedding = response.data[0].embedding;

    console.log('Usage:', response.usage);
    console.log('Embedding length:', embedding.length);
    console.log('First values:', embedding.slice(0, 5));

    expect(response.data).toHaveLength(1);

    expect(Array.isArray(embedding)).toBeTruthy();
    expect(embedding.length).toBeGreaterThan(0);

    for (const value of embedding) {
      expect(typeof value).toBe('number');
    }
  });
});