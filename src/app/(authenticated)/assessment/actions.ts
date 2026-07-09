"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { ok, fail } from "@/utils/actions/types";
import type {
  Text,
  DiagnosticSession,
  AssessmentResult,
  UserAssessmentHistory,
} from "@/types/database";
import type { ActionResult } from "@/utils/actions/types";

export async function getRandomDiagnosticText(): Promise<ActionResult<Text>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text")
    .select("*")
    .eq("type", "diagnostic")
    .eq("language", "pt-BR")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const log = await getRequestLogger({ module: "getRandomDiagnosticText" });
    log.error({ err: error }, "Failed to fetch diagnostic text");
    return fail("db_error", "Erro ao carregar texto de avaliação", error);
  }

  if (!data) {
    return fail("not_found", "Nenhum texto de avaliação disponível");
  }

  return ok(data);
}

export async function saveDiagnosticSession(
  textId: string,
  readingTimeMs: number,
  comprehensionScore: number
): Promise<ActionResult<AssessmentResult>> {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const log = await getRequestLogger({ module: "saveDiagnosticSession" });
    log.error({ err: userError }, "Failed to get user");
    return fail("unauthorized", "Usuário não autenticado", userError);
  }

  // Get text data for calculations
  const { data: text, error: textError } = await supabase
    .from("text")
    .select("num_words, title")
    .eq("id", textId)
    .single();

  if (textError || !text) {
    const log = await getRequestLogger({ module: "saveDiagnosticSession" });
    log.error({ err: textError }, "Failed to fetch text data");
    return fail("not_found", "Texto não encontrado", textError);
  }

  // Calculate WPM
  const wpm = (text.num_words / readingTimeMs) * 60000;

  // Calculate target WPM (+20%)
  const targetWpm = Math.round(wpm * 1.2);

  // Save diagnostic session
  const { data: session, error: sessionError } = await supabase
    .from("diagnostic_session")
    .insert({
      user_id: user.id,
      text_id: textId,
      reading_time_ms: readingTimeMs,
      comprehension_score: comprehensionScore,
      wpm: wpm,
    })
    .select()
    .single();

  if (sessionError) {
    const log = await getRequestLogger({ module: "saveDiagnosticSession" });
    log.error({ err: sessionError }, "Failed to save diagnostic session");
    return fail(
      "db_error",
      "Não foi possível salvar a sessão de avaliação",
      sessionError
    );
  }

  return ok({
    wpm: Math.round(wpm * 100) / 100, // Round to 2 decimal places
    comprehension_score: Math.round(comprehensionScore * 100) / 100,
    target_wpm: targetWpm,
    text_title: text.title,
    reading_time_seconds: Math.round(readingTimeMs / 1000),
  });
}

export async function getUserDiagnosticHistory(): Promise<
  UserAssessmentHistory[]
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    const log = await getRequestLogger({ module: "getUserDiagnosticHistory" });
    log.error({ err: userError }, "Failed to get user");
    return [];
  }

  const { data, error } = await supabase
    .from("diagnostic_session")
    .select(
      `
      id,
      wpm,
      comprehension_score,
      created_at,
      text:text_id (
        title
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    const log = await getRequestLogger({ module: "getUserDiagnosticHistory" });
    log.error({ err: error }, "Failed to fetch diagnostic history");
    return [];
  }

  return data.map((session) => ({
    id: session.id,
    wpm: session.wpm,
    comprehension_score: session.comprehension_score,
    created_at: session.created_at,
    text_title: (session.text as any)?.title || "Texto não encontrado",
  }));
}

export async function checkUserHasAssessment(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return false;
  }

  const { data, error } = await supabase
    .from("diagnostic_session")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    const log = await getRequestLogger({ module: "checkUserHasAssessment" });
    log.error({ err: error }, "Failed to check assessment existence");
    return false;
  }

  return data && data.length > 0;
}

export async function getLatestDiagnosticSession(): Promise<AssessmentResult | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("diagnostic_session")
    .select(
      `
      wpm,
      comprehension_score,
      reading_time_ms,
      text:text_id (
        title
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    wpm: data.wpm,
    comprehension_score: data.comprehension_score,
    target_wpm: Math.round(data.wpm * 1.2),
    text_title: (data.text as any)?.title || "Texto não encontrado",
    reading_time_seconds: Math.round(data.reading_time_ms / 1000),
  };
}

export async function startAssessment() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/login");
  }

  // Get random diagnostic text
  const result = await getRandomDiagnosticText();
  if (result.error || !result.data) {
    redirect("/error");
  }

  redirect(`/assessment/reading?textId=${result.data.id}`);
}
