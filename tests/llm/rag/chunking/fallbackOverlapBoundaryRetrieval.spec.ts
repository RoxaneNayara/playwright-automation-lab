import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const splitLongSentence = (sentence: string, maxWordsPerChunk: number): string[] => {
  const words = sentence.split(' ');
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += maxWordsPerChunk) {
    chunks.push(words.slice(index, index + maxWordsPerChunk).join(' '));
  }

  return chunks;
};

const splitLongSentenceWithOverlap = (
  sentence: string,
  maxWordsPerChunk: number,
  overlap: number
): string[] => {
  const words = sentence.split(' ');
  const chunks: string[] = [];
  const step = maxWordsPerChunk - overlap;

  for (let index = 0; index < words.length; index += step) {
    chunks.push(words.slice(index, index + maxWordsPerChunk).join(' '));
  }

  return chunks;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);

  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));

  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  return dotProduct / (magnitudeA * magnitudeB);
};

test.describe('LLM - RAG - Fallback Overlap Boundary Retrieval', () => {
  test('deve comparar retrieval quando a evidência está na fronteira entre chunks', async () => {
    const client = new OpenAI();

    const sentence =
      'Após cinco tentativas inválidas de login consecutivas realizadas pelo mesmo usuário, a conta é bloqueada automaticamente por 30 minutos antes de permitir novas tentativas de autenticação.';

    const question = 'Quando o usuário pode tentar autenticar novamente?';

    const maxWordsPerChunk = 20;
    const overlap = 4;

    const chunksWithoutOverlap = splitLongSentence(sentence, maxWordsPerChunk);

    const chunksWithOverlap = splitLongSentenceWithOverlap(sentence, maxWordsPerChunk, overlap);

    console.log('Without overlap:', chunksWithoutOverlap);
    console.log('With overlap:', chunksWithOverlap);

    const allTexts = [question, ...chunksWithoutOverlap, ...chunksWithOverlap];

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: allTexts,
    });

    const embeddings = embeddingResponse.data.map((item) => item.embedding);

    const questionEmbedding = embeddings[0];

    const withoutOverlapEmbeddings = embeddings.slice(1, 1 + chunksWithoutOverlap.length);

    const withOverlapEmbeddings = embeddings.slice(1 + chunksWithoutOverlap.length);

    const withoutOverlapRanking = chunksWithoutOverlap
      .map((chunk, index) => ({
        chunk,
        similarity: cosineSimilarity(questionEmbedding, withoutOverlapEmbeddings[index]),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const withOverlapRanking = chunksWithOverlap
      .map((chunk, index) => ({
        chunk,
        similarity: cosineSimilarity(questionEmbedding, withOverlapEmbeddings[index]),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    console.log('Without overlap ranking:', withoutOverlapRanking);
    console.log('With overlap ranking:', withOverlapRanking);

    const topWithoutOverlap = withoutOverlapRanking[0];
    const topWithOverlap = withOverlapRanking[0];

    const withoutOverlapHasBoundaryEvidence = topWithoutOverlap.chunk.includes(
      'permitir novas tentativas de autenticação'
    );

    const withOverlapHasBoundaryEvidence = topWithOverlap.chunk.includes(
      'permitir novas tentativas de autenticação'
    );

    console.log({
      withoutOverlapHasBoundaryEvidence,
      withOverlapHasBoundaryEvidence,
      withoutOverlapSimilarity: topWithoutOverlap.similarity,
      withOverlapSimilarity: topWithOverlap.similarity,
    });

    expect(withoutOverlapHasBoundaryEvidence).toBeTruthy();
    expect(withOverlapHasBoundaryEvidence).toBeTruthy();
  });
});
