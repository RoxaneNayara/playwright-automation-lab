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

test.describe('LLM - RAG - Local Documents Retrieval', () => {
  test('deve recuperar o arquivo e o chunk mais relevantes a partir de documentos locais', async () => {
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

    const chunks = documents.flatMap((document) =>
      splitIntoSentenceChunksWithLimit(document.text, maxWordsPerChunk).map((chunk, index) => ({
        documentId: document.id,
        fileName: document.fileName,
        chunkId: `${document.id}_CHUNK_${index + 1}`,
        text: chunk,
      }))
    );

    console.log('Chunks from local files:', chunks);

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
        fileName: result.fileName,
        chunkId: result.chunkId,
        similarity: result.similarity,
        text: result.text,
      });
    }

    const topResult = ranking[0];

    console.log('\n=== Top Result ===');
    console.log(topResult);

    expect(topResult.fileName).toBe('login.md');

    expect(topResult.chunkId).toBe('DOC_LOGIN_CHUNK_1');

    expect(topResult.text).toContain('30 minutos');
  });
});
