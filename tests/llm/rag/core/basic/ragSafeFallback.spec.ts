import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

const buildSafeAnswer = async (
  client: OpenAI,
  question: string,
  relevantDocuments: Array<{
    id: string;
    text: string;
    similarity: number;
  }>
): Promise<string> => {
  if (relevantDocuments.length === 0) {
    return 'Não há contexto suficiente para responder com segurança.';
  }

  const retrievedContext = relevantDocuments
    .map((document) => `[${document.id}]\n${document.text}`)
    .join('\n\n');

  const response = await client.responses.create({
    model: 'gpt-5.6-luna',
    instructions:
      'Responda somente com base no contexto recuperado. ' +
      'Não utilize conhecimento externo e não invente informações.',
    input: `
Contexto recuperado:
${retrievedContext}

Pergunta:
${question}
    `,
  });

  return response.output_text.trim();
};

test.describe('LLM - RAG - Safe Fallback', () => {
  test('deve retornar fallback seguro quando nenhum documento atingir relevância mínima', async () => {
    const client = new OpenAI();

    const question =
      'Qual é a política de reembolso para compras realizadas com cartão de crédito?';

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

    console.log(
      'Ranking:',
      rankedDocuments.map((document) => ({
        id: document.id,
        similarity: document.similarity,
      }))
    );

    const similarityThreshold = 0.6;

    const relevantDocuments = rankedDocuments.filter(
      (document) => document.similarity >= similarityThreshold
    );

    const finalAnswer = await buildSafeAnswer(client, question, relevantDocuments);

    console.log('Final answer:', finalAnswer);

    expect(relevantDocuments).toHaveLength(0);

    expect(finalAnswer).toBe('Não há contexto suficiente para responder com segurança.');
  });
});
