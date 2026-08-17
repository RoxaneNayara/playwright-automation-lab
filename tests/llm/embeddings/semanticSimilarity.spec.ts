import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Embeddings - Semantic Similarity', () => {
  test('deve identificar maior similaridade entre textos semanticamente relacionados', async () => {
    const client = new OpenAI();

    const texts = [
      'Login falhou porque a senha está incorreta.',
      'Autenticação rejeitada devido a credenciais inválidas.',
      'O prazo de entrega do produto é de cinco dias.',
    ];

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    console.log('Usage:', response.usage);

    const loginFailureEmbedding = response.data[0].embedding;
    const invalidCredentialsEmbedding = response.data[1].embedding;
    const deliveryEmbedding = response.data[2].embedding;

    const cosineSimilarity = (
      vectorA: number[],
      vectorB: number[],
    ): number => {
      const dotProduct = vectorA.reduce(
        (sum, value, index) => sum + value * vectorB[index],
        0,
      );

      const magnitudeA = Math.sqrt(
        vectorA.reduce((sum, value) => sum + value * value, 0),
      );

      const magnitudeB = Math.sqrt(
        vectorB.reduce((sum, value) => sum + value * value, 0),
      );

      return dotProduct / (magnitudeA * magnitudeB);
    };

    const relatedSimilarity = cosineSimilarity(
      loginFailureEmbedding,
      invalidCredentialsEmbedding,
    );

    const unrelatedSimilarity = cosineSimilarity(
      loginFailureEmbedding,
      deliveryEmbedding,
    );

    console.log('Related similarity:', relatedSimilarity);
    console.log('Unrelated similarity:', unrelatedSimilarity);

    expect(relatedSimilarity).toBeGreaterThan(unrelatedSimilarity);
  });
});