"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RsvpDisplay from "@/components/RsvpDisplay";
import { getTextById } from "@/app/(authenticated)/admin/texts/actions";
import type { Text } from "@/types/database";

function RsvpSessionPageContent() {
  const [text, setText] = useState<Text | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetWpm, setTargetWpm] = useState<number>(200);

  const searchParams = useSearchParams();
  const router = useRouter();
  const textId = searchParams.get("textId");
  const targetWpmParam = searchParams.get("targetWpm");

  useEffect(() => {
    if (!textId) {
      router.push("/training/rsvp");
      return;
    }

    if (targetWpmParam) {
      setTargetWpm(parseInt(targetWpmParam));
    }

    fetchText();
  }, [textId, targetWpmParam, router]);

  const fetchText = async () => {
    try {
      const data = await getTextById(textId!);

      if (!data) {
        setError("Erro ao carregar texto");
        return;
      }

      setText(data);
    } catch (err) {
      setError("Erro ao carregar texto");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (durationSeconds: number) => {
    if (!text) return;

    try {
      const response = await fetch("/training/rsvp/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          textId: text.id,
          targetWpm,
          durationSeconds,
        }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        router.push(`/training/rsvp/feedback?sessionId=${sessionId}`);
      } else {
        console.error("Erro ao salvar sessão");
        router.push("/training");
      }
    } catch (err) {
      console.error("Erro ao salvar sessão:", err);
      router.push("/training");
    }
  };

  const handleStop = () => {
    router.push("/training");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando treinamento...</p>
        </div>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-4">
            Erro ao carregar treinamento
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/training")}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Voltar ao Treinamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <RsvpDisplay
      text={text.content}
      targetWpm={targetWpm}
      onComplete={handleComplete}
      onStop={handleStop}
    />
  );
}

export default function RsvpSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando treinamento...</p>
          </div>
        </div>
      }
    >
      <RsvpSessionPageContent />
    </Suspense>
  );
}
