"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { getTextById } from "@/app/(authenticated)/admin/texts/actions";
import Button from "@/components/Button";
import RsvpDisplay from "@/components/RsvpDisplay";
import { Spinner } from "@/components/ui/spinner";
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
  const autoStart = searchParams.get("autoStart") === "true";

  const fetchText = useCallback(async () => {
    try {
      const data = await getTextById(textId!);

      if (!data) {
        setError("Erro ao carregar texto");
        return;
      }

      setText(data);
    } catch (_err) {
      setError("Erro ao carregar texto");
    } finally {
      setLoading(false);
    }
  }, [textId]);

  useEffect(() => {
    if (!textId) {
      router.push("/training/rsvp");
      return;
    }

    if (targetWpmParam) {
      setTargetWpm(parseInt(targetWpmParam, 10));
    }

    fetchText();
  }, [textId, targetWpmParam, router, fetchText]);

  useEffect(() => {
    if (autoStart && text && !loading) {
      const timer = setTimeout(() => {
        const event = new CustomEvent("rsvp-autostart");
        window.dispatchEvent(event);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoStart, text, loading]);

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
        const { sessionId, hasQuiz } = await response.json();
        if (hasQuiz) {
          router.push(`/training/rsvp/quiz?sessionId=${sessionId}`);
        } else {
          router.push(`/training/rsvp/feedback?sessionId=${sessionId}`);
        }
      } else {
        router.push("/training");
      }
    } catch {
      router.push("/training");
    }
  };

  const handleStop = () => {
    router.push("/training");
  };

  if (loading) {
    return (
      <div className="training-surface min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4 block" />
          <p className="text-white">Carregando treinamento...</p>
        </div>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="training-surface min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Erro ao carregar treinamento
          </h2>
          <p className="text-white/80 mb-6">{error}</p>
          <Button variant="primary" onClick={() => router.push("/training")}>
            Voltar ao Treinamento
          </Button>
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
        <div className="training-surface min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4 block" />
            <p className="text-white">Carregando treinamento...</p>
          </div>
        </div>
      }
    >
      <RsvpSessionPageContent />
    </Suspense>
  );
}
