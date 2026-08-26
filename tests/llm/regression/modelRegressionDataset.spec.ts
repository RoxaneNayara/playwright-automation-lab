import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

type Evaluation = {
  overall: number;
  reason: string;
};

type RegressionResult = {
  id: string;
  baselineScore: number;
  candidateScore: number;
  difference: number;
  regressed: boolean;
};

const generateAnswer = async (
  client: OpenAI,
  model: string,
  question: string,
  context: string
): Promise<string> => {
  const response = await client.responses.create({
    model,
    instructions:
      'Responda somente com base no contexto fornecido. ' +
      'Não utilize conhecimento externo. Seja direto e objetivo.',
    input: `
Contexto:
${context}

Pergunta:
${question}
    `,
  });

  return response.output_text.trim();
};

const evaluateAnswer = async (
  client: OpenAI,
  judgeModel: string,
  question: string,
  context: string,
  referenceAnswer: string,
  generatedAnswer: string
): Promise<Evaluation> => {
  const response = await client.responses.create({
    model: judgeModel,
    instructions:
      'Você é um avaliador imparcial de respostas de um sistema RAG. ' +
      'Avalie a qualidade geral considerando correção factual, relevância e faithfulness. ' +
      'Retorne somente JSON válido no formato: ' +
      '{"overall": number, "reason": string}. ' +
      'O score deve variar de 0 a 1.',
    input: `
Pergunta:
${question}

Contexto:
${context}

Resposta de referência:
${referenceAnswer}

Resposta avaliada:
${generatedAnswer}
    `,
  });

  return JSON.parse(response.output_text.trim()) as Evaluation;
};

const average = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

test.describe('LLM - Regression - Model Regression Dataset', () => {
  test('deve impedir regressão média e individual além da tolerância permitida', async () => {
    test.setTimeout(180_000);

    const client = new OpenAI();

    const baselineModel = 'gpt-5.6-luna';
    const candidateModel = 'gpt-5.6-terra';
    const judgeModel = 'gpt-5.6-terra';

    const allowedRegression = 0.05;

    const dataset = [
      {
        id: 'CASE_1',
        question: 'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas?',
        context: 'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos.',
        referenceAnswer: 'A conta fica bloqueada por 30 minutos.',
      },
      {
        id: 'CASE_2',
        question: 'O que acontece durante o período de bloqueio da conta?',
        context:
          'Durante o bloqueio, novas tentativas de autenticação não são permitidas. ' +
          'O desbloqueio ocorre automaticamente após o término do período.',
        referenceAnswer: 'Durante o bloqueio, novas tentativas de autenticação não são permitidas.',
      },
      {
        id: 'CASE_3',
        question: 'Qual é o prazo médio para a primeira resposta do suporte?',
        context: 'O prazo médio para a primeira resposta é de até quatro horas úteis.',
        referenceAnswer: 'O prazo médio para a primeira resposta é de até quatro horas úteis.',
      },
      {
        id: 'CASE_4',
        question: 'Em quais dias e horários o suporte funciona?',
        context: 'O suporte funciona de segunda a sexta das 8h às 18h.',
        referenceAnswer: 'O suporte funciona de segunda a sexta das 8h às 18h.',
      },
    ];

    const results: RegressionResult[] = [];

    for (const item of dataset) {
      const baselineAnswer = await generateAnswer(
        client,
        baselineModel,
        item.question,
        item.context
      );

      const candidateAnswer = await generateAnswer(
        client,
        candidateModel,
        item.question,
        item.context
      );

      const baselineEvaluation = await evaluateAnswer(
        client,
        judgeModel,
        item.question,
        item.context,
        item.referenceAnswer,
        baselineAnswer
      );

      const candidateEvaluation = await evaluateAnswer(
        client,
        judgeModel,
        item.question,
        item.context,
        item.referenceAnswer,
        candidateAnswer
      );

      const difference = candidateEvaluation.overall - baselineEvaluation.overall;

      const regressed =
        candidateEvaluation.overall < baselineEvaluation.overall - allowedRegression;

      results.push({
        id: item.id,
        baselineScore: baselineEvaluation.overall,
        candidateScore: candidateEvaluation.overall,
        difference,
        regressed,
      });
    }

    console.log('\n=== Regression Dataset Results ===');
    console.log(results);

    const baselineAverageScore = average(results.map((item) => item.baselineScore));

    const candidateAverageScore = average(results.map((item) => item.candidateScore));

    const minimumAcceptedAverageScore = baselineAverageScore - allowedRegression;

    const regressedCases = results.filter((item) => item.regressed);

    const summary = {
      baselineModel,
      candidateModel,
      baselineAverageScore,
      candidateAverageScore,
      allowedRegression,
      minimumAcceptedAverageScore,
      regressedCases: regressedCases.map((item) => item.id),
      totalRegressions: regressedCases.length,
    };

    console.log('\n=== Regression Dataset Summary ===');
    console.log(summary);

    expect(results).toHaveLength(dataset.length);

    expect(candidateAverageScore).toBeGreaterThanOrEqual(minimumAcceptedAverageScore);

    expect(regressedCases).toHaveLength(0);
  });
});
