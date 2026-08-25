import { expect, test } from '@playwright/test';

const splitIntoChunksWithOverlap = (text: string, chunkSize: number, overlap: number): string[] => {
  const words = text.split(' ');
  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let index = 0; index < words.length; index += step) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }

  return chunks;
};

test.describe('LLM - RAG - Chunking With Overlap', () => {
  test('deve manter parte do contexto entre chunks consecutivos', () => {
    const document =
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, o usuário deve aguardar o desbloqueio automático.';

    const chunks = splitIntoChunksWithOverlap(document, 10, 3);

    console.log('Chunks with overlap:', chunks);

    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      expect(chunk.split(' ').length).toBeLessThanOrEqual(10);
    }

    const firstChunkWords = chunks[0].split(' ');
    const secondChunkWords = chunks[1].split(' ');

    const firstChunkOverlap = firstChunkWords.slice(-3);
    const secondChunkStart = secondChunkWords.slice(0, 3);

    expect(secondChunkStart).toEqual(firstChunkOverlap);
  });
});
