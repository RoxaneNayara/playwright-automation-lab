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

test.describe('LLM - RAG - Multi Document RAG With Sources', () => {
  test('deve responder com base nos chunks recuperados e citar a fonte correta', async () => {
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
    const topK = 2;

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

    const retrievedChunks = ranking.slice(0, topK);

    console.log('Retrieved chunks:', retrievedChunks);

    const context = retrievedChunks
      .map((chunk) => `[${chunk.chunkId}]\n${chunk.text}`)
      .join('\n\n');

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo. ' +
        'Ao final, informe a fonte no formato: Fonte: CHUNK_ID.',
      input: `
Contexto:
${context}

Pergunta:
${question}
      `,
    });

    const answer = response.output_text.trim();

    console.log('Answer:', answer);

    expect(retrievedChunks[0].documentId).toBe('DOC_LOGIN');

    expect(retrievedChunks[0].chunkId).toBe('DOC_LOGIN_CHUNK_1');

    expect(answer).toContain('30 minutos');

    expect(answer).toContain('Fonte: DOC_LOGIN_CHUNK_1');
  });
});
