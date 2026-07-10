"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Button from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { Text, TextType } from "@/types/database";
import { getTextById, updateText } from "../../actions";
import TextForm from "../../components/TextForm";
import type { TextFormData } from "../../schemas";

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
      } catch {
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
    } catch {
      setError("Erro inesperado ao atualizar texto");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="p-8">
        <Alert variant="error">Texto não encontrado</Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/texts">
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-black">Editar Texto</h1>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
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
