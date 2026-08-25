import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

const splitLongSentence = (sentence: string, maxWordsPerChunk: number): string[] => {
  const words = sentence.split(' ');
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += maxWordsPerChunk) {
    chunks.push(words.slice(index, index + maxWordsPerChunk).join(' '));
  }

  return chunks;
};

const splitLongSentenceWithOverlap = (
  sentence: string,
  maxWordsPerChunk: number,
  overlap: number
): string[] => {
  if (overlap >= maxWordsPerChunk) {
    throw new Error('Overlap must be smaller than maxWordsPerChunk.');
  }

  const words = sentence.split(' ');
  const chunks: string[] = [];
  const step = maxWordsPerChunk - overlap;

  for (let index = 0; index < words.length; index += step) {
    chunks.push(words.slice(index, index + maxWordsPerChunk).join(' '));
  }

  return chunks;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);

  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));

  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  return dotProduct / (magnitudeA * magnitudeB);
};

test.describe('LLM - RAG - Fallback Overlap Boundary Dataset', () => {
  test('deve comparar overlap em múltiplas perguntas de fronteira', async () => {
    const client = new OpenAI();

    const sentence =
      'Após cinco tentativas inválidas de login consecutivas realizadas pelo mesmo usuário, a conta é bloqueada automaticamente por 30 minutos antes de permitir novas tentativas de autenticação e o acesso é liberado sem intervenção manual quando o período de bloqueio termina.';

    const maxWordsPerChunk = 20;
    const overlap = 4;

    const questions = [
      {
        question: 'Por quanto tempo a conta permanece bloqueada?',
        evidence: '30 minutos',
      },
      {
        question: 'Quando o usuário pode tentar autenticar novamente?',
        evidence: 'permitir novas tentativas de autenticação',
      },
      {
        question: 'O desbloqueio exige intervenção manual?',
        evidence: 'sem intervenção manual',
      },
    ];

    const chunksWithoutOverlap = splitLongSentence(sentence, maxWordsPerChunk);

    const chunksWithOverlap = splitLongSentenceWithOverlap(sentence, maxWordsPerChunk, overlap);

    console.log('Without overlap:', chunksWithoutOverlap);
    console.log('With overlap:', chunksWithOverlap);

    const allTexts = [
      ...questions.map((item) => item.question),
      ...chunksWithoutOverlap,
      ...chunksWithOverlap,
    ];

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: allTexts,
    });

    const embeddings = embeddingResponse.data.map((item) => item.embedding);

    const questionEmbeddings = embeddings.slice(0, questions.length);

    const withoutOverlapStart = questions.length;
    const withoutOverlapEnd = withoutOverlapStart + chunksWithoutOverlap.length;

    const withoutOverlapEmbeddings = embeddings.slice(withoutOverlapStart, withoutOverlapEnd);

    const withOverlapEmbeddings = embeddings.slice(withoutOverlapEnd);

    const results = questions.map((item, questionIndex) => {
      const questionEmbedding = questionEmbeddings[questionIndex];

      const withoutOverlapRanking = chunksWithoutOverlap
        .map((chunk, index) => ({
          chunk,
          similarity: cosineSimilarity(questionEmbedding, withoutOverlapEmbeddings[index]),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      const withOverlapRanking = chunksWithOverlap
        .map((chunk, index) => ({
          chunk,
          similarity: cosineSimilarity(questionEmbedding, withOverlapEmbeddings[index]),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      const topWithoutOverlap = withoutOverlapRanking[0];
      const topWithOverlap = withOverlapRanking[0];

      return {
        question: item.question,
        evidence: item.evidence,

        withoutOverlap: {
          chunk: topWithoutOverlap.chunk,
          similarity: topWithoutOverlap.similarity,
          hasEvidence: topWithoutOverlap.chunk.includes(item.evidence),
        },

        withOverlap: {
          chunk: topWithOverlap.chunk,
          similarity: topWithOverlap.similarity,
          hasEvidence: topWithOverlap.chunk.includes(item.evidence),
        },
      };
    });

    console.log('\n=== Boundary Dataset Results ===');

    for (const result of results) {
      console.log('\nQuestion:', result.question);

      console.log('Without overlap:', result.withoutOverlap);
      console.log('With overlap:', result.withOverlap);
    }

    const withoutOverlapEvidenceHits = results.filter(
      (result) => result.withoutOverlap.hasEvidence
    ).length;

    const withOverlapEvidenceHits = results.filter(
      (result) => result.withOverlap.hasEvidence
    ).length;

    const overlapSimilarityWins = results.filter(
      (result) => result.withOverlap.similarity > result.withoutOverlap.similarity
    ).length;

    console.log('\n=== Summary ===');
    console.log('Without overlap evidence hits:', withoutOverlapEvidenceHits);
    console.log('With overlap evidence hits:', withOverlapEvidenceHits);
    console.log('Overlap similarity wins:', overlapSimilarityWins);

    expect(results).toHaveLength(questions.length);

    expect(withoutOverlapEvidenceHits).toBeGreaterThan(0);
    expect(withOverlapEvidenceHits).toBeGreaterThan(0);

    expect(overlapSimilarityWins).toBeGreaterThanOrEqual(0);
    expect(overlapSimilarityWins).toBeLessThanOrEqual(questions.length);
  });
});
