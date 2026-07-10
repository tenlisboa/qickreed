"use server";

import type { DashboardData, UserAssessmentHistory } from "@/types/database";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";

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

  const { data: latestSession, error: sessionError } = await supabase
    .from("diagnostic_session")
    .select(
      `
      wpm,
      comprehension_score,
      text:text_id (
        title
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: allSessions, error: historyError } = await supabase
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
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (historyError) {
    const log = await getRequestLogger({ module: "getDashboardData" });
    log.error({ err: historyError }, "Failed to fetch diagnostic history");
    return null;
  }

  const hasAssessments = allSessions && allSessions.length > 0;

  if (!hasAssessments) {
    return {
      current_wpm: 0,
      current_comprehension: 0,
      target_wpm: 0,
      history: [],
      has_assessments: false,
    };
  }

  const currentWpm = latestSession?.wpm || 0;
  const targetWpm = Math.round(currentWpm * 1.2);

  const history: UserAssessmentHistory[] = allSessions.map((session) => ({
    id: session.id,
    wpm: session.wpm,
    comprehension_score: session.comprehension_score,
    created_at: session.created_at,
    text_title: (session.text as any)?.title || "Texto não encontrado",
  }));

  return {
    current_wpm: currentWpm,
    current_comprehension: latestSession?.comprehension_score || 0,
    target_wpm: targetWpm,
    history,
    has_assessments: true,
  };
}
