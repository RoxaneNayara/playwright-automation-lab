import { expect, test } from '@playwright/test';

const splitLongSentenceWithOverlap = (
  sentence: string,
  maxWordsPerChunk: number,
  overlap: number
): string[] => {
  if (overlap >= maxWordsPerChunk) {
    throw new Error('Overlap must be smaller than maxWordsPerChunk.');
  }

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

test.describe('LLM - RAG - Sentence Chunking With Fallback Overlap', () => {
  test('deve preservar contexto ao quebrar sentença longa com overlap', () => {
    const document =
      'O suporte funciona normalmente. ' +
      'Após cinco tentativas inválidas de login consecutivas realizadas pelo mesmo usuário, a conta é bloqueada automaticamente por 30 minutos antes de permitir novas tentativas de autenticação. ' +
      'Depois disso, o acesso é liberado automaticamente.';

    const maxWordsPerChunk = 20;
    const overlap = 4;

    const chunks = splitIntoSentenceChunksWithFallbackOverlap(document, maxWordsPerChunk, overlap);

    console.log('Chunks with fallback overlap:', chunks);

    for (const chunk of chunks) {
      const wordCount = chunk.split(' ').length;

      console.log({
        chunk,
        wordCount,
      });

      expect(wordCount).toBeLessThanOrEqual(maxWordsPerChunk);
    }

    const longSentenceChunks = chunks.filter(
      (chunk) =>
        chunk.includes('tentativas inválidas') ||
        chunk.includes('30 minutos') ||
        chunk.includes('novas tentativas')
    );

    expect(longSentenceChunks.length).toBeGreaterThan(1);

    const firstLongChunkWords = longSentenceChunks[0].split(' ');
    const secondLongChunkWords = longSentenceChunks[1].split(' ');

    const firstOverlap = firstLongChunkWords.slice(-overlap);
    const secondStart = secondLongChunkWords.slice(0, overlap);

    expect(secondStart).toEqual(firstOverlap);
  });
});
