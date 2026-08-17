import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Embeddings - Semantic Ranking', () => {
  test('deve ordenar documentos do mais relevante ao menos relevante', async () => {
    const client = new OpenAI();

    const question =
      'Por quanto tempo a conta fica bloqueada após várias tentativas inválidas?';

    const documents = [
      {
        id: 'DOC_A',
        text: 'O suporte funciona de segunda a sexta-feira, das 09h às 18h.',
      },
      {
        id: 'DOC_B',
        text: 'Após cinco tentativas inválidas, a conta fica bloqueada por 30 minutos.',
      },
      {
        id: 'DOC_C',
        text: 'O prazo médio inicial de resposta do suporte é de até 4 horas úteis.',
      },
      {
        id: 'DOC_D',
        text: 'O usuário pode realizar login utilizando e-mail e senha válidos.',
      },
    ];

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: [
        question,
        ...documents.map((document) => document.text),
      ],
    });

    console.log('Usage:', response.usage);

    const questionEmbedding = response.data[0].embedding;

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

    const rankedDocuments = documents
      .map((document, index) => {
        const documentEmbedding = response.data[index + 1].embedding;

        return {
          id: document.id,
          similarity: cosineSimilarity(
            questionEmbedding,
            documentEmbedding,
          ),
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    console.log('Semantic ranking:', rankedDocuments);

    expect(rankedDocuments).toHaveLength(4);
    expect(rankedDocuments[0].id).toBe('DOC_B');

    expect(rankedDocuments[0].similarity).toBeGreaterThan(
      rankedDocuments[1].similarity,
    );
  });
});