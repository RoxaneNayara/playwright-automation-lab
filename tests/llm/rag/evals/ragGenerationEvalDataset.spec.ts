import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

type EvaluationResult = {
  score: number;
  reason: string;
};

const evaluate = async (
  client: OpenAI,
  metric: 'correctness' | 'relevance' | 'faithfulness' | 'contextRelevance',
  question: string,
  context: string,
  referenceAnswer: string,
  generatedAnswer: string
): Promise<EvaluationResult> => {
  const instructionsByMetric = {
    correctness:
      'Avalie a correção factual da resposta gerada em relação à pergunta, ao contexto e à resposta de referência.',
    relevance:
      'Avalie se a resposta gerada responde diretamente ao que foi perguntado, com foco e sem informações desnecessárias.',
    faithfulness:
      'Avalie se todas as afirmações da resposta gerada são sustentadas pelo contexto fornecido.',
    contextRelevance:
      'Avalie se o contexto fornecido contém informação útil e diretamente relacionada para responder à pergunta.',
  };

  const response = await client.responses.create({
    model: 'gpt-5.6-luna',
    instructions:
      'Você é um avaliador de qualidade de um sistema RAG. ' +
      instructionsByMetric[metric] +
      ' Retorne somente JSON válido no formato: ' +
      '{"score": number, "reason": string}. ' +
      'O score deve variar de 0 a 1.',
    input: `
Pergunta:
${question}

Contexto:
${context}

Resposta de referência:
${referenceAnswer}

Resposta gerada:
${generatedAnswer}
    `,
  });

  return JSON.parse(response.output_text.trim()) as EvaluationResult;
};

test.describe('LLM - RAG Evals - Generation Dataset', () => {
  test('deve avaliar múltiplos casos e calcular métricas agregadas', async () => {
    test.setTimeout(120_000);
    const client = new OpenAI();

    const dataset = [
      {
        id: 'CASE_1',
        question: 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?',
        context: 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.',
        referenceAnswer: 'A conta fica bloqueada por 30 minutos.',
        generatedAnswer: 'A conta permanece bloqueada durante meia hora.',
      },
      {
        id: 'CASE_2',
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        context: 'O prazo médio para a primeira resposta é de até quatro horas úteis.',
        referenceAnswer: 'O prazo médio é de até quatro horas úteis.',
        generatedAnswer: 'O suporte responde em até quatro horas úteis.',
      },
      {
        id: 'CASE_3',
        question: 'Por quanto tempo a conta fica bloqueada?',
        context: 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.',
        referenceAnswer: 'A conta fica bloqueada por 30 minutos.',
        generatedAnswer:
          'A conta fica bloqueada por 30 minutos e o usuário recebe um e-mail automático.',
      },
      {
        id: 'CASE_4',
        question: 'Por quanto tempo a conta fica bloqueada?',
        context: 'O suporte funciona de segunda a sexta das 8h às 18h.',
        referenceAnswer: 'A conta fica bloqueada por 30 minutos.',
        generatedAnswer: 'A conta fica bloqueada por 30 minutos.',
      },
    ];

    const results = [];

    for (const item of dataset) {
      const correctness = await evaluate(
        client,
        'correctness',
        item.question,
        item.context,
        item.referenceAnswer,
        item.generatedAnswer
      );

      const relevance = await evaluate(
        client,
        'relevance',
        item.question,
        item.context,
        item.referenceAnswer,
        item.generatedAnswer
      );

      const faithfulness = await evaluate(
        client,
        'faithfulness',
        item.question,
        item.context,
        item.referenceAnswer,
        item.generatedAnswer
      );

      const contextRelevance = await evaluate(
        client,
        'contextRelevance',
        item.question,
        item.context,
        item.referenceAnswer,
        item.generatedAnswer
      );

      results.push({
        id: item.id,
        correctness: correctness.score,
        relevance: relevance.score,
        faithfulness: faithfulness.score,
        contextRelevance: contextRelevance.score,
      });
    }

    console.log('\n=== Generation Eval Results ===');
    console.log(results);

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    const summary = {
      correctness: average(results.map((item) => item.correctness)),
      relevance: average(results.map((item) => item.relevance)),
      faithfulness: average(results.map((item) => item.faithfulness)),
      contextRelevance: average(results.map((item) => item.contextRelevance)),
    };

    console.log('\n=== Generation Eval Summary ===');
    console.log(summary);

    expect(results).toHaveLength(dataset.length);

    expect(summary.correctness).toBeGreaterThanOrEqual(0.7);
    expect(summary.relevance).toBeGreaterThanOrEqual(0.7);
    expect(summary.faithfulness).toBeGreaterThanOrEqual(0.6);
    expect(summary.contextRelevance).toBeGreaterThanOrEqual(0.5);
  });
});
