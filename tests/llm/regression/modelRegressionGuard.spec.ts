import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

type Evaluation = {
  overall: number;
  reason: string;
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

test.describe('LLM - Regression - Model Quality Guard', () => {
  test('deve impedir regressão de qualidade do modelo candidato além da tolerância permitida', async () => {
    test.setTimeout(120_000);

    const client = new OpenAI();

    const baselineModel = 'gpt-5.6-luna';
    const candidateModel = 'gpt-5.6-terra';
    const judgeModel = 'gpt-5.6-terra';

    const allowedRegression = 0.05;

    const question =
      'Por quanto tempo a conta fica bloqueada após cinco tentativas inválidas e o que acontece durante o bloqueio?';

    const context =
      'Após cinco tentativas inválidas de login, a conta é bloqueada por 30 minutos. ' +
      'Durante o bloqueio, novas tentativas de autenticação não são permitidas. ' +
      'O desbloqueio ocorre automaticamente após o término do período.';

    const referenceAnswer =
      'A conta fica bloqueada por 30 minutos. Durante esse período, novas tentativas de autenticação não são permitidas.';

    const baselineAnswer = await generateAnswer(client, baselineModel, question, context);

    const candidateAnswer = await generateAnswer(client, candidateModel, question, context);

    const baselineEvaluation = await evaluateAnswer(
      client,
      judgeModel,
      question,
      context,
      referenceAnswer,
      baselineAnswer
    );

    const candidateEvaluation = await evaluateAnswer(
      client,
      judgeModel,
      question,
      context,
      referenceAnswer,
      candidateAnswer
    );

    const minimumAcceptedCandidateScore = baselineEvaluation.overall - allowedRegression;

    console.log('\n=== Model Regression Guard ===');
    console.log({
      baselineModel,
      baselineAnswer,
      baselineScore: baselineEvaluation.overall,
      candidateModel,
      candidateAnswer,
      candidateScore: candidateEvaluation.overall,
      allowedRegression,
      minimumAcceptedCandidateScore,
    });

    expect(candidateEvaluation.overall).toBeGreaterThanOrEqual(minimumAcceptedCandidateScore);
  });
});
