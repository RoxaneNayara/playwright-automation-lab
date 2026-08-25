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

test.describe('LLM - RAG - End-to-End Quality', () => {
  test('deve validar retrieval, groundedness e fontes em uma resposta multi-source', async () => {
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

    const originalQuestion =
      'Por quanto tempo a conta fica bloqueada e qual é o prazo médio para a primeira resposta do suporte?';

    const subQuestions = [
      {
        question: 'Por quanto tempo a conta fica bloqueada após tentativas inválidas de login?',
        expectedChunkId: 'DOC_LOGIN_CHUNK_1',
      },
      {
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        expectedChunkId: 'DOC_SUPPORT_CHUNK_2',
      },
    ];

    const maxWordsPerChunk = 20;

    const chunks = documents.flatMap((document) =>
      splitIntoSentenceChunksWithLimit(document.text, maxWordsPerChunk).map((chunk, index) => ({
        documentId: document.id,
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

      return {
        question: item.question,
        expectedChunkId: item.expectedChunkId,
        topResult: ranking[0],
      };
    });

    console.log('\n=== Retrieval Results ===');

    for (const result of retrievalResults) {
      console.log({
        question: result.question,
        expectedChunkId: result.expectedChunkId,
        retrievedChunkId: result.topResult.chunkId,
        similarity: result.topResult.similarity,
      });
    }

    const retrievalHits = retrievalResults.filter(
      (result) => result.topResult.chunkId === result.expectedChunkId
    ).length;

    const retrievalAccuracy = retrievalHits / retrievalResults.length;

    console.log('\nRetrieval accuracy:', retrievalAccuracy);

    const uniqueRetrievedChunks = Array.from(
      new Map(
        retrievalResults.map((result) => [result.topResult.chunkId, result.topResult])
      ).values()
    );

    const context = uniqueRetrievedChunks
      .map((chunk) => `[${chunk.chunkId}]\n${chunk.text}`)
      .join('\n\n');

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto fornecido. ' +
        'Não utilize conhecimento externo. ' +
        'Combine todas as evidências necessárias para responder completamente. ' +
        'Não invente informações ausentes. ' +
        'Ao final, informe apenas as fontes realmente utilizadas no formato: ' +
        'Fontes: CHUNK_ID, CHUNK_ID.',
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

    expect(retrievalAccuracy).toBe(1);

    expect(uniqueRetrievedChunks.map((chunk) => chunk.chunkId)).toEqual(
      expect.arrayContaining(['DOC_LOGIN_CHUNK_1', 'DOC_SUPPORT_CHUNK_2'])
    );

    expect(answer).toContain('30 minutos');
    expect(answer).toContain('quatro horas úteis');

    expect(answer).toContain('DOC_LOGIN_CHUNK_1');
    expect(answer).toContain('DOC_SUPPORT_CHUNK_2');

    expect(answer).not.toContain('DOC_PAYMENT');

    const allowedFacts = ['30 minutos', 'quatro horas úteis'];

    const hasExpectedFacts = allowedFacts.every((fact) => answer.includes(fact));

    expect(hasExpectedFacts).toBeTruthy();
  });
});
