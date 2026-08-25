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

test.describe('LLM - RAG - Single Query Multi Source Limitation', () => {
  test('deve demonstrar limitação do single-query retrieval em pergunta composta', async () => {
    const client = new OpenAI();

    const documents = [
      {
        id: 'DOC_LOGIN',
        text:
          'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
          'O desbloqueio ocorre automaticamente após o término do período.',
      },
      {
        id: 'DOC_SUPPORT',
        text:
          'O suporte funciona de segunda a sexta das 8h às 18h. ' +
          'O prazo médio para a primeira resposta é de até quatro horas úteis.',
      },
      {
        id: 'DOC_PAYMENT',
        text:
          'Pagamentos com cartão podem levar alguns minutos para serem confirmados. ' +
          'Cobranças duplicadas devem ser encaminhadas ao suporte financeiro.',
      },
    ];

    const question =
      'Por quanto tempo a conta fica bloqueada e em quanto tempo o suporte responde?';

    const maxWordsPerChunk = 20;
    const topK = 3;

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

    console.log('\n=== Full Ranking ===');

    for (const result of ranking) {
      console.log({
        chunkId: result.chunkId,
        similarity: result.similarity,
        text: result.text,
      });
    }

    const retrievedChunks = ranking.slice(0, topK);

    console.log('Retrieved chunks:', retrievedChunks);

    const context = retrievedChunks
      .map((chunk) => `[${chunk.chunkId}]\n${chunk.text}`)
      .join('\n\n');

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Combine as informações necessárias para responder completamente. ' +
        'Ao final, informe todas as fontes realmente utilizadas no formato: ' +
        'Fontes: CHUNK_ID, CHUNK_ID.',
      input: `
Contexto:
${context}

Pergunta:
${question}
      `,
    });

    const answer = response.output_text.trim();

    console.log('Answer:', answer);

    expect(answer).toContain('30 minutos');

    expect(retrievedChunks.map((chunk) => chunk.chunkId)).toContain('DOC_LOGIN_CHUNK_1');

    expect(retrievedChunks.map((chunk) => chunk.chunkId)).not.toContain('DOC_SUPPORT_CHUNK_2');

    expect(answer).not.toContain('quatro horas úteis');

    expect(answer).toContain('DOC_LOGIN_CHUNK_1');

    expect(answer).not.toContain('DOC_SUPPORT_CHUNK_2');
  });
});
