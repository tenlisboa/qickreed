"use server";

import { revalidatePath } from "next/cache";
import type { Text, TrainingHistory, TrainingType } from "@/types/database";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";

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

  return data.map((session) => ({
    id: session.id,
    training_type: session.training_type as TrainingType,
    target_wpm: session.target_wpm,
    duration_time_s: session.duration_time_s,
    created_at: session.created_at,
    text_title: (session.text as any)?.title || "Texto não encontrado",
  }));
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

  const { data, error } = await supabase
    .from("training_session")
    .insert({
      text_id: textId,
      training_type: trainingType,
      target_wpm: targetWpm,
      duration_time_s: durationSeconds,
    })
    .select("id")
    .single();

  if (error) {
    const log = await getRequestLogger({ module: "createTrainingSession" });
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

  return data?.wpm || null;
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

  return {
    id: data.id,
    training_type: data.training_type as TrainingType,
    target_wpm: data.target_wpm,
    duration_time_s: data.duration_time_s,
    created_at: data.created_at,
    text_title: (data.text as any)?.title || "Texto não encontrado",
  };
}
