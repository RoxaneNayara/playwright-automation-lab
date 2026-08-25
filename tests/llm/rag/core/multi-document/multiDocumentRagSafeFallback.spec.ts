import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

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

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);

  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));

  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  return dotProduct / (magnitudeA * magnitudeB);
};

const buildFallbackAnswer = (relevantChunks: Array<{ similarity: number }>): string => {
  if (relevantChunks.length === 0) {
    return 'Não há contexto suficiente para responder com segurança.';
  }

  return 'Contexto relevante encontrado.';
};

test.describe('LLM - RAG - Multi Document Safe Fallback', () => {
  test('deve retornar fallback quando não houver contexto relevante suficiente', async () => {
    const client = new OpenAI();

    const documents = [
      {
        id: 'DOC_SUPPORT',
        text:
          'O suporte funciona de segunda a sexta das 8h às 18h. ' +
          'O prazo médio para a primeira resposta é de até quatro horas úteis.',
      },
      {
        id: 'DOC_LOGIN',
        text:
          'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
          'O desbloqueio ocorre automaticamente após o término do período.',
      },
      {
        id: 'DOC_PAYMENT',
        text:
          'Pagamentos com cartão podem levar alguns minutos para serem confirmados. ' +
          'Cobranças duplicadas devem ser encaminhadas ao suporte financeiro.',
      },
    ];

    const question = 'Qual é o prazo para solicitar reembolso de uma compra?';

    const maxWordsPerChunk = 20;
    const threshold = 0.6;

    const chunks = documents.flatMap((document) =>
      splitIntoSentenceChunksWithLimit(document.text, maxWordsPerChunk).map((chunk, index) => ({
        documentId: document.id,
        chunkId: `${document.id}_CHUNK_${index + 1}`,
        text: chunk,
      }))
    );

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: [question, ...chunks.map((chunk) => chunk.text)],
    });

    const embeddings = embeddingResponse.data.map((item) => item.embedding);

    const questionEmbedding = embeddings[0];
    const chunkEmbeddings = embeddings.slice(1);

    const ranking = chunks
      .map((chunk, index) => ({
        ...chunk,
        similarity: cosineSimilarity(questionEmbedding, chunkEmbeddings[index]),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    console.log('Ranking:', ranking);

    const relevantChunks = ranking.filter((chunk) => chunk.similarity >= threshold);

    console.log('Relevant chunks:', relevantChunks);

    const answer = buildFallbackAnswer(relevantChunks);

    console.log('Answer:', answer);

    expect(relevantChunks).toHaveLength(0);

    expect(answer).toBe('Não há contexto suficiente para responder com segurança.');
  });
});
