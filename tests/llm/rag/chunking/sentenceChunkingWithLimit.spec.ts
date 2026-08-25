import { expect, test } from '@playwright/test';

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

test.describe('LLM - RAG - Sentence Chunking With Limit', () => {
  test('deve preservar sentenças completas respeitando limite aproximado de palavras', () => {
    const document =
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, o usuário deve aguardar o desbloqueio automático. ' +
      'Se o problema continuar, o usuário deve entrar em contato com o suporte.';

    const chunks = splitIntoSentenceChunksWithLimit(document, 20);

    console.log('Sentence chunks with limit:', chunks);

    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      const wordCount = chunk.split(' ').length;

      console.log({
        chunk,
        wordCount,
      });

      expect(wordCount).toBeLessThanOrEqual(20);
    }
  });
});
