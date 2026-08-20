import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG - Retrieval F1 Score', () => {
  test('deve calcular o equilíbrio entre precision e recall', async () => {
    const client = new OpenAI();

    const question =
      'O que acontece após cinco tentativas inválidas, por quanto tempo a conta fica bloqueada e o que o usuário pode fazer durante esse período?';

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
        text: 'Durante o período de bloqueio, o usuário deve aguardar o desbloqueio automático da conta.',
      },
      {
        id: 'DOC_E',
        text: 'O prazo médio inicial de resposta do suporte é de até 4 horas úteis.',
      },
    ];

    const relevantDocumentIds = ['DOC_B', 'DOC_C', 'DOC_D'];

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

    const k = 2;

    const topK = rankedDocuments.slice(0, k);

    console.log(
      'Top K:',
      topK.map((document) => ({
        id: document.id,
        similarity: document.similarity,
      }))
    );

    const relevantRetrieved = topK.filter((document) => relevantDocumentIds.includes(document.id));

    const precisionAtK = relevantRetrieved.length / k;

    const recallAtK = relevantRetrieved.length / relevantDocumentIds.length;

    const f1Score = (2 * precisionAtK * recallAtK) / (precisionAtK + recallAtK);

    console.log('Precision@K:', precisionAtK);
    console.log('Recall@K:', recallAtK);
    console.log('F1 Score:', f1Score);

    expect(precisionAtK).toBe(1);

    expect(recallAtK).toBeCloseTo(2 / 3, 2);

    expect(f1Score).toBeCloseTo(0.8, 2);
  });
});
