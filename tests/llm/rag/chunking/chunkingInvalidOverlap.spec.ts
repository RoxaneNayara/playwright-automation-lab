import { expect, test } from '@playwright/test';

const splitIntoChunksWithOverlap = (text: string, chunkSize: number, overlap: number): string[] => {
  if (overlap >= chunkSize) {
    throw new Error('Overlap must be smaller than chunkSize.');
  }

  const words = text.split(' ');
  const chunks: string[] = [];
  const step = chunkSize - overlap;

  for (let index = 0; index < words.length; index += step) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }

  return chunks;
};

test.describe('LLM - RAG - Invalid Chunking Overlap', () => {
  test('deve rejeitar overlap igual ou maior que o tamanho do chunk', () => {
    const document =
      'Este documento será usado apenas para validar uma configuração inválida de overlap.';

    expect(() => splitIntoChunksWithOverlap(document, 10, 10)).toThrow(
      'Overlap must be smaller than chunkSize.'
    );

    expect(() => splitIntoChunksWithOverlap(document, 10, 12)).toThrow(
      'Overlap must be smaller than chunkSize.'
    );
  });
});
