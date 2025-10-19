"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveDiagnosticSession } from "../actions";
import { getTextById } from "@/app/(authenticated)/admin/texts/actions";
import Button from "@/components/Button";
import Card from "@/components/Card";
import QuizQuestion from "@/components/QuizQuestion";
import type { Text, QuizData } from "@/types/database";

interface QuizAnswers {
  [questionId: number]: number;
}

export default function QuizPage() {
  const [text, setText] = useState<Text | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const textId = sessionStorage.getItem("textId");
    if (!textId) {
      router.push("/assessment");
      return;
    }

    fetchText(textId);
  }, [router]);

  const fetchText = async (textId: string) => {
    try {
      const data = await getTextById(textId);

      if (!data) {
        setError("Erro ao carregar texto");
        return;
      }

      setText(data);

      if (data.quiz_json) {
        setQuizData(data.quiz_json as QuizData);
      } else {
        setError("Quiz não encontrado para este texto");
      }
    } catch (err) {
      setError("Erro ao carregar texto");
    } finally {
      setLoading(false);
    }
  };

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
    if (!quizData || !text) return;

    setIsSubmitting(true);

    try {
      // Calculate comprehension score
      let correctAnswers = 0;
      quizData.questions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correct) {
          correctAnswers++;
        }
      });

      const comprehensionScore =
        (correctAnswers / quizData.questions.length) * 100;

      // Get reading time from sessionStorage
      const readingTimeMs = parseInt(
        sessionStorage.getItem("readingTimeMs") || "0"
      );
      const textId = sessionStorage.getItem("textId");

      if (!textId || readingTimeMs === 0) {
        setError("Dados de leitura não encontrados");
        return;
      }

      // Use server action to save diagnostic session
      const result = await saveDiagnosticSession(
        textId,
        readingTimeMs,
        comprehensionScore
      );

      if (!result) {
        setError("Erro ao salvar resultados");
        return;
      }

      // Clear session storage
      sessionStorage.removeItem("readingTimeMs");
      sessionStorage.removeItem("textId");

      // Redirect to results
      router.push("/assessment/results");
    } catch (err) {
      setError("Erro ao processar resultados");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData || !text) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Erro ao carregar quiz
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
            Responda as perguntas sobre o texto que você leu
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
                ((currentQuestion + 1) / quizData.questions.length) * 100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
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
                disabled={!hasAnswered}
                className="px-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-medium text-black mb-2">Instruções:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Leia cada pergunta cuidadosamente</li>
              <li>• Escolha a resposta que melhor se aplica</li>
              <li>• Você pode navegar entre as perguntas</li>
              <li>• Clique em "Finalizar" quando terminar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
