import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - RAG - Basic Manual RAG', () => {
  test('deve recuperar contexto relevante e responder com base nele', async () => {
    const client = new OpenAI();

    const question =
      'O que acontece após cinco tentativas inválidas e por quanto tempo a conta fica bloqueada?';

    const documents = [
      {
        id: 'DOC_A',
        text: 'O suporte funciona de segunda a sexta-feira, das 09h às 18h.',
      },
      {
        id: 'DOC_B',
        text: 'Após cinco tentativas inválidas, a conta fica bloqueada por 30 minutos.',
      },
      {
        id: 'DOC_C',
        text: 'Usuários bloqueados não podem realizar novas tentativas até o fim do período de bloqueio.',
      },
      {
        id: 'DOC_D',
        text: 'O prazo médio inicial de resposta do suporte é de até 4 horas úteis.',
      },
    ];

    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: [question, ...documents.map((document) => document.text)],
    });

    const questionEmbedding = embeddingResponse.data[0].embedding;

    const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
      const dotProduct = vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);

      const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));

      const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

      return dotProduct / (magnitudeA * magnitudeB);
    };

    const rankedDocuments = documents
      .map((document, index) => ({
        ...document,
        similarity: cosineSimilarity(
          questionEmbedding,
          embeddingResponse.data[index + 1].embedding
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const retrievedDocuments = rankedDocuments.slice(0, 2);

    console.log(
      'Retrieved documents:',
      retrievedDocuments.map((document) => ({
        id: document.id,
        similarity: document.similarity,
      }))
    );

    const retrievedContext = retrievedDocuments
      .map((document) => `[${document.id}]\n${document.text}`)
      .join('\n\n');

    const response = await client.responses.create({
      model: 'gpt-5.6-luna',
      instructions:
        'Responda somente com base no contexto recuperado. ' +
        'Não utilize conhecimento externo e não invente informações. ' +
        'Responda objetivamente em português.',
      input: `
Contexto recuperado:
${retrievedContext}

Pergunta:
${question}
      `,
    });

    console.log('Embedding usage:', embeddingResponse.usage);
    console.log('LLM usage:', response.usage);
    console.log('Answer:', response.output_text);

    const answer = response.output_text.trim().toLowerCase();

    expect(retrievedDocuments[0].id).toBe('DOC_B');

    expect(retrievedDocuments.map((document) => document.id)).toContain('DOC_C');

    expect(answer).toContain('30 minutos');

    const blockedUserIndicators = [
      'não podem realizar novas tentativas',
      'não pode realizar novas tentativas',
      'não pode tentar novamente',
      'não podem tentar novamente',
      'não é possível realizar novas tentativas',
    ];

    const mentionsBlockedBehavior = blockedUserIndicators.some((indicator) =>
      answer.includes(indicator)
    );

    expect(mentionsBlockedBehavior).toBeTruthy();
  });
});
