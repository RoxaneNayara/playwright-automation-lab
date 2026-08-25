import { expect, test } from '@playwright/test';

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

test.describe('LLM - RAG - Sentence Chunking With Fallback', () => {
  test('deve quebrar sentença longa quando ela ultrapassar o limite', () => {
    const document =
      'O suporte funciona normalmente. ' +
      'Após cinco tentativas inválidas de login consecutivas realizadas pelo mesmo usuário, a conta é bloqueada automaticamente por 30 minutos antes de permitir novas tentativas de autenticação. ' +
      'Depois disso, o acesso é liberado automaticamente.';

    const maxWordsPerChunk = 20;

    const chunks = splitIntoSentenceChunksWithFallback(document, maxWordsPerChunk);

    console.log('Chunks with fallback:', chunks);

    for (const chunk of chunks) {
      const wordCount = chunk.split(' ').length;

      console.log({
        chunk,
        wordCount,
      });

      expect(wordCount).toBeLessThanOrEqual(maxWordsPerChunk);
    }

    expect(chunks.length).toBeGreaterThan(3);
  });
});
