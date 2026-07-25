import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";

export const metadata: Metadata = {
  title: "QickReed — Treino de Leitura Acelerada",
  description:
    "Avalie sua velocidade de leitura, treine com RSVP e acompanhe sua evolução.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* SECTION 1 — HERO */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Pare de ler com a “voz na cabeça”.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            O Qickreed é um treinador neurocognitivo que elimina a
            subvocalização. Dobre sua velocidade de leitura forçando seu cérebro
            a processar a forma das palavras em vez de ouvir o som, mantendo
            mais de 60% de retenção.
          </p>
          <Button variant="primary" size="lg" asChild>
            <Link href="/signup" className="focus-brutal">
              Faça o Teste de Nivelamento Gratuito
            </Link>
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Leva 2 minutos. Não requer cartão de crédito.
          </p>
        </div>
      </section>

      {/* SECTION 2 — O PROBLEMA */}
      <section className="px-6 py-16 sm:py-24 bg-gray-50 border-t-[3px] border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-12 text-center">
            Seu cérebro é mais rápido que sua boca. Por que limitar sua leitura
            à velocidade da fala?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card shadow="md" padding="lg">
              <h3 className="text-xl font-semibold text-black mb-3">
                A Armadilha da Subvocalização
              </h3>
              <p className="text-gray-600">
                A maioria das pessoas estagna em 250 Palavras Por Minuto (PPM)
                porque “pronuncia” mentalmente cada palavra. Isso é um limite
                físico da fala, não do cérebro.
              </p>
            </Card>
            <Card shadow="md" padding="lg">
              <h3 className="text-xl font-semibold text-black mb-3">
                O Desperdício da Regressão
              </h3>
              <p className="text-gray-600">
                Seus olhos saltam para trás constantemente. Reler as mesmas
                linhas destrói seu foco e dobra o tempo necessário para terminar
                um texto.
              </p>
            </Card>
            <Card shadow="md" padding="lg">
              <h3 className="text-xl font-semibold text-black mb-3">
                A Consequência
              </h3>
              <p className="text-gray-600">
                Estudar documentações leva horas, livros técnicos se acumulam e
                a leitura se torna um fardo exaustivo em vez de uma vantagem
                competitiva.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 3 — A SOLUÇÃO */}
      <section className="px-6 py-16 sm:py-24 border-t-[3px] border-black">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-12 text-center">
            Reeduque sua mecânica visual em 3 passos controlados.
          </h2>
          <ol className="space-y-8 list-none p-0 m-0">
            <li className="flex gap-5 items-start">
              <span className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 bg-main text-black font-bold text-xl border-[3px] border-black shadow-brutal-sm">
                1
              </span>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  A Linha de Base
                </h3>
                <p className="text-gray-600">
                  Começamos medindo seu PPM atual e diagnosticando seu grau de
                  dependência da voz mental.
                </p>
              </div>
            </li>
            <li className="flex gap-5 items-start">
              <span className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 bg-main text-black font-bold text-xl border-[3px] border-black shadow-brutal-sm">
                2
              </span>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  O Motor Taquistoscópio
                </h3>
                <p className="text-gray-600">
                  O software exibe palavras em frações de segundo no centro da
                  tela. Ao forçar a velocidade para mais de 350 PPM, seu cérebro
                  não tem tempo físico para subvocalizar.
                </p>
              </div>
            </li>
            <li className="flex gap-5 items-start">
              <span className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 bg-main text-black font-bold text-xl border-[3px] border-black shadow-brutal-sm">
                3
              </span>
              <div>
                <h3 className="text-xl font-semibold text-black mb-2">
                  Validação Cognitiva via IA
                </h3>
                <p className="text-gray-600">
                  Velocidade sem retenção é inútil. Após cada sessão, nosso LLM
                  extrai o eixo central do texto e testa sua compreensão.
                  Pontuações abaixo de 60% bloqueiam o avanço de nível.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* SECTION 4 — ALINHAMENTO DE PÚBLICO */}
      <section className="px-6 py-16 sm:py-24 bg-gray-50 border-t-[3px] border-black">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-12 text-center">
            O Qickreed não é para leitura de lazer. É para absorção de dados.
          </h2>
          <ul className="space-y-6 list-none p-0 m-0">
            <li className="flex gap-4 items-start">
              <CheckCircleIcon className="h-7 w-7 text-black flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Profissionais de Tecnologia e Negócios
                </h3>
                <p className="text-gray-600">
                  Que precisam processar relatórios, documentações e artigos
                  técnicos rapidamente.
                </p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <CheckCircleIcon className="h-7 w-7 text-black flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Estudantes e Acadêmicos
                </h3>
                <p className="text-gray-600">
                  Que lidam com volumes massivos de PDFs e precisam otimizar o
                  tempo de estudo.
                </p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <CheckCircleIcon className="h-7 w-7 text-black flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Pessoas com Déficit de Foco
                </h3>
                <p className="text-gray-600">
                  Que sentem sono ou perdem a concentração após 10 minutos de
                  leitura tradicional.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* SECTION 5 — FECHAMENTO */}
      <section className="px-6 py-16 sm:py-24 border-t-[3px] border-black">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-xl font-semibold text-black mb-6">
            Junte-se aos testadores beta que aumentaram seu PPM base em 40% nas
            primeiras duas semanas.
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-8">
            Pronto para descobrir sua velocidade real de processamento?
          </h2>
          <Button variant="primary" size="lg" asChild>
            <Link href="/assessment" className="focus-brutal">
              Descobrir meu PPM atual
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
