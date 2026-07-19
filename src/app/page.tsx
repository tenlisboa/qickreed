import {
  BookOpenIcon,
  ChartBarIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "QickReed — Treino de Leitura Acelerada",
  description:
    "Avalie sua velocidade de leitura, treine com RSVP e acompanhe sua evolução.",
};

const steps = [
  {
    icon: BookOpenIcon,
    title: "1. Avalie",
    description:
      "Faça uma avaliação diagnóstica para medir seu PPM e compreensão atuais.",
  },
  {
    icon: RocketLaunchIcon,
    title: "2. Treine",
    description:
      "Pratique com RSVP em um ponto fixo — aumente o ritmo conforme evolui.",
  },
  {
    icon: ChartBarIcon,
    title: "3. Acompanhe",
    description:
      "Veja sua evolução de PPM e compreensão ao longo do tempo no dashboard.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-main text-black font-bold text-sm border-[3px] border-black shadow-brutal-sm">
            <RocketLaunchIcon className="h-4 w-4" />
            Treino de Leitura Acelerada
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Leia <span className="bg-main px-2">mais rápido</span>.
            <br />
            Entenda <span className="bg-main px-2">mais</span>.
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Avalie sua velocidade de leitura, treine com RSVP e acompanhe sua
            evolução com métricas claras.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <a href="/dashboard" className="focus-brutal w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Ir para o Dashboard
                </Button>
              </a>
            ) : (
              <>
                <a href="/signup" className="focus-brutal w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Criar Conta
                  </Button>
                </a>
                <a href="/login" className="focus-brutal w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Entrar
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 sm:py-24 bg-gray-50 border-t-[3px] border-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-12 text-center">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <Card
                key={step.title}
                shadow="md"
                padding="lg"
                className="text-center"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 mb-4 bg-main text-black border-[3px] border-black shadow-brutal-sm">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 sm:py-20 border-t-[3px] border-black">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">
            Pronto para acelerar sua leitura?
          </h2>
          <a
            href={user ? "/dashboard" : "/signup"}
            className="focus-brutal inline-block"
          >
            <Button variant="primary" size="lg">
              {user ? "Ir para o Dashboard" : "Começar Agora"}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
