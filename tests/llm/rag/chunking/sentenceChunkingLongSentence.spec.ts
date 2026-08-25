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

test.describe('LLM - RAG - Sentence Chunking Long Sentence', () => {
  test('deve preservar sentença completa mesmo quando ela ultrapassa o limite', () => {
    const document =
      'O suporte funciona normalmente. ' +
      'Após cinco tentativas inválidas de login consecutivas realizadas pelo mesmo usuário, a conta é bloqueada automaticamente por 30 minutos antes de permitir novas tentativas de autenticação. ' +
      'Depois disso, o acesso é liberado automaticamente.';

    const maxWordsPerChunk = 20;

    const chunks = splitIntoSentenceChunksWithLimit(document, maxWordsPerChunk);

    console.log('Chunks:', chunks);

    for (const chunk of chunks) {
      console.log({
        chunk,
        wordCount: chunk.split(' ').length,
      });
    }

    const longSentenceChunk = chunks.find((chunk) =>
      chunk.includes('Após cinco tentativas inválidas')
    );

    expect(longSentenceChunk).toBeDefined();

    expect(longSentenceChunk).toContain('a conta é bloqueada automaticamente por 30 minutos');

    expect(longSentenceChunk!.split(' ').length).toBeGreaterThan(maxWordsPerChunk);
  });
});
