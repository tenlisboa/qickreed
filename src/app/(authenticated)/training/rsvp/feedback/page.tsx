"use client";

import {
  AcademicCapIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Spinner } from "@/components/ui/spinner";
import type { TrainingHistory } from "@/types/database";
import { getTrainingSessionById } from "../../actions";

function RsvpFeedbackPageContent() {
  const [sessionData, setSessionData] = useState<TrainingHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");

  const fetchSessionData = useCallback(async () => {
    try {
      const data = await getTrainingSessionById(sessionId!);

      if (!data) {
        setError("Erro ao carregar dados da sessão");
        return;
      }

      setSessionData(data);
    } catch (_err) {
      setError("Erro ao carregar dados da sessão");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      router.push("/training");
      return;
    }

    fetchSessionData();
  }, [sessionId, router, fetchSessionData]);

  const getMotivationalMessage = (wpm: number) => {
    if (wpm >= 400) {
      return "Excelente! Você está no nível expert de leitura!";
    } else if (wpm >= 300) {
      return "Muito bem! Você está progredindo rapidamente!";
    } else if (wpm >= 200) {
      return "Bom trabalho! Continue praticando para melhorar ainda mais!";
    } else {
      return "Ótimo começo! Com prática regular, você verá melhorias significativas!";
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando resultados...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Erro ao carregar resultados
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => router.push("/training")}>
              Voltar ao Treinamento
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
          <div className="w-16 h-16 bg-main rounded-none border-[3px] border-black flex items-center justify-center mx-auto mb-4 shadow-brutal-sm">
            <CheckCircleIcon className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Treino Concluído!
          </h1>
          <p className="text-gray-600">
            Parabéns por completar seu treinamento RSVP
          </p>
        </div>

        {/* Results Card */}
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-black mb-4">
                {sessionData.text_title}
              </h2>
              <p className="text-gray-600">
                {new Date(sessionData.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border-[3px] border-black rounded-none p-6 text-center shadow-brutal-sm">
                <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center mx-auto mb-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-black mb-1">
                  {sessionData.target_wpm}
                </div>
                <div className="text-sm text-gray-600">PPM Alcançado</div>
              </div>

              <div className="bg-white border-[3px] border-black rounded-none p-6 text-center shadow-brutal-sm">
                <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center mx-auto mb-3">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-black mb-1">
                  {formatDuration(sessionData.duration_time_s)}
                </div>
                <div className="text-sm text-gray-600">Duração do Treino</div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-main border-[3px] border-black rounded-none p-6 text-center shadow-brutal-sm">
              <h3 className="text-lg font-semibold text-black mb-2">
                {getMotivationalMessage(sessionData.target_wpm)}
              </h3>
              <p className="text-black">
                Continue praticando regularmente para ver melhorias ainda
                maiores na sua velocidade de leitura.
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-white border-[3px] border-black rounded-none p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Próximos Passos
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-main rounded-none border-[3px] border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-black">1</span>
                  </div>
                  <p className="text-gray-700">
                    Pratique regularmente para manter e melhorar sua velocidade
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-main rounded-none border-[3px] border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-black">2</span>
                  </div>
                  <p className="text-gray-700">
                    Faça novas avaliações para medir seu progresso
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-main rounded-none border-[3px] border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-black">3</span>
                  </div>
                  <p className="text-gray-700">
                    Aumente gradualmente a velocidade conforme se sentir
                    confortável
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training/rsvp" className="focus-brutal">
                <Button variant="primary" className="w-full sm:w-auto px-8">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  Novo Treino
                </Button>
              </Link>
              <Link href="/training" className="focus-brutal">
                <Button variant="secondary" className="w-full sm:w-auto px-8">
                  Ver Histórico
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-black font-medium hover:underline transition-colors focus-brutal"
          >
            <ArrowRightIcon className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RsvpFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Carregando resultados...</p>
          </div>
        </div>
      }
    >
      <RsvpFeedbackPageContent />
    </Suspense>
  );
}
