import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import {
  getBenchmarkWpm,
  getLastDiagnosticWpm,
  getRandomTrainingText,
} from "../actions";

export default async function RsvpPreparationPage() {
  const [text, lastWpm, benchmarkWpm] = await Promise.all([
    getRandomTrainingText(),
    getLastDiagnosticWpm(),
    getBenchmarkWpm(),
  ]);

  if (!text) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Nenhum texto disponível
            </h2>
            <p className="text-gray-600 mb-6">
              Não há textos de treinamento disponíveis no momento.
            </p>
            <Link href="/training" className="focus-brutal">
              <Button variant="primary">Voltar ao Treinamento</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Prefer the validated benchmark (set by post-RSVP cognitive validation).
  // Fall back to the initial diagnostic target (last diagnostic WPM * 1.2).
  const suggestedWpm =
    benchmarkWpm ?? (lastWpm ? Math.round(lastWpm * 1.2) : 200);
  const estimatedMinutes = Math.ceil(text.num_words / suggestedWpm);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Preparação RSVP
          </h1>
          <p className="text-gray-600">
            Configure sua velocidade de treinamento
          </p>
        </div>

        {/* Text Information */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center border-[3px] border-black shadow-brutal-sm">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-black mb-2">
                  {text.title}
                </h2>
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    {text.num_words} palavras
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />~{estimatedMinutes}{" "}
                    minutos
                  </div>
                </div>
                <p className="text-gray-600">
                  Este texto foi selecionado automaticamente para seu
                  treinamento RSVP. As palavras serão apresentadas uma por vez
                  no centro da tela.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration */}
        <Card>
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">
              Configuração de Velocidade
            </h3>

            <div className="bg-white border-[3px] border-black rounded-none p-6 shadow-brutal-sm">
              <div className="space-y-4">
                <div>
                  <div className="block text-sm font-medium text-black mb-2">
                    Velocidade Sugerida: {suggestedWpm} PPM
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {benchmarkWpm
                      ? "Baseado no seu benchmark validado em sessões anteriores de RSVP"
                      : `Baseado em seu último diagnóstico (${
                          lastWpm ? `${Math.round(lastWpm)} PPM` : "não disponível"
                        }) + 20% de aumento`}
                  </p>
                </div>

                <div className="bg-white border-[3px] border-black rounded-none p-4">
                  <h4 className="font-medium text-black mb-3">
                    Como funciona o RSVP:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>
                      • As palavras aparecem uma por vez no centro da tela
                    </li>
                    <li>• Elimina movimentos oculares e subvocalização</li>
                    <li>• Força o cérebro a processar palavras visualmente</li>
                    <li>• Aumenta progressivamente a velocidade de leitura</li>
                  </ul>
                </div>

                <div className="bg-main border-[3px] border-black rounded-none p-4 shadow-brutal-sm">
                  <h4 className="font-medium text-black mb-2">
                    Instruções importantes:
                  </h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Mantenha o foco no centro da tela</li>
                    <li>
                      • Não subvocalize (não "fale" as palavras mentalmente)
                    </li>
                    <li>
                      • O treinamento pausa automaticamente se você trocar de
                      aba
                    </li>
                    <li>
                      • Ao final, você fará um teste de compreensão para
                      validar a sessão
                    </li>
                    <li>
                      • Compreensão ≥ 60% valida a sessão e mantém o PPM;
                      abaixo disso reduz o PPM em 10% na próxima
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link href="/training" className="focus-brutal">
                <Button variant="secondary" className="px-8">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Link
                href={`/training/rsvp/session?textId=${text.id}&targetWpm=${suggestedWpm}`}
                className="focus-brutal"
              >
                <Button variant="primary" className="px-8">
                  Começar Treino
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/training"
            className="inline-flex items-center text-gray-600 hover:text-black font-medium hover:underline transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar ao Treinamento
          </Link>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Preparação RSVP
          </h1>
          <p className="text-gray-600">
            Configure sua velocidade de treinamento
          </p>
        </div>

        {/* Text Information */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center border-[3px] border-black shadow-brutal-sm">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-black mb-2">
                  {text.title}
                </h2>
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    {text.num_words} palavras
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />~{estimatedMinutes}{" "}
                    minutos
                  </div>
                </div>
                <p className="text-gray-600">
                  Este texto foi selecionado automaticamente para seu
                  treinamento RSVP. As palavras serão apresentadas uma por vez
                  no centro da tela.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration */}
        <Card>
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">
              Configuração de Velocidade
            </h3>

            <div className="bg-white border-[3px] border-black rounded-none p-6 shadow-brutal-sm">
              <div className="space-y-4">
                <div>
                  <div className="block text-sm font-medium text-black mb-2">
                    Velocidade Sugerida: {suggestedWpm} PPM
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Baseado em seu último diagnóstico (
                    {lastWpm ? `${Math.round(lastWpm)} PPM` : "não disponível"})
                    + 20% de aumento
                  </p>
                </div>

                <div className="bg-white border-[3px] border-black rounded-none p-4">
                  <h4 className="font-medium text-black mb-3">
                    Como funciona o RSVP:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>
                      • As palavras aparecem uma por vez no centro da tela
                    </li>
                    <li>• Elimina movimentos oculares e subvocalização</li>
                    <li>• Força o cérebro a processar palavras visualmente</li>
                    <li>• Aumenta progressivamente a velocidade de leitura</li>
                  </ul>
                </div>

                <div className="bg-main border-[3px] border-black rounded-none p-4 shadow-brutal-sm">
                  <h4 className="font-medium text-black mb-2">
                    Instruções importantes:
                  </h4>
                  <ul className="text-sm text-black space-y-1">
                    <li>• Mantenha o foco no centro da tela</li>
                    <li>
                      • Não subvocalize (não "fale" as palavras mentalmente)
                    </li>
                    <li>
                      • O treinamento pausa automaticamente se você trocar de
                      aba
                    </li>
                    <li>
                      • Comece com a velocidade sugerida e ajuste conforme
                      necessário
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Link href="/training" className="focus-brutal">
                <Button variant="secondary" className="px-8">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Link
                href={`/training/rsvp/session?textId=${text.id}&targetWpm=${suggestedWpm}`}
                className="focus-brutal"
              >
                <Button variant="primary" className="px-8">
                  Começar Treino
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/training"
            className="inline-flex items-center text-gray-600 hover:text-black font-medium hover:underline transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar ao Treinamento
          </Link>
        </div>
      </div>
    </div>
  );
}
