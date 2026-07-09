"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type {
  Text,
  DiagnosticSession,
  AssessmentResult,
  UserAssessmentHistory,
} from "@/types/database";

export async function getRandomDiagnosticText(): Promise<Text | null> {
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
    console.error("Error fetching diagnostic text:", error);
    return null;
  }

  return data;
}

export async function saveDiagnosticSession(
  textId: string,
  readingTimeMs: number,
  comprehensionScore: number
): Promise<AssessmentResult | null> {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Error getting user:", userError);
    return null;
  }

  // Get text data for calculations
  const { data: text, error: textError } = await supabase
    .from("text")
    .select("num_words, title")
    .eq("id", textId)
    .single();

  if (textError || !text) {
    console.error("Error fetching text data:", textError);
    return null;
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
    console.error("Error saving diagnostic session:", sessionError);
    return null;
  }

  return {
    wpm: Math.round(wpm * 100) / 100, // Round to 2 decimal places
    comprehension_score: Math.round(comprehensionScore * 100) / 100,
    target_wpm: targetWpm,
    text_title: text.title,
    reading_time_seconds: Math.round(readingTimeMs / 1000),
  };
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
    console.error("Error getting user:", userError);
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
    console.error("Error fetching diagnostic history:", error);
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
    console.error("Error checking assessment:", error);
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
  const text = await getRandomDiagnosticText();
  if (!text) {
    redirect("/error");
  }

  redirect(`/assessment/reading?textId=${text.id}`);
}
