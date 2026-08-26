import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

type ModelResult = {
  model: string;
  answer: string;
  totalTokens: number;
  durationMs: number;
};

type Evaluation = {
  overall: number;
  reason: string;
};

const generateAnswer = async (
  client: OpenAI,
  model: string,
  question: string,
  context: string
): Promise<ModelResult> => {
  const start = Date.now();

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

  return {
    model,
    answer: response.output_text.trim(),
    totalTokens: response.usage?.total_tokens ?? 0,
    durationMs: Date.now() - start,
  };
};

const evaluateAnswer = async (
  client: OpenAI,
  judgeModel: string,
  question: string,
  context: string,
  referenceAnswer: string,
  generatedAnswer: string
): Promise<{
  evaluation: Evaluation;
  totalTokens: number;
}> => {
  const response = await client.responses.create({
    model: judgeModel,
    instructions:
      'Você é um avaliador imparcial de respostas de um sistema RAG. ' +
      'Avalie a qualidade geral da resposta considerando correção factual, relevância e faithfulness. ' +
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

  return {
    evaluation: JSON.parse(response.output_text.trim()) as Evaluation,
    totalTokens: response.usage?.total_tokens ?? 0,
  };
};

test.describe('LLM - Regression - Model Comparison Dataset', () => {
  test('deve comparar modelos em múltiplos cenários e calcular métricas agregadas', async () => {
    test.setTimeout(180_000);

    const client = new OpenAI();

    const models = {
      luna: 'gpt-5.6-luna',
      terra: 'gpt-5.6-terra',
      judge: 'gpt-5.6-terra',
    };

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

    const results = [];

    for (const item of dataset) {
      const lunaResult = await generateAnswer(client, models.luna, item.question, item.context);

      const terraResult = await generateAnswer(client, models.terra, item.question, item.context);

      const lunaJudge = await evaluateAnswer(
        client,
        models.judge,
        item.question,
        item.context,
        item.referenceAnswer,
        lunaResult.answer
      );

      const terraJudge = await evaluateAnswer(
        client,
        models.judge,
        item.question,
        item.context,
        item.referenceAnswer,
        terraResult.answer
      );

      results.push({
        id: item.id,
        luna: {
          score: lunaJudge.evaluation.overall,
          durationMs: lunaResult.durationMs,
          generationTokens: lunaResult.totalTokens,
          judgeTokens: lunaJudge.totalTokens,
        },
        terra: {
          score: terraJudge.evaluation.overall,
          durationMs: terraResult.durationMs,
          generationTokens: terraResult.totalTokens,
          judgeTokens: terraJudge.totalTokens,
        },
      });
    }

    console.log('\n=== Model Comparison Dataset Results ===');
    console.log(results);

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;

    const lunaAverageScore = average(results.map((item) => item.luna.score));

    const terraAverageScore = average(results.map((item) => item.terra.score));

    const lunaAverageDuration = average(results.map((item) => item.luna.durationMs));

    const terraAverageDuration = average(results.map((item) => item.terra.durationMs));

    const lunaTotalTokens = results.reduce(
      (sum, item) => sum + item.luna.generationTokens + item.luna.judgeTokens,
      0
    );

    const terraTotalTokens = results.reduce(
      (sum, item) => sum + item.terra.generationTokens + item.terra.judgeTokens,
      0
    );

    const lunaWins = results.filter((item) => item.luna.score > item.terra.score).length;

    const terraWins = results.filter((item) => item.terra.score > item.luna.score).length;

    const ties = results.filter((item) => item.luna.score === item.terra.score).length;

    const summary = {
      lunaAverageScore,
      terraAverageScore,
      lunaAverageDuration,
      terraAverageDuration,
      lunaTotalTokens,
      terraTotalTokens,
      lunaWins,
      terraWins,
      ties,
    };

    console.log('\n=== Model Comparison Summary ===');
    console.log(summary);

    expect(results).toHaveLength(dataset.length);

    expect(lunaAverageScore).toBeGreaterThanOrEqual(0.8);
    expect(terraAverageScore).toBeGreaterThanOrEqual(0.8);

    expect(lunaTotalTokens).toBeGreaterThan(0);
    expect(terraTotalTokens).toBeGreaterThan(0);
  });
});
