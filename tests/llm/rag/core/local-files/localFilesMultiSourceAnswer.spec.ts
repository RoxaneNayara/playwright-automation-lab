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

test.describe('LLM - RAG - Local Files Multi Source Answer', () => {
  test('deve combinar informações de arquivos locais diferentes e citar ambas as fontes', async () => {
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

    const originalQuestion =
      'Por quanto tempo a conta fica bloqueada e qual é o prazo médio para a primeira resposta do suporte?';

    const subQuestions = [
      {
        question: 'Por quanto tempo a conta fica bloqueada após tentativas inválidas de login?',
        expectedFileName: 'login.md',
      },
      {
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        expectedFileName: 'support.md',
      },
    ];

    const maxWordsPerChunk = 20;

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
      input: [...subQuestions.map((item) => item.question), ...chunks.map((chunk) => chunk.text)],
    });

    const embeddings = embeddingResponse.data.map((item) => item.embedding);

    const questionEmbeddings = embeddings.slice(0, subQuestions.length);

    const chunkEmbeddings = embeddings.slice(subQuestions.length);

    const retrievalResults = subQuestions.map((item, questionIndex) => {
      const ranking = chunks
        .map((chunk, chunkIndex) => ({
          ...chunk,
          similarity: cosineSimilarity(
            questionEmbeddings[questionIndex],
            chunkEmbeddings[chunkIndex]
          ),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      const topResult = ranking[0];

      console.log('\nSub-question:', item.question);
      console.log('Top result:', topResult);

      return {
        ...item,
        topResult,
      };
    });

    const uniqueRetrievedChunks = Array.from(
      new Map(
        retrievalResults.map((result) => [result.topResult.chunkId, result.topResult])
      ).values()
    );

    console.log('\n=== Retrieved Local File Chunks ===', uniqueRetrievedChunks);

    const context = uniqueRetrievedChunks
      .map((chunk) => `[Arquivo: ${chunk.fileName} | Chunk: ${chunk.chunkId}]\n${chunk.text}`)
      .join('\n\n');

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Combine todas as informações necessárias para responder completamente. ' +
        'Não utilize conhecimento externo. ' +
        'Ao final, informe apenas os nomes dos arquivos realmente utilizados no formato: ' +
        'Fontes: arquivo.ext, arquivo.ext.',
      input: `
Contexto:
${context}

Pergunta:
${originalQuestion}
      `,
    });

    const answer = response.output_text.trim();

    console.log('\n=== Answer ===');
    console.log(answer);

    expect(retrievalResults[0].topResult.fileName).toBe('login.md');

    expect(retrievalResults[1].topResult.fileName).toBe('support.md');

    expect(answer).toContain('30 minutos');
    expect(answer).toContain('quatro horas úteis');

    expect(answer).toContain('login.md');
    expect(answer).toContain('support.md');

    expect(answer).not.toContain('payment.md');
  });
});
