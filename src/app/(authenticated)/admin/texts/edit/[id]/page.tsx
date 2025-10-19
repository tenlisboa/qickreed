"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getTextById, updateText } from "../../actions";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { Text, TextType } from "@/types/database";
import { type TextFormData } from "../../schemas";

import TextForm from "../../components/TextForm";

interface EditTextPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditTextPage({ params }: EditTextPageProps) {
  const router = useRouter();
  const [text, setText] = useState<Text | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedParams = use(params);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const textData = await getTextById(resolvedParams.id);
        if (textData) {
          setText(textData);
        } else {
          setError("Texto não encontrado");
        }
      } catch (err) {
        console.error("Error fetching text:", err);
        setError("Erro ao carregar texto");
      } finally {
        setIsLoading(false);
      }
    };

    fetchText();
  }, [resolvedParams.id]);

  const onSubmit = async (data: TextFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateText(resolvedParams.id, {
        ...data,
        type: data.type as TextType,
      });

      if (result.success) {
        router.push("/admin/texts");
      } else {
        setError(result.error || "Erro ao atualizar texto");
      }
    } catch (err) {
      console.error("Error updating text:", err);
      setError("Erro inesperado ao atualizar texto");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
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
          <span>Texto não encontrado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/texts" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-black">Editar Texto</h1>
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

      {text && (
        <TextForm
          initialData={{
            title: text.title,
            content: text.content,
            type: text.type,
            language: text.language,
            num_words: text.num_words,
          }}
          onSubmit={onSubmit}
          submitButtonText="Salvar Alterações"
          cancelHref="/admin/texts"
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
