"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BookOpenIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { getDashboardData } from "./actions";
import type { DashboardData } from "@/types/database";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError("Erro ao carregar dados do dashboard");
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
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-black mb-4">
              Erro ao carregar dashboard
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData.has_assessments) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-black mb-4">
            Bem-vindo ao QickReed
          </h1>
          <p className="text-gray-600 mb-8">
            Para começar sua jornada de leitura acelerada, faça sua primeira
            avaliação.
          </p>
          <Link href="/assessment">
            <Button variant="primary" className="px-8">
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Fazer Primeira Avaliação
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const wpmLevel = getWpmLevel(dashboardData.current_wpm);
  const comprehensionLevel = getComprehensionLevel(
    dashboardData.current_comprehension
  );

  // Format data for chart
  const chartData = dashboardData.history.map((session, index) => ({
    name: `Avaliação ${index + 1}`,
    wpm: Math.round(session.wpm),
    comprehension: Math.round(session.comprehension_score),
  }));

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-gray-600 mt-2">Acompanhe seu progresso de leitura</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current WPM */}
        <Card>
          <div className="text-center">
            <div className="mb-4">
              <div className="text-4xl font-bold text-black mb-2">
                {Math.round(dashboardData.current_wpm)}
              </div>
              <div className="text-sm text-gray-600">PPM Atual</div>
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${wpmLevel.bg} ${wpmLevel.color}`}
            >
              {wpmLevel.level}
            </div>
          </div>
        </Card>

        {/* Current Comprehension */}
        <Card>
          <div className="text-center">
            <div className="mb-4">
              <div className="text-4xl font-bold text-black mb-2">
                {Math.round(dashboardData.current_comprehension)}%
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

        {/* Target WPM */}
        <Card>
          <div className="text-center">
            <div className="mb-4">
              <div className="text-4xl font-bold text-black mb-2">
                {dashboardData.target_wpm}
              </div>
              <div className="text-sm text-gray-600">Meta de Treinamento</div>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
              +20% do atual
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Chart */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Evolução do PPM
        </h2>
        <Card>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={{ fill: "#000000", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#000000", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Próximos Passos
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/training/rsvp">
            <Button variant="primary" className="px-8">
              <RocketLaunchIcon className="h-4 w-4 mr-2" />
              Iniciar Treinamento RSVP
            </Button>
          </Link>
          <Link href="/assessment">
            <Button variant="secondary" className="px-8">
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Acelere sua leitura com o treinamento RSVP e técnicas avançadas.
        </p>
      </div>
    </div>
  );
}
