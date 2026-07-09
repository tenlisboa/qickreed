"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createText } from "../actions";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { type TextFormData } from "../schemas";
import { TextType } from "@/types/database";

import TextForm from "../components/TextForm";

export default function CreateTextPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: TextFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createText({
        ...data,
        type: data.type as TextType,
      });

      if (result.success) {
        router.push("/admin/texts");
      } else {
        setError(result.error || "Erro ao criar texto");
      }
    } catch {
      setError("Erro inesperado ao criar texto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/texts" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-black">Criar Novo Texto</h1>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <TextForm
        onSubmit={onSubmit}
        submitButtonText="Salvar Texto"
        cancelHref="/admin/texts"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
