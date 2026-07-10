import { type NextRequest, NextResponse } from "next/server";
import { TrainingType } from "@/types/database";
import { getRequestLogger } from "@/utils/logging/request-logger";
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

    return NextResponse.json({ sessionId });
  } catch (error) {
    const log = await getRequestLogger({ module: "rsvp-complete-route" });
    log.error({ err: error }, "Failed to complete training session");
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
