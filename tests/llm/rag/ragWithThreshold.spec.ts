import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG - Similarity Threshold', () => {
  test('deve evitar responder quando nenhum documento atingir relevância mínima', async () => {
    const client = new OpenAI();

    const question =
      'Qual é a política de reembolso para compras realizadas com cartão de crédito?';

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
      rankedDocuments.map((document) => ({
        id: document.id,
        similarity: document.similarity,
      }))
    );

    const similarityThreshold = 0.6;

    const relevantDocuments = rankedDocuments.filter(
      (document) => document.similarity >= similarityThreshold
    );

    console.log('Relevant documents:', relevantDocuments);

    expect(relevantDocuments).toHaveLength(0);
  });
});
