import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { getTrainingHistory } from "./actions";

export default async function TrainingPage() {
  const history = await getTrainingHistory();

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Treinamento de Leitura
          </h1>
          <p className="text-gray-600">
            Acelere sua leitura com técnicas avançadas
          </p>
        </div>

        {/* RSVP Training Card */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-black mb-2">
                  Treinamento RSVP
                </h2>
                <p className="text-gray-600 mb-4">
                  Rapid Serial Visual Presentation - As palavras são
                  apresentadas uma por vez no centro da tela, eliminando
                  subvocalização e aumentando sua velocidade de leitura.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    Elimina subvocalização
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    Aumenta velocidade
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    Melhora foco
                  </span>
                </div>
                <Link href="/training/rsvp">
                  <Button variant="primary" className="px-8">
                    Iniciar Treinamento RSVP
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-black mb-4">
              Histórico de Treinos
            </h2>
            <Card>
              <div className="space-y-4">
                {history.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <AcademicCapIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-black">
                          {session.text_title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          {session.target_wpm} PPM
                        </div>
                        <div className="flex items-center text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {Math.floor(session.duration_time_s / 60)}min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && (
          <div className="mt-8">
            <Card>
              <div className="text-center py-8">
                <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  Nenhum treino realizado ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Comece seu primeiro treinamento RSVP para acelerar sua
                  leitura.
                </p>
                <Link href="/training/rsvp">
                  <Button variant="primary" className="px-8">
                    Começar Primeiro Treino
                  </Button>
                </Link>
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
