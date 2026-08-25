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

test.describe('LLM - RAG - Chunking Overlap Trade-off', () => {
  test('deve demonstrar que maior overlap gera mais chunks', () => {
    const document =
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, o usuário deve aguardar o desbloqueio automático. ' +
      'Caso o problema continue após o desbloqueio, o usuário deve entrar em contato com o suporte.';

    const chunkSize = 10;

    const noOverlapChunks = splitIntoChunksWithOverlap(document, chunkSize, 0);

    const overlapThreeChunks = splitIntoChunksWithOverlap(document, chunkSize, 3);

    const overlapFiveChunks = splitIntoChunksWithOverlap(document, chunkSize, 5);

    console.log('No overlap:', noOverlapChunks);
    console.log('Overlap 3:', overlapThreeChunks);
    console.log('Overlap 5:', overlapFiveChunks);

    console.log('Chunk count without overlap:', noOverlapChunks.length);
    console.log('Chunk count with overlap 3:', overlapThreeChunks.length);
    console.log('Chunk count with overlap 5:', overlapFiveChunks.length);

    expect(overlapThreeChunks.length).toBeGreaterThan(noOverlapChunks.length);

    expect(overlapFiveChunks.length).toBeGreaterThan(overlapThreeChunks.length);
  });
});
