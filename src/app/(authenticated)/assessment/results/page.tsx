"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";
import {
  TagIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import type { AssessmentResult } from "@/types/database";

export default function ResultsPage() {
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchLatestResults();
  }, []);

  const fetchLatestResults = async () => {
    try {
      const supabase = createClient();

      // Get user's latest diagnostic session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: session, error: sessionError } = await supabase
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !session) {
        setError("Resultados não encontrados");
        return;
      }

      const targetWpm = Math.round(session.wpm * 1.2);

      setResults({
        wpm: session.wpm,
        comprehension_score: session.comprehension_score,
        target_wpm: targetWpm,
        text_title: (session.text as any)?.title || "Texto não encontrado",
        reading_time_seconds: Math.round(session.reading_time_ms / 1000),
      });
    } catch (err) {
      setError("Erro ao carregar resultados");
    } finally {
      setLoading(false);
    }
  };

  const getWpmLevel = (wpm: number) => {
    if (wpm < 200)
      return {
        level: "Iniciante",
        color: "text-gray-600",
        bg: "bg-gray-50",
      };
    if (wpm < 300)
      return {
        level: "Intermediário",
        color: "text-gray-700",
        bg: "bg-gray-100",
      };
    if (wpm < 400)
      return { level: "Avançado", color: "text-black", bg: "bg-gray-200" };
    return { level: "Expert", color: "text-black", bg: "bg-gray-300" };
  };

  const getComprehensionLevel = (score: number) => {
    if (score < 60)
      return { level: "Baixa", color: "text-gray-600", bg: "bg-gray-50" };
    if (score < 80)
      return { level: "Média", color: "text-gray-700", bg: "bg-gray-100" };
    return { level: "Alta", color: "text-black", bg: "bg-gray-200" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando resultados...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Erro ao carregar resultados
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

  const wpmLevel = getWpmLevel(results.wpm);
  const comprehensionLevel = getComprehensionLevel(results.comprehension_score);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Resultados da Avaliação
          </h1>
          <p className="text-gray-600">
            Aqui estão seus resultados de leitura e compreensão
          </p>
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* WPM Card */}
          <Card>
            <div className="text-center">
              <div className="mb-4">
                <div className="text-4xl font-bold text-black mb-2">
                  {results.wpm.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Palavras por Minuto</div>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${wpmLevel.bg} ${wpmLevel.color}`}
              >
                {wpmLevel.level}
              </div>
            </div>
          </Card>

          {/* Comprehension Card */}
          <Card>
            <div className="text-center">
              <div className="mb-4">
                <div className="text-4xl font-bold text-black mb-2">
                  {results.comprehension_score.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Compreensão</div>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${comprehensionLevel.bg} ${comprehensionLevel.color}`}
              >
                {comprehensionLevel.level}
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-black mb-4">
              Detalhes da Avaliação
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {results.reading_time_seconds}s
                </div>
                <div className="text-sm text-gray-600">Tempo de Leitura</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {results.target_wpm}
                </div>
                <div className="text-sm text-gray-600">Meta de Treinamento</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {results.text_title}
                </div>
                <div className="text-sm text-gray-600">Texto Lido</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recommendations */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-black mb-4">
              Recomendações
            </h2>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <TagIcon className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-black">
                    Meta de Treinamento
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Sua meta inicial é {results.target_wpm} PPM (+20% da sua
                    velocidade atual).
                  </p>
                </div>
              </div>

              {results.comprehension_score < 80 && (
                <div className="flex items-start space-x-3">
                  <BookOpenIcon className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-black">
                      Foque na Compreensão
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Pratique leitura com foco na compreensão antes de aumentar
                      a velocidade.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <RocketLaunchIcon className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-black">Próximos Passos</h3>
                  <p className="text-gray-600 text-sm">
                    Comece o treinamento RSVP para acelerar sua leitura mantendo
                    a compreensão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" className="px-8">
            <RocketLaunchIcon className="h-4 w-4 mr-2" />
            Iniciar Treinamento RSVP
          </Button>
          <Button variant="secondary" className="px-8">
            <TagIcon className="h-4 w-4 mr-2" />
            Fazer Nova Avaliação
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary" className="px-8">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Ir para Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
