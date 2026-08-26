import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

type ModelResult = {
  model: string;
  answer: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
};

type Evaluation = {
  correctness: number;
  relevance: number;
  faithfulness: number;
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

  const durationMs = Date.now() - start;

  return {
    model,
    answer: response.output_text.trim(),
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
    durationMs,
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
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}> => {
  const response = await client.responses.create({
    model: judgeModel,
    instructions:
      'Você é um avaliador imparcial de respostas de um sistema RAG. ' +
      'Avalie correctness, relevance e faithfulness separadamente. ' +
      'Cada score deve variar de 0 a 1. ' +
      'Calcule também um score overall de 0 a 1. ' +
      'Não favoreça estilos de escrita específicos. ' +
      'Retorne somente JSON válido no formato: ' +
      '{"correctness": number, "relevance": number, "faithfulness": number, "overall": number, "reason": string}.',
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
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    totalTokens: response.usage?.total_tokens ?? 0,
  };
};

test.describe('LLM - Regression - Model Comparison', () => {
  test('deve comparar qualidade, latência e consumo de tokens entre modelos', async () => {
    test.setTimeout(120_000);

    const client = new OpenAI();

    const question =
      'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas e o que acontece durante o bloqueio?';

    const context =
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, novas tentativas de autenticação não são permitidas. ' +
      'O desbloqueio ocorre automaticamente após o término do período.';

    const referenceAnswer =
      'A conta fica bloqueada por 30 minutos. Durante esse período, novas tentativas de autenticação não são permitidas.';

    const lunaResult = await generateAnswer(client, 'gpt-5.6-luna', question, context);

    const terraResult = await generateAnswer(client, 'gpt-5.6-terra', question, context);

    const lunaJudge = await evaluateAnswer(
      client,
      'gpt-5.6-terra',
      question,
      context,
      referenceAnswer,
      lunaResult.answer
    );

    const terraJudge = await evaluateAnswer(
      client,
      'gpt-5.6-terra',
      question,
      context,
      referenceAnswer,
      terraResult.answer
    );

    console.log('\n=== Luna ===');
    console.log({
      answer: lunaResult.answer,
      evaluation: lunaJudge.evaluation,
      generationTokens: lunaResult.totalTokens,
      judgeTokens: lunaJudge.totalTokens,
      durationMs: lunaResult.durationMs,
    });

    console.log('\n=== Terra ===');
    console.log({
      answer: terraResult.answer,
      evaluation: terraJudge.evaluation,
      generationTokens: terraResult.totalTokens,
      judgeTokens: terraJudge.totalTokens,
      durationMs: terraResult.durationMs,
    });

    const totalExperimentTokens =
      lunaResult.totalTokens +
      terraResult.totalTokens +
      lunaJudge.totalTokens +
      terraJudge.totalTokens;

    console.log('\n=== Comparison ===');
    console.log({
      lunaOverall: lunaJudge.evaluation.overall,
      terraOverall: terraJudge.evaluation.overall,
      lunaDurationMs: lunaResult.durationMs,
      terraDurationMs: terraResult.durationMs,
      totalExperimentTokens,
    });

    expect(lunaJudge.evaluation.overall).toBeGreaterThanOrEqual(0.8);
    expect(terraJudge.evaluation.overall).toBeGreaterThanOrEqual(0.8);

    expect(lunaResult.totalTokens).toBeGreaterThan(0);
    expect(terraResult.totalTokens).toBeGreaterThan(0);

    expect(totalExperimentTokens).toBeGreaterThan(0);
  });
});
