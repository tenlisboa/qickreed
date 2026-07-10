"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { getTextById } from "@/app/(authenticated)/admin/texts/actions";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ScrollLockTextArea from "@/components/ScrollLockTextArea";
import Timer from "@/components/Timer";
import type { Text } from "@/types/database";

function ReadingPageContent() {
  const [text, setText] = useState<Text | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [readingTimeMs, setReadingTimeMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const textId = searchParams.get("textId");

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
      router.push("/assessment");
      return;
    }

    fetchText();
  }, [textId, router, fetchText]);

  const handleStartReading = () => {
    setIsReading(true);
    setHasStarted(true);
  };

  const handleFinishReading = () => {
    setIsReading(false);
    // Store reading time in sessionStorage to pass to quiz
    sessionStorage.setItem("readingTimeMs", readingTimeMs.toString());
    sessionStorage.setItem("textId", textId!);
    router.push("/assessment/quiz");
  };

  const handleTimeUpdate = (timeMs: number) => {
    setReadingTimeMs(timeMs);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando texto...</p>
        </div>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Erro ao carregar texto
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={() => router.push("/assessment")}
            >
              Voltar à Avaliação
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">{text.title}</h1>
          <p className="text-gray-600">
            Leia o texto abaixo no seu ritmo natural
          </p>
        </div>

        {/* Timer */}
        {hasStarted && (
          <div className="mb-6">
            <Timer
              isRunning={isReading}
              onTimeUpdate={handleTimeUpdate}
              className="mb-4"
            />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isReading ? "Lendo..." : "Leitura pausada"}
              </p>
            </div>
          </div>
        )}

        {/* Text Content */}
        <Card>
          <div className="space-y-6">
            <ScrollLockTextArea content={text.content} className="min-h-96" />

            <div className="flex justify-center space-x-4">
              {!hasStarted ? (
                <Button
                  variant="primary"
                  onClick={handleStartReading}
                  className="px-8"
                >
                  Começar a Ler
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleFinishReading}
                  className="px-8"
                >
                  Finalizar Leitura
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-medium text-black mb-2">
              Instruções importantes:
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Leia no seu ritmo natural, sem pressa</li>
              <li>• Não é possível voltar durante a leitura</li>
              <li>• Clique em "Finalizar Leitura" quando terminar</li>
              <li>• Em seguida, você responderá perguntas sobre o texto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando texto...</p>
          </div>
        </div>
      }
    >
      <ReadingPageContent />
    </Suspense>
  );
}
