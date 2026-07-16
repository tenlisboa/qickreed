"use server";

import { generateQuiz, QuizGenerationError } from "@/lib/llm/quiz-schema";
import type {
  DashboardData,
  DashboardTimelinePoint,
  QuizData,
} from "@/types/database";
import { TextType as TextTypeEnum } from "@/types/database";
import type { ActionResult } from "@/utils/actions/types";
import { fail, ok } from "@/utils/actions/types";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";

const MIN_PASTE_CHARS = 200;
const MAX_PASTE_CHARS = 12_000;
const MAX_PASTE_WORDS = 5_000;

export interface PreparedTrainingText {
  textId: string;
  numWords: number;
  quiz: QuizData;
}

function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function deriveTitle(content: string): string {
  const firstLine = content.trim().split(/\r?\n/)[0]?.trim() ?? "";
  const base = firstLine || "Texto de treinamento";
  return base.length > 80 ? `${base.slice(0, 77)}...` : base;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const log = await getRequestLogger({ module: "getDashboardData" });
    log.error({ err: userError }, "Failed to get user");
    return null;
  }

  // Diagnostic sessions: wpm (PPM) + comprehension_score, ordered ascending by date.
  const { data: diagnostics, error: diagError } = await supabase
    .from("diagnostic_session")
    .select("id, wpm, comprehension_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (diagError) {
    const log = await getRequestLogger({ module: "getDashboardData" });
    log.error({ err: diagError }, "Failed to fetch diagnostic sessions");
    return null;
  }

  // Training sessions: target_wpm is the PPM exercised, ordered ascending by date.
  const { data: trainings, error: trainError } = await supabase
    .from("training_session")
    .select("id, target_wpm, comprehension_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (trainError) {
    const log = await getRequestLogger({ module: "getDashboardData" });
    log.error({ err: trainError }, "Failed to fetch training sessions");
    return null;
  }

  const hasAssessments = (diagnostics?.length ?? 0) > 0;

  if (!hasAssessments) {
    return {
      current_wpm: 0,
      current_comprehension: 0,
      target_wpm: 0,
      timeline: [],
      has_assessments: false,
    };
  }

  const timeline: DashboardTimelinePoint[] = [];

  for (const d of diagnostics ?? []) {
    timeline.push({
      date: d.created_at,
      ppm: typeof d.wpm === "number" ? d.wpm : Number(d.wpm),
      comprehension:
        Number(d.comprehension_score),
      type: "diagnostic",
    });
  }

  for (const t of trainings ?? []) {
    timeline.push({
      date: t.created_at,
      ppm: t.target_wpm,
      comprehension: Number(t.comprehension_score),
      type: "training",
    });
  }

  // Stable chronological ordering by date.
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  const latestDiagnostic = diagnostics?.[diagnostics.length - 1] ?? null;
  const currentWpm = latestDiagnostic?.wpm ? Number(latestDiagnostic.wpm) : 0;
  const currentComprehension = latestDiagnostic?.comprehension_score
    ? Number(latestDiagnostic.comprehension_score)
    : 0;
  const targetWpm = Math.round(currentWpm * 1.2);

  return {
    current_wpm: currentWpm,
    current_comprehension: currentComprehension,
    target_wpm: targetWpm,
    timeline,
    has_assessments: true,
  };
}

/**
 * QICA-15: User-facing training input.
 * Validates pasted text, generates a comprehension quiz via the LLM, and stores
 * a training-type text owned by the user. On success the dashboard enables the
 * "Start Training" button against the new text.
 *
 * Signature is compatible with `useActionState` (prevState, formData).
 */
export async function prepareTrainingText(
  _prevState: ActionResult<PreparedTrainingText> | null,
  formData: FormData,
): Promise<ActionResult<PreparedTrainingText>> {
  const supabase = await createClient();
  const log = await getRequestLogger({ module: "prepareTrainingText" });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    log.error({ err: userError }, "Failed to get user");
    return fail("unauthorized", "Usuário não autenticado", userError);
  }

  const content = String(formData.get("content") ?? "").trim();
  const language = String(formData.get("language") ?? "pt-BR") || "pt-BR";

  if (content.length < MIN_PASTE_CHARS) {
    return fail(
      "validation",
      `Cole um texto com pelo menos ${MIN_PASTE_CHARS} caracteres.`,
    );
  }
  if (content.length > MAX_PASTE_CHARS) {
    return fail(
      "validation",
      `Texto muito longo (máximo ${MAX_PASTE_CHARS} caracteres).`,
    );
  }

  const numWords = countWords(content);
  if (numWords < 5) {
    return fail("validation", "Texto insuficiente para gerar perguntas.");
  }
  if (numWords > MAX_PASTE_WORDS) {
    return fail(
      "validation",
      `Texto muito longo (máximo ${MAX_PASTE_WORDS} palavras).`,
    );
  }

  let quiz: QuizData;
  try {
    quiz = await generateQuiz(content, language);
  } catch (err) {
    log.error({ err }, "LLM quiz generation failed");
    if (err instanceof QuizGenerationError) {
      return fail(
        "unknown",
        "Não foi possível gerar as perguntas de compreensão. Tente novamente.",
        err,
      );
    }
    return fail("unknown", "Erro ao processar o texto. Tente novamente.", err);
  }

  const { data: text, error: insertError } = await supabase
    .from("text")
    .insert({
      type: TextTypeEnum.TRAINING,
      title: deriveTitle(content),
      content: content,
      num_words: numWords,
      quiz_json: quiz,
      language,
      user_id: user.id,
    })
    .select("id, num_words")
    .single();

  if (insertError || !text) {
    log.error({ err: insertError }, "Failed to insert training text");
    return fail(
      "db_error",
      "Erro ao salvar o texto de treinamento.",
      insertError,
    );
  }

  return ok({
    textId: text.id,
    numWords: text.num_words,
    quiz,
  });
}
