import { type NextRequest, NextResponse } from "next/server";
import { TrainingType } from "@/types/database";
import { getRequestLogger } from "@/utils/logging/request-logger";
import { createClient } from "@/utils/supabase/server";
import { createTrainingSession } from "../../actions";

export async function POST(request: NextRequest) {
  try {
    const { textId, targetWpm, durationSeconds } = await request.json();

    if (!textId || !targetWpm || !durationSeconds) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 },
      );
    }

    const sessionId = await createTrainingSession(
      textId,
      TrainingType.RSVP,
      targetWpm,
      durationSeconds,
    );

    if (!sessionId) {
      return NextResponse.json(
        { error: "Erro ao criar sessão de treinamento" },
        { status: 500 },
      );
    }

    // Determine whether the training text has an admin-authored quiz to present.
    // If absent, the RSVP session is recorded without cognitive validation
    // (logged server-side) per QICA-12 graceful-degradation requirement.
    const supabase = await createClient();
    const { data: text, error: textError } = await supabase
      .from("text")
      .select("quiz_json")
      .eq("id", textId)
      .single();

    if (textError) {
      const log = await getRequestLogger({ module: "rsvp-complete-route" });
      log.warn({ err: textError }, "Failed to fetch quiz_json for text");
    }

    const hasQuiz =
      !!text?.quiz_json &&
      typeof text.quiz_json === "object" &&
      Array.isArray((text.quiz_json as { questions?: unknown }).questions) &&
      (text.quiz_json as { questions: unknown[] }).questions.length > 0;

    if (!hasQuiz) {
      const log = await getRequestLogger({ module: "rsvp-complete-route" });
      log.info(
        { textId, sessionId },
        "Training text has no quiz_json; skipping cognitive validation",
      );
    }

    return NextResponse.json({ sessionId, hasQuiz });
  } catch (error) {
    const log = await getRequestLogger({ module: "rsvp-complete-route" });
    log.error({ err: error }, "Failed to complete training session");
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
