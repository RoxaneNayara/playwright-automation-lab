import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Embeddings - Top K Retrieval', () => {
  test('deve recuperar os dois documentos mais relevantes para a pergunta', async () => {
    const client = new OpenAI();

    const question =
      'O que acontece após várias tentativas inválidas e por quanto tempo a conta fica bloqueada?';

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
      .map((document, index) => ({
        id: document.id,
        similarity: cosineSimilarity(
          questionEmbedding,
          response.data[index + 1].embedding,
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const topK = rankedDocuments.slice(0, 2);

    console.log('Top 2 documents:', topK);

    const topIds = topK.map((document) => document.id);

    expect(topIds).toContain('DOC_B');
    expect(topIds).toContain('DOC_C');
  });
});