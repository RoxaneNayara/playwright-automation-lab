import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
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

test.describe('LLM - RAG - Local Files With Sources', () => {
  test('deve responder com base em arquivos locais e citar o arquivo correto', async () => {
    const client = new OpenAI();

    const fixturesPath = path.resolve('tests/llm/rag/fixtures');

    const documentDefinitions = [
      {
        id: 'DOC_LOGIN',
        fileName: 'login.md',
      },
      {
        id: 'DOC_SUPPORT',
        fileName: 'support.md',
      },
      {
        id: 'DOC_PAYMENT',
        fileName: 'payment.md',
      },
    ];

    const documents = documentDefinitions.map((document) => {
      const filePath = path.join(fixturesPath, document.fileName);

      return {
        ...document,
        filePath,
        text: fs.readFileSync(filePath, 'utf-8'),
      };
    });

    const question = 'Por quanto tempo a conta fica bloqueada após tentativas inválidas de login?';

    const maxWordsPerChunk = 20;
    const topK = 2;

    const chunks = documents.flatMap((document) =>
      splitIntoSentenceChunksWithLimit(document.text, maxWordsPerChunk).map((chunk, index) => ({
        documentId: document.id,
        fileName: document.fileName,
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

    console.log('\n=== Retrieved Chunks ===');

    for (const result of retrievedChunks) {
      console.log({
        fileName: result.fileName,
        chunkId: result.chunkId,
        similarity: result.similarity,
        text: result.text,
      });
    }

    const context = retrievedChunks
      .map((chunk) => `[Arquivo: ${chunk.fileName} | Chunk: ${chunk.chunkId}]\n${chunk.text}`)
      .join('\n\n');

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo. ' +
        'Ao final, informe apenas o nome do arquivo realmente utilizado no formato: ' +
        'Fonte: arquivo.ext.',
      input: `
Contexto:
${context}

Pergunta:
${question}
      `,
    });

    const answer = response.output_text.trim();

    console.log('\n=== Answer ===');
    console.log(answer);

    expect(retrievedChunks[0].fileName).toBe('login.md');

    expect(answer).toContain('30 minutos');

    expect(answer).toContain('Fonte: login.md');

    expect(answer).not.toContain('support.md');
    expect(answer).not.toContain('payment.md');
  });
});
