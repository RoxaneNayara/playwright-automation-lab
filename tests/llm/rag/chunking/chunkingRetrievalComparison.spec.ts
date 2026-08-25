import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const splitIntoChunks = (text: string, chunkSize: number): string[] => {
  const words = text.split(' ');
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += chunkSize) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }

  return chunks;
};

const splitIntoChunksWithOverlap = (text: string, chunkSize: number, overlap: number): string[] => {
  const words = text.split(' ');
  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let index = 0; index < words.length; index += step) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }

  return chunks;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);

  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));

  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  return dotProduct / (magnitudeA * magnitudeB);
};

test.describe('LLM - RAG - Chunking Retrieval Comparison', () => {
  test('deve comparar retrieval com e sem overlap', async () => {
    const client = new OpenAI();

    const document =
      'Após cinco tentativas inválidas de login a conta fica bloqueada por 30 minutos. ' +
      'O suporte funciona de segunda a sexta das 8h às 18h.';

    const question = 'Por quanto tempo a conta fica bloqueada após tentativas inválidas?';

    const basicChunks = splitIntoChunks(document, 12);

    const overlapChunks = splitIntoChunksWithOverlap(document, 12, 3);

    console.log('Basic chunks:', basicChunks);
    console.log('Overlap chunks:', overlapChunks);

    const allTexts = [question, ...basicChunks, ...overlapChunks];

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: allTexts,
    });

    const embeddings = embeddingResponse.data.map((item) => item.embedding);

    const questionEmbedding = embeddings[0];

    const basicEmbeddings = embeddings.slice(1, 1 + basicChunks.length);

    const overlapEmbeddings = embeddings.slice(1 + basicChunks.length);

    const basicRanking = basicChunks
      .map((chunk, index) => ({
        chunk,
        similarity: cosineSimilarity(questionEmbedding, basicEmbeddings[index]),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const overlapRanking = overlapChunks
      .map((chunk, index) => ({
        chunk,
        similarity: cosineSimilarity(questionEmbedding, overlapEmbeddings[index]),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    console.log('Basic ranking:', basicRanking);
    console.log('Overlap ranking:', overlapRanking);

    const basicTopK = basicRanking.slice(0, 2);
    const overlapTopK = overlapRanking.slice(0, 2);

    const basicHasCompleteEvidence = basicTopK.some((result) =>
      result.chunk.includes('30 minutos')
    );

    const overlapHasCompleteEvidence = overlapTopK.some((result) =>
      result.chunk.includes('30 minutos')
    );

    console.log('Basic has complete evidence:', basicHasCompleteEvidence);
    console.log('Overlap has complete evidence:', overlapHasCompleteEvidence);

    expect(basicHasCompleteEvidence).toBe(false);
    expect(overlapHasCompleteEvidence).toBe(true);
  });
});
