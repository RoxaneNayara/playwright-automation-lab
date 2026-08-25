import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

const calculateReciprocalRank = (firstRelevantIndex: number): number => {
  if (firstRelevantIndex === -1) {
    return 0;
  }

  return 1 / (firstRelevantIndex + 1);
};

test.describe('LLM - RAG - Retrieval MRR', () => {
  test('deve calcular o reciprocal rank do primeiro documento relevante', async () => {
    const client = new OpenAI();

    const question = 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?';

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
        text: 'Usuários bloqueados não podem realizar novas tentativas até o fim do período de bloqueio.',
      },
      {
        id: 'DOC_D',
        text: 'O prazo médio inicial de resposta do suporte é de até 4 horas úteis.',
      },
    ];

    const relevantDocumentIds = ['DOC_B', 'DOC_C'];

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: [question, ...documents.map((document) => document.text)],
    });

    const questionEmbedding = embeddingResponse.data[0].embedding;

    const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
      const dotProduct = vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);

      const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));

      const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

      return dotProduct / (magnitudeA * magnitudeB);
    };

    const rankedDocuments = documents
      .map((document, index) => ({
        ...document,
        similarity: cosineSimilarity(
          questionEmbedding,
          embeddingResponse.data[index + 1].embedding
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    console.log(
      'Ranking:',
      rankedDocuments.map((document, index) => ({
        position: index + 1,
        id: document.id,
        similarity: document.similarity,
      }))
    );

    const firstRelevantIndex = rankedDocuments.findIndex((document) =>
      relevantDocumentIds.includes(document.id)
    );

    const reciprocalRank = calculateReciprocalRank(firstRelevantIndex);

    console.log('First relevant position:', firstRelevantIndex + 1);

    console.log('Reciprocal Rank:', reciprocalRank);

    expect(firstRelevantIndex).toBeGreaterThanOrEqual(0);
    expect(reciprocalRank).toBe(1);
  });
});
