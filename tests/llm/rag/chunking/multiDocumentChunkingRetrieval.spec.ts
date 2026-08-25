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

test.describe('LLM - RAG - Multi Document Chunking Retrieval', () => {
  test('deve recuperar o documento e o chunk mais relevantes entre múltiplas fontes', async () => {
    const client = new OpenAI();

    const documents = [
      {
        id: 'DOC_SUPPORT',
        text:
          'O suporte funciona de segunda a sexta das 8h às 18h. ' +
          'O prazo médio para a primeira resposta é de até quatro horas úteis. ' +
          'Solicitações críticas recebem prioridade no atendimento.',
      },
      {
        id: 'DOC_LOGIN',
        text:
          'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
          'Durante o bloqueio, novas tentativas de autenticação não são permitidas. ' +
          'O desbloqueio ocorre automaticamente após o término do período.',
      },
      {
        id: 'DOC_PAYMENT',
        text:
          'Pagamentos com cartão podem levar alguns minutos para serem confirmados. ' +
          'Em caso de falha, o usuário deve verificar os dados informados antes de tentar novamente. ' +
          'Cobranças duplicadas devem ser encaminhadas ao suporte financeiro.',
      },
    ];

    const question = 'Por quanto tempo a conta fica bloqueada após tentativas inválidas de login?';

    const maxWordsPerChunk = 20;

    const chunks = documents.flatMap((document) =>
      splitIntoSentenceChunksWithLimit(document.text, maxWordsPerChunk).map((chunk, index) => ({
        documentId: document.id,
        chunkId: `${document.id}_CHUNK_${index + 1}`,
        text: chunk,
      }))
    );

    console.log('Chunks:', chunks);

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

    console.log('\n=== Ranking ===');

    for (const result of ranking) {
      console.log({
        documentId: result.documentId,
        chunkId: result.chunkId,
        similarity: result.similarity,
        text: result.text,
      });
    }

    const topResult = ranking[0];

    console.log('\n=== Top Result ===');
    console.log(topResult);

    expect(topResult.documentId).toBe('DOC_LOGIN');

    expect(topResult.text).toContain('30 minutos');

    expect(topResult.text).toContain('tentativas inválidas de login');
  });
});
