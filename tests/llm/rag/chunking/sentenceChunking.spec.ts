import { expect, test } from '@playwright/test';

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

test.describe('LLM - RAG - Sentence Chunking', () => {
  test('deve dividir o documento preservando sentenças completas', () => {
    const document =
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, o usuário deve aguardar o desbloqueio automático. ' +
      'Se o problema continuar, o usuário deve entrar em contato com o suporte.';

    const chunks = splitIntoSentenceChunks(document, 2);

    console.log('Sentence chunks:', chunks);

    expect(chunks).toHaveLength(2);

    expect(chunks[0]).toBe(
      'O suporte funciona de segunda a sexta das 8h às 18h. ' +
        'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.'
    );

    expect(chunks[1]).toBe(
      'Durante o bloqueio, o usuário deve aguardar o desbloqueio automático. ' +
        'Se o problema continuar, o usuário deve entrar em contato com o suporte.'
    );
  });
});
