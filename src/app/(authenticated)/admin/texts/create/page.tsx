"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { textSchema, type TextFormData } from "../schemas";
import { createText } from "../actions";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import RichTextEditor from "@/components/RichTextEditor";
import { TextType } from "@/types/database";
import Button from "@/components/Button";

export default function CreateTextPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TextFormData>({
    resolver: zodResolver(textSchema) as any,
    defaultValues: {
      language: "pt-BR",
      num_words: 0,
    },
  });

  const content = watch("content");

  // Calculate word count
  const wordCount = content
    ? content
        .replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

  // Update word count when content changes
  const handleContentChange = (value: string) => {
    setValue("content", value);
    setValue("num_words", wordCount);
  };

  const onSubmit = async (data: TextFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createText({
        ...data,
        num_words: wordCount,
        type: data.type as TextType,
      });

      if (result.success) {
        router.push("/admin/texts");
      } else {
        setError(result.error || "Erro ao criar texto");
      }
    } catch (err) {
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

      <div className="card bg-white border border-gray-200 shadow-lg">
        <div className="card-body p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
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
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div className="form-control">
              <label className="label" htmlFor="title">
                <span className="label-text text-black font-medium">
                  Título *
                </span>
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                placeholder="Digite o título do texto"
              />
              {errors.title && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.title.message}
                  </span>
                </label>
              )}
            </div>

            {/* Type */}
            <div className="form-control">
              <label className="label" htmlFor="type">
                <span className="label-text text-black font-medium">
                  Tipo *
                </span>
              </label>
              <select
                id="type"
                {...register("type")}
                className="select select-bordered w-full bg-white border-gray-300 text-black focus:border-black focus:ring-0"
              >
                <option value="">Selecione o tipo</option>
                <option value="diagnostic">Diagnóstico</option>
                <option value="training">Treinamento</option>
              </select>
              {errors.type && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.type.message}
                  </span>
                </label>
              )}
            </div>

            {/* Language */}
            <div className="form-control">
              <label className="label" htmlFor="language">
                <span className="label-text text-black font-medium">
                  Idioma
                </span>
              </label>
              <input
                id="language"
                type="text"
                {...register("language")}
                className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
                placeholder="pt-BR"
              />
              {errors.language && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.language.message}
                  </span>
                </label>
              )}
            </div>

            {/* Content */}
            <RichTextEditor
              value={content || ""}
              onChange={handleContentChange}
              placeholder="Digite o conteúdo do texto aqui..."
              label="Conteúdo"
              required
              error={errors.content?.message}
            />

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <Link href="/admin/texts" className="btn btn-ghost">
                Cancelar
              </Link>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={() => handleSubmit(onSubmit)()}
              >
                Salvar Texto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
