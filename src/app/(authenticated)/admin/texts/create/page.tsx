"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import type { TextType } from "@/types/database";
import { createText } from "../actions";
import TextForm from "../components/TextForm";
import type { TextFormData } from "../schemas";

export default function CreateTextPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: TextFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createText({
        title: data.title,
        content: data.content,
        type: data.type as TextType,
        language: data.language,
        num_words: data.num_words,
        quiz_json: (data.quiz as any) ?? null,
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
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/texts">
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-black">Criar Novo Texto</h1>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
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
