import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG - Retrieval nDCG', () => {
  test('deve avaliar a qualidade da ordenação considerando níveis de relevância', async () => {
    const client = new OpenAI();

    const question =
      'O que acontece após cinco tentativas inválidas e durante o período de bloqueio?';

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
    ];

    const relevanceGrades: Record<string, number> = {
      DOC_B: 3,
      DOC_C: 2,
      DOC_D: 1,
      DOC_A: 0,
    };

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
        relevance: relevanceGrades[document.id],
      }))
    );

    const calculateDCG = (grades: number[]): number => {
      return grades.reduce((sum, grade, index) => {
        const position = index + 1;

        return sum + (Math.pow(2, grade) - 1) / Math.log2(position + 1);
      }, 0);
    };

    const actualGrades = rankedDocuments.map((document) => relevanceGrades[document.id]);

    const idealGrades = [...actualGrades].sort((a, b) => b - a);

    const dcg = calculateDCG(actualGrades);
    const idcg = calculateDCG(idealGrades);

    const ndcg = dcg / idcg;

    console.log('Actual grades:', actualGrades);
    console.log('Ideal grades:', idealGrades);
    console.log('DCG:', dcg);
    console.log('IDCG:', idcg);
    console.log('nDCG:', ndcg);

    expect(ndcg).toBeGreaterThan(0);
    expect(ndcg).toBeLessThanOrEqual(1);
  });
});
