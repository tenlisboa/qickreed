import { getUserDiagnosticHistory } from "./actions";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";
import {
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default async function AssessmentPage() {
  const history = await getUserDiagnosticHistory();

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Avaliação de Leitura
          </h1>
          <p className="text-gray-600">
            Meça sua velocidade de leitura e compreensão
          </p>
        </div>

        {/* Instructions */}
        <Card>
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-black mb-4">
              Como funciona a avaliação
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <BookOpenIcon className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-black">1. Leitura</h3>
                  <p className="text-gray-600 text-sm">
                    Você lerá um texto e cronometrará o tempo. Não é possível
                    voltar durante a leitura.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <QuestionMarkCircleIcon className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-black">
                    2. Quiz de Compreensão
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Responda perguntas sobre o texto para medir sua compreensão.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <ChartBarIcon className="h-6 w-6 text-black flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-black">3. Resultados</h3>
                  <p className="text-gray-600 text-sm">
                    Receba sua velocidade de leitura (PPM) e score de
                    compreensão.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <form action="/assessment/start" method="post">
                <Button variant="primary" type="submit" className="w-full">
                  Iniciar Avaliação
                </Button>
              </form>
            </div>
          </div>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-black mb-4">
              Histórico de Avaliações
            </h2>
            <Card>
              <div className="space-y-4">
                {history.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-black">
                        {assessment.text_title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(assessment.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-black">
                        {assessment.wpm.toFixed(0)} PPM
                      </p>
                      <p className="text-sm text-gray-600">
                        {assessment.comprehension_score.toFixed(0)}% compreensão
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-black font-medium hover:underline transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
