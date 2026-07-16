"use server";

import { revalidatePath } from "next/cache";
import {
  calculateComprehensionResult,
  isPassingComprehension,
} from "@/lib/utils";
import type {
  QuizData,
  Text,
  TrainingHistory,
  TrainingSessionResult,
  TrainingType,
} from "@/types/database";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";

function toTrainingHistory(row: {
  id: string;
  training_type: TrainingType;
  target_wpm: number;
  duration_time_s: number;
  comprehension_score: number | null;
  passed: boolean | null;
  created_at: string;
  text?: { title: string } | null;
}): TrainingHistory {
  return {
    id: row.id,
    training_type: row.training_type,
    target_wpm: row.target_wpm,
    duration_time_s: row.duration_time_s,
    comprehension_score: row.comprehension_score,
    passed: row.passed,
    created_at: row.created_at,
    text_title: row.text?.title || "Texto não encontrado",
  };
}

export async function getTrainingHistory(): Promise<TrainingHistory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("training_session")
    .select(
      `
      id,
      training_type,
      target_wpm,
      duration_time_s,
      comprehension_score,
      passed,
      created_at,
      text:text_id (
        title
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    const log = await getRequestLogger({ module: "getTrainingHistory" });
    log.error({ err: error }, "Failed to fetch training history");
    return [];
  }

  return (data ?? []).map((session) =>
    toTrainingHistory({
      id: session.id,
      training_type: session.training_type as TrainingType,
      target_wpm: session.target_wpm,
      duration_time_s: session.duration_time_s,
      comprehension_score: session.comprehension_score ?? null,
      passed: session.passed ?? null,
      created_at: session.created_at,
      text: session.text as unknown as { title: string } | null,
    }),
  );
}

export async function getRandomTrainingText(): Promise<Text | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text")
    .select("*")
    .eq("type", "training")
    .order("random()")
    .limit(1)
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "getRandomTrainingText" });
    log.error({ err: error }, "Failed to fetch random training text");
    return null;
  }

  return data;
}

export async function createTrainingSession(
  textId: string,
  trainingType: TrainingType,
  targetWpm: number,
  durationSeconds: number,
): Promise<string | null> {
  const supabase = await createClient();
  const log = await getRequestLogger({ module: "createTrainingSession" });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    log.error({ err: userError }, "Failed to get user");
    return null;
  }

  const { data, error } = await supabase
    .from("training_session")
    .insert({
      user_id: user.id,
      text_id: textId,
      training_type: trainingType,
      target_wpm: targetWpm,
      duration_time_s: durationSeconds,
    })
    .select("id")
    .single();

  if (error) {
    log.error({ err: error }, "Failed to create training session");
    return null;
  }

  revalidatePath("/training");
  return data.id;
}

export async function getLastDiagnosticWpm(): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("diagnostic_session")
    .select("wpm")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "getLastDiagnosticWpm" });
    log.error({ err: error }, "Failed to fetch last diagnostic WPM");
    return null;
  }

  return data?.wpm ? Number(data.wpm) : null;
}

export async function getTrainingSessionById(
  sessionId: string,
): Promise<TrainingHistory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("training_session")
    .select(
      `
      id,
      training_type,
      target_wpm,
      duration_time_s,
      comprehension_score,
      passed,
      created_at,
      text:text_id (
        title
      )
    `,
    )
    .eq("id", sessionId)
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "getTrainingSessionById" });
    log.error({ err: error }, "Failed to fetch training session");
    return null;
  }

  return toTrainingHistory({
    id: data.id,
    training_type: data.training_type as TrainingType,
    target_wpm: data.target_wpm,
    duration_time_s: data.duration_time_s,
    comprehension_score: data.comprehension_score ?? null,
    passed: data.passed ?? null,
    created_at: data.created_at,
    text: data.text as unknown as { title: string } | null,
  });
}

export async function getTrainingSessionResult(
  sessionId: string,
): Promise<TrainingSessionResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("training_session")
    .select(
      `
      id,
      target_wpm,
      duration_time_s,
      comprehension_score,
      passed,
      created_at,
      text:text_id (
        title
      )
    `,
    )
    .eq("id", sessionId)
    .single();

  if (error) {
    const log = await getRequestLogger({
      module: "getTrainingSessionResult",
    });
    log.error({ err: error }, "Failed to fetch training session result");
    return null;
  }

  const targetWpm = data.target_wpm;
  const passed = data.passed;
  const comprehension = data.comprehension_score
    ? Number(data.comprehension_score)
    : null;

  // next_target_wpm = passed ? target_wpm : target_wpm * 0.9
  const nextTargetWpm =
    passed === true
      ? targetWpm
      : passed === false
        ? Math.round(targetWpm * 0.9)
        : targetWpm;

  return {
    id: data.id,
    text_title:
      (data.text as unknown as { title: string } | null)?.title ||
      "Texto não encontrado",
    target_wpm: targetWpm,
    duration_time_s: data.duration_time_s,
    comprehension_score: comprehension,
    passed,
    next_target_wpm: nextTargetWpm,
    created_at: data.created_at,
  };
}

export async function getTextQuizData(
  textId: string,
): Promise<QuizData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text")
    .select("quiz_json")
    .eq("id", textId)
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "getTextQuizData" });
    log.error({ err: error }, "Failed to fetch text quiz_json");
    return null;
  }

  return (data.quiz_json as QuizData | null) ?? null;
}

export async function getTrainingSessionDetails(sessionId: string): Promise<{
  text_id: string;
  target_wpm: number;
  text_title: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("training_session")
    .select(
      `
      text_id,
      target_wpm,
      text:text_id (
        title
      )
    `,
    )
    .eq("id", sessionId)
    .single();

  if (error) {
    const log = await getRequestLogger({
      module: "getTrainingSessionDetails",
    });
    log.error({ err: error }, "Failed to fetch training session details");
    return null;
  }

  return {
    text_id: data.text_id,
    target_wpm: data.target_wpm,
    text_title:
      (data.text as unknown as { title: string } | null)?.title ||
      "Texto não encontrado",
  };
}

export async function calculateServerScore(
  quizData: QuizData,
  answers: Record<number, number>,
): Promise<number> {
  if (!quizData.questions.length) return 0;
  let correct = 0;
  for (const question of quizData.questions) {
    if (answers[question.id] === question.correct) {
      correct++;
    }
  }
  return (correct / quizData.questions.length) * 100;
}

export async function submitTrainingQuiz(
  sessionId: string,
  answers: Record<number, number>,
): Promise<{
  success: boolean;
  error?: string;
  result?: TrainingSessionResult;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const log = await getRequestLogger({ module: "submitTrainingQuiz" });
    log.error({ err: userError }, "Failed to get user");
    return { success: false, error: "Usuário não autenticado" };
  }

  const { data: session, error: sessionError } = await supabase
    .from("training_session")
    .select(
      `
      id,
      target_wpm,
      text_id,
      text:text_id (
        title,
        quiz_json
      )
    `,
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    const log = await getRequestLogger({ module: "submitTrainingQuiz" });
    log.error({ err: sessionError }, "Failed to fetch training session");
    return { success: false, error: "Sessão de treinamento não encontrada" };
  }

  const quizJson = (
    session.text as unknown as { quiz_json: QuizData | null } | null
  )?.quiz_json;
  if (!quizJson || !quizJson.questions || !quizJson.questions.length) {
    return { success: false, error: "Quiz não disponível para este texto" };
  }

  const score = await calculateServerScore(quizJson, answers);
  const passed = isPassingComprehension(score);
  const { newTargetWpm } = calculateComprehensionResult(
    score,
    session.target_wpm,
  );

  const { error: updateError } = await supabase
    .from("training_session")
    .update({
      comprehension_score: Math.round(score * 100) / 100,
      passed,
    })
    .eq("id", sessionId);

  if (updateError) {
    const log = await getRequestLogger({ module: "submitTrainingQuiz" });
    log.error({ err: updateError }, "Failed to update training session");
    return { success: false, error: "Erro ao salvar resultados do quiz" };
  }

  if (passed) {
    const { error: benchError } = await supabase
      .from("profiles")
      .update({ benchmark_wpm: session.target_wpm })
      .eq("id", user.id);

    if (benchError) {
      const log = await getRequestLogger({ module: "submitTrainingQuiz" });
      log.error({ err: benchError }, "Failed to update benchmark_wpm");
    }
  } else {
    const { error: benchError } = await supabase
      .from("profiles")
      .update({ benchmark_wpm: newTargetWpm })
      .eq("id", user.id);

    if (benchError) {
      const log = await getRequestLogger({ module: "submitTrainingQuiz" });
      log.error({ err: benchError }, "Failed to update benchmark_wpm");
    }
  }

  revalidatePath("/training");
  revalidatePath("/dashboard");

  return {
    success: true,
    result: {
      id: sessionId,
      text_title:
        (session.text as unknown as { title: string } | null)?.title ||
        "Texto não encontrado",
      target_wpm: session.target_wpm,
      duration_time_s: 0,
      comprehension_score: Math.round(score * 100) / 100,
      passed,
      next_target_wpm: newTargetWpm,
      created_at: new Date().toISOString(),
    },
  };
}

export async function getBenchmarkWpm(): Promise<number | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const log = await getRequestLogger({ module: "getBenchmarkWpm" });
    log.error({ err: userError }, "Failed to get user");
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("benchmark_wpm")
    .eq("id", user.id)
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "getBenchmarkWpm" });
    log.error({ err: error }, "Failed to fetch benchmark_wpm");
    return null;
  }

  return data?.benchmark_wpm ?? null;
}

export async function getTrainingTextTitle(
  textId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text")
    .select("title")
    .eq("id", textId)
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "getTrainingTextTitle" });
    log.error({ err: error }, "Failed to fetch text title");
    return null;
  }

  return data?.title ?? null;
}
