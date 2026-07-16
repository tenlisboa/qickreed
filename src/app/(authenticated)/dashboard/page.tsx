"use client";

import { BookOpenIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardData } from "@/types/database";
import { getDashboardData } from "./actions";
import TrainingInputCard from "./TrainingInputCard";

const COMPREHENSION_THRESHOLD = 60; // % minimum retention (PRD Phase 4)

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const _router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (_err) {
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  // Build the chart dataset: chronological timeline with a per-point date label,
  // PPM and comprehension. Recharts needs stable keys; we keep the ISO date as the
  // raw value and format it for display via the tick formatter.
  const chartData = useMemo(() => {
    if (!dashboardData?.timeline?.length) return [];
    return dashboardData.timeline.map((point) => ({
      isoDate: point.date,
      ppm: point.ppm,
      comprehension: point.comprehension,
      type: point.type,
    }));
  }, [dashboardData]);

  const averageComprehension = useMemo(() => {
    if (!dashboardData?.timeline?.length) return 0;
    const values = dashboardData.timeline
      .filter((p) => p.comprehension !== null)
      .map((p) => p.comprehension as number);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4 block" />
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
          <Link href="/assessment" className="focus-brutal">
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
    dashboardData.current_comprehension,
  );

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
              className={`inline-flex items-center px-3 py-1 rounded-base text-sm font-bold border-[3px] border-black shadow-brutal-sm ${wpmLevel.bg} ${wpmLevel.color}`}
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
              className={`inline-flex items-center px-3 py-1 rounded-base text-sm font-bold border-[3px] border-black shadow-brutal-sm ${comprehensionLevel.bg} ${comprehensionLevel.color}`}
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
            <div className="inline-flex items-center px-3 py-1 rounded-base text-sm font-bold border-[3px] border-black shadow-brutal-sm bg-main text-black">
              +20% do atual
            </div>
          </div>
        </Card>
      </div>

      {/* Evolution Chart: PPM (Y1) + Average Comprehension Rate (Y2) vs date */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-4 gap-2">
          <h2 className="text-2xl font-semibold text-black">
            Evolução de PPM e Compreensão
          </h2>
          <p className="text-sm text-gray-600">
            Média de compreensão:{" "}
            <span className="font-bold text-black">
              {averageComprehension}%
            </span>
          </p>
        </div>
        <Card>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 16, right: 32, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="isoDate"
                  tickFormatter={(isoDate: string) =>
                    new Date(isoDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  }
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#000000", strokeWidth: 3 }}
                />
                {/* Y1 — PPM */}
                <YAxis
                  yAxisId="ppm"
                  orientation="left"
                  stroke="#000000"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "PPM",
                    angle: -90,
                    position: "insideLeft",
                    offset: 16,
                    style: { fill: "#000000", fontSize: 12, fontWeight: 700 },
                  }}
                />
                {/* Y2 — Comprehension rate (%), 0..100 */}
                <YAxis
                  yAxisId="comprehension"
                  orientation="right"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  stroke="#000000"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Compreensão (%)",
                    angle: 90,
                    position: "insideRight",
                    offset: 8,
                    style: { fill: "#000000", fontSize: 12, fontWeight: 700 },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "3px solid #000000",
                    borderRadius: "0",
                    boxShadow: "4px 4px 0 0 #000000",
                    fontWeight: 600,
                  }}
                  labelFormatter={(_label, payload) => {
                    const iso = payload?.[0]?.payload?.isoDate;
                    if (!iso) return "";
                    return new Date(iso).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                  }}
                  formatter={(value: number | string, name: string) => {
                    const label =
                      name === "ppm"
                        ? "PPM"
                        : name === "comprehension"
                          ? "Compreensão"
                          : name;
                    const display =
                      name === "comprehension" ? `${value}%` : String(value);
                    return [display, label];
                  }}
                />
                {/* Minimum retention threshold (60%) per PRD Phase 4 */}
                <ReferenceLine
                  yAxisId="comprehension"
                  y={COMPREHENSION_THRESHOLD}
                  stroke="#ff6b6b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  label={{
                    value: "Meta 60%",
                    position: "right",
                    fill: "#ff6b6b",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                {/* PPM line — black (base accent), main axis */}
                <Line
                  yAxisId="ppm"
                  type="monotone"
                  dataKey="ppm"
                  stroke="#000000"
                  strokeWidth={3}
                  connectNulls
                  dot={{ fill: "#000000", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#000000", strokeWidth: 2 }}
                  name="PPM"
                />
                {/* Comprehension line — main accent (#FFD23F), secondary axis */}
                <Line
                  yAxisId="comprehension"
                  type="monotone"
                  dataKey="comprehension"
                  stroke="#ffd23f"
                  strokeWidth={3}
                  connectNulls
                  dot={{
                    fill: "#ffd23f",
                    stroke: "#000000",
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: "#000000",
                    strokeWidth: 2,
                    fill: "#ffd23f",
                  }}
                  name="Compreensão"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Legend — neobrutalism: square swatches, 3px borders */}
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 border-[3px] border-black"
                style={{ backgroundColor: "#000000" }}
              />
              <span className="text-sm text-black font-medium">PPM</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 border-[3px] border-black"
                style={{ backgroundColor: "#ffd23f" }}
              />
              <span className="text-sm text-black font-medium">
                Compreensão
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 border-[3px] border-black"
                style={{ backgroundColor: "#ffffff" }}
              />
              <span className="text-sm text-black font-medium">
                Avaliação diagnóstica
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 border-[3px] border-black"
                style={{ backgroundColor: "#f3f4f6" }}
              />
              <span className="text-sm text-black font-medium">Treino</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Training Input (QICA-15): paste box -> LLM quiz -> enable Start Training */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Treinar com seu texto
        </h2>
        <TrainingInputCard suggestedWpm={dashboardData.target_wpm} />
      </div>

      {/* Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-black mb-4">
          Próximos Passos
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/training/rsvp" className="focus-brutal">
            <Button variant="primary" className="px-8">
              <RocketLaunchIcon className="h-4 w-4 mr-2" />
              Iniciar Treinamento RSVP
            </Button>
          </Link>
          <Link href="/assessment" className="focus-brutal">
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
