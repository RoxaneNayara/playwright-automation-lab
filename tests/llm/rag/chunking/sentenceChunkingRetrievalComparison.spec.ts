import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const splitIntoSentenceChunks = (text: string, maxSentencesPerChunk: number): string[] => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += maxSentencesPerChunk) {
    chunks.push(sentences.slice(index, index + maxSentencesPerChunk).join(' '));
  }

  return chunks;
};

const splitIntoSentenceChunksWithLimit = (text: string, maxWordsPerChunk: number): string[] => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.split(' ').length;

    const wouldExceedLimit = currentWordCount + sentenceWordCount > maxWordsPerChunk;

    if (wouldExceedLimit && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(sentence);
    currentWordCount += sentenceWordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};

const splitLongSentence = (sentence: string, maxWordsPerChunk: number): string[] => {
  const words = sentence.split(' ');
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += maxWordsPerChunk) {
    chunks.push(words.slice(index, index + maxWordsPerChunk).join(' '));
  }

  return chunks;
};

const splitIntoSentenceChunksWithFallback = (text: string, maxWordsPerChunk: number): string[] => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.split(' ').length;

    if (sentenceWordCount > maxWordsPerChunk) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentWordCount = 0;
      }

      chunks.push(...splitLongSentence(sentence, maxWordsPerChunk));

      continue;
    }

    const wouldExceedLimit = currentWordCount + sentenceWordCount > maxWordsPerChunk;

    if (wouldExceedLimit && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(sentence);
    currentWordCount += sentenceWordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
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

const splitIntoSentenceChunksWithFallbackOverlap = (
  text: string,
  maxWordsPerChunk: number,
  overlap: number
): string[] => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.split(' ').length;

    if (sentenceWordCount > maxWordsPerChunk) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentWordCount = 0;
      }

      chunks.push(...splitLongSentenceWithOverlap(sentence, maxWordsPerChunk, overlap));

      continue;
    }

    const wouldExceedLimit = currentWordCount + sentenceWordCount > maxWordsPerChunk;

    if (wouldExceedLimit && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(sentence);
    currentWordCount += sentenceWordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);

  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));

  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  return dotProduct / (magnitudeA * magnitudeB);
};

test.describe('LLM - RAG - Sentence Chunking Retrieval Comparison', () => {
  test('deve comparar o retrieval entre estratégias de sentence chunking', async () => {
    const client = new OpenAI();

    const document =
      'O suporte funciona normalmente. ' +
      'Após cinco tentativas inválidas de login consecutivas realizadas pelo mesmo usuário, a conta é bloqueada automaticamente por 30 minutos antes de permitir novas tentativas de autenticação. ' +
      'Depois disso, o acesso é liberado automaticamente.';

    const question = 'Por quanto tempo a conta fica bloqueada após tentativas inválidas?';

    const strategies = {
      sentence: splitIntoSentenceChunks(document, 2),
      sentenceWithLimit: splitIntoSentenceChunksWithLimit(document, 20),
      sentenceWithFallback: splitIntoSentenceChunksWithFallback(document, 20),
      sentenceWithFallbackOverlap: splitIntoSentenceChunksWithFallbackOverlap(document, 20, 4),
    };

    const allChunks = Object.values(strategies).flat();

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: [question, ...allChunks],
    });

    const embeddings = embeddingResponse.data.map((item) => item.embedding);

    const questionEmbedding = embeddings[0];

    let offset = 1;

    const results: Record<string, Array<{ chunk: string; similarity: number }>> = {};

    for (const [strategyName, chunks] of Object.entries(strategies)) {
      const chunkEmbeddings = embeddings.slice(offset, offset + chunks.length);

      offset += chunks.length;

      results[strategyName] = chunks
        .map((chunk, index) => ({
          chunk,
          similarity: cosineSimilarity(questionEmbedding, chunkEmbeddings[index]),
        }))
        .sort((a, b) => b.similarity - a.similarity);
    }

    for (const [strategyName, ranking] of Object.entries(results)) {
      console.log(`\nStrategy: ${strategyName}`);
      console.log('Top result:', ranking[0]);
    }

    const topResults = Object.entries(results).map(([strategyName, ranking]) => ({
      strategyName,
      chunk: ranking[0].chunk,
      similarity: ranking[0].similarity,
      hasCompleteEvidence: ranking[0].chunk.includes('30 minutos'),
    }));

    console.log('\nComparison:', topResults);

    for (const result of topResults) {
      expect(result.hasCompleteEvidence).toBeTruthy();
    }
  });
});
