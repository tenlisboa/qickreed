import { createTrainingSession } from "../../actions";
import { TrainingType } from "@/types/database";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { textId, targetWpm, durationSeconds } = await request.json();

    if (!textId || !targetWpm || !durationSeconds) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    const sessionId = await createTrainingSession(
      textId,
      TrainingType.RSVP,
      targetWpm,
      durationSeconds
    );

    if (!sessionId) {
      return NextResponse.json(
        { error: "Erro ao criar sessão de treinamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Erro na API de conclusão de treinamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
