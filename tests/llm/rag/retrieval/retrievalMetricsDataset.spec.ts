import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG - Retrieval Metrics Dataset', () => {
  test('deve avaliar métricas de retrieval em múltiplas perguntas', async () => {
    const client = new OpenAI();

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

    const dataset = [
      {
        question: 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?',
        relevantDocumentIds: ['DOC_B', 'DOC_C'],
        relevanceGrades: {
          DOC_B: 3,
          DOC_C: 2,
          DOC_D: 1,
          DOC_A: 0,
          DOC_E: 0,
        },
      },
      {
        question: 'Em quais dias e horários o suporte está disponível?',
        relevantDocumentIds: ['DOC_A'],
        relevanceGrades: {
          DOC_A: 3,
          DOC_B: 0,
          DOC_C: 0,
          DOC_D: 0,
          DOC_E: 0,
        },
      },
      {
        question: 'Qual é o prazo médio inicial para o suporte responder?',
        relevantDocumentIds: ['DOC_E'],
        relevanceGrades: {
          DOC_E: 3,
          DOC_A: 0,
          DOC_B: 0,
          DOC_C: 0,
          DOC_D: 0,
        },
      },
      {
        question: 'O que um usuário pode fazer enquanto a conta estiver bloqueada?',
        relevantDocumentIds: ['DOC_C', 'DOC_D', 'DOC_B'],
        relevanceGrades: {
          DOC_C: 3,
          DOC_D: 2,
          DOC_B: 1,
          DOC_A: 0,
          DOC_E: 0,
        },
      },
    ];

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: [
        ...dataset.map((item) => item.question),
        ...documents.map((document) => document.text),
      ],
    });

    console.log('Embedding usage:', embeddingResponse.usage);

    const questionEmbeddings = embeddingResponse.data
      .slice(0, dataset.length)
      .map((item) => item.embedding);

    const documentEmbeddings = embeddingResponse.data
      .slice(dataset.length)
      .map((item) => item.embedding);

    const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
      const dotProduct = vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);

      const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));

      const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

      return dotProduct / (magnitudeA * magnitudeB);
    };

    const calculateDCG = (grades: number[]): number => {
      return grades.reduce((sum, grade, index) => {
        const position = index + 1;

        return sum + (Math.pow(2, grade) - 1) / Math.log2(position + 1);
      }, 0);
    };

    const k = 2;

    const results = dataset.map((item, questionIndex) => {
      const rankedDocuments = documents
        .map((document, documentIndex) => ({
          ...document,
          similarity: cosineSimilarity(
            questionEmbeddings[questionIndex],
            documentEmbeddings[documentIndex]
          ),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      const topK = rankedDocuments.slice(0, k);

      const relevantRetrieved = topK.filter((document) =>
        item.relevantDocumentIds.includes(document.id)
      );

      const precisionAtK = relevantRetrieved.length / k;

      const recallAtK = relevantRetrieved.length / item.relevantDocumentIds.length;

      const f1Score =
        precisionAtK + recallAtK === 0
          ? 0
          : (2 * precisionAtK * recallAtK) / (precisionAtK + recallAtK);

      const firstRelevantIndex = rankedDocuments.findIndex((document) =>
        item.relevantDocumentIds.includes(document.id)
      );

      const reciprocalRank = firstRelevantIndex === -1 ? 0 : 1 / (firstRelevantIndex + 1);

      const actualGrades = rankedDocuments.map(
        (document) => item.relevanceGrades[document.id as keyof typeof item.relevanceGrades]
      );

      const idealGrades = [...actualGrades].sort((a, b) => b - a);

      const dcg = calculateDCG(actualGrades);
      const idcg = calculateDCG(idealGrades);

      const ndcg = idcg === 0 ? 0 : dcg / idcg;

      console.log('\nQuestion:', item.question);

      console.log(
        'Ranking:',
        rankedDocuments.map((document, index) => ({
          position: index + 1,
          id: document.id,
          similarity: document.similarity,
        }))
      );

      console.log('Precision@K:', precisionAtK);
      console.log('Recall@K:', recallAtK);
      console.log('F1:', f1Score);
      console.log('RR:', reciprocalRank);
      console.log('nDCG:', ndcg);

      return {
        precisionAtK,
        recallAtK,
        f1Score,
        reciprocalRank,
        ndcg,
      };
    });

    const average = (values: number[]): number =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    const averagePrecision = average(results.map((result) => result.precisionAtK));

    const averageRecall = average(results.map((result) => result.recallAtK));

    const averageF1 = average(results.map((result) => result.f1Score));

    const meanReciprocalRank = average(results.map((result) => result.reciprocalRank));

    const averageNDCG = average(results.map((result) => result.ndcg));

    console.log('\n=== DATASET SUMMARY ===');

    console.log('Average Precision@K:', averagePrecision);

    console.log('Average Recall@K:', averageRecall);

    console.log('Average F1:', averageF1);

    console.log('MRR:', meanReciprocalRank);

    console.log('Average nDCG:', averageNDCG);

    expect(averagePrecision).toBeGreaterThanOrEqual(0.75);

    expect(averageRecall).toBeGreaterThanOrEqual(0.6);

    expect(averageF1).toBeGreaterThanOrEqual(0.65);

    expect(meanReciprocalRank).toBeGreaterThanOrEqual(0.75);

    expect(averageNDCG).toBeGreaterThanOrEqual(0.75);
  });
});
