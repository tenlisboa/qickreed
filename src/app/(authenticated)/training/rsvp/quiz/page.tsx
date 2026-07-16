"use client";

export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import QuizQuestion from "@/components/QuizQuestion";
import { Spinner } from "@/components/ui/spinner";
import type { QuizData } from "@/types/database";
import {
  getTextQuizData,
  getTrainingSessionDetails,
  submitTrainingQuiz,
} from "../../actions";

interface QuizAnswers {
  [questionId: number]: number;
}

function RsvpQuizPageContent() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [textTitle, setTextTitle] = useState<string>("");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const fetchQuiz = useCallback(async () => {
    if (!sessionId) return;

    try {
      const session = await getTrainingSessionDetails(sessionId);
      if (!session) {
        setError("Sessão de treinamento não encontrada");
        return;
      }

      setTextTitle(session.text_title);

      const quiz = await getTextQuizData(session.text_id);
      if (!quiz || !quiz.questions.length) {
        setError("Quiz não encontrado para este texto");
        return;
      }

      setQuizData(quiz);
    } catch (_err) {
      setError("Erro ao carregar quiz");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      router.push("/training");
      return;
    }

    fetchQuiz();
  }, [sessionId, router, fetchQuiz]);

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quizData || !sessionId) return;

    setIsSubmitting(true);

    try {
      const result = await submitTrainingQuiz(sessionId, answers);

      if (!result.success || !result.result) {
        setError(result.error || "Erro ao processar resultados");
        return;
      }

      router.push(`/training/rsvp/feedback?sessionId=${sessionId}`);
    } catch (_err) {
      setError("Erro ao processar resultados");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4 block" />
          <p className="text-gray-600">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Erro ao carregar quiz
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

  const currentQuestionData = quizData.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quizData.questions.length - 1;
  const hasAnswered = answers[currentQuestionData.id] !== undefined;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Teste de Compreensão
          </h1>
          <p className="text-gray-600">
            Responda as perguntas sobre o texto que você leu:{" "}
            <span className="font-semibold text-black">{textTitle}</span>
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Pergunta {currentQuestion + 1} de {quizData.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(
                ((currentQuestion + 1) / quizData.questions.length) * 100,
              )}
              %
            </span>
          </div>
          <div className="w-full bg-white border-[3px] border-black rounded-base h-3 overflow-hidden">
            <div
              className="bg-main h-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestion + 1) / quizData.questions.length) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <Card>
          <div className="space-y-6">
            <QuizQuestion
              question={currentQuestionData}
              onAnswer={handleAnswer}
              selectedAnswer={answers[currentQuestionData.id]}
            />

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-6"
              >
                Anterior
              </Button>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!hasAnswered || isSubmitting}
                className="px-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    Processando...
                  </div>
                ) : isLastQuestion ? (
                  "Finalizar"
                ) : (
                  "Próxima"
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-white border-[3px] border-black rounded-base shadow-brutal-sm p-4 max-w-2xl mx-auto">
            <h3 className="font-bold text-black mb-2">Instruções:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Leia cada pergunta com atenção</li>
              <li>• Escolha a resposta que melhor se aplica</li>
              <li>• Você pode navegar entre as perguntas</li>
              <li>• Clique em &quot;Finalizar&quot; quando terminar</li>
              <li>• É necessário atingir pelo menos 60% de acerto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RsvpQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4 block" />
            <p className="text-gray-600">Carregando quiz...</p>
          </div>
        </div>
      }
    >
      <RsvpQuizPageContent />
    </Suspense>
  );
}
