import { expect, test } from '@playwright/test';

const splitIntoChunks = (text: string, chunkSize: number): string[] => {
  const words = text.split(' ');
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += chunkSize) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }

  return chunks;
};

test.describe('LLM - RAG - Basic Chunking', () => {
  test('deve dividir um documento em chunks de tamanho definido', () => {
    const document =
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, o usuário deve aguardar o desbloqueio automático.';

    const chunks = splitIntoChunks(document, 10);

    console.log('Chunks:', chunks);

    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      expect(chunk.split(' ').length).toBeLessThanOrEqual(10);
    }
  });
});
