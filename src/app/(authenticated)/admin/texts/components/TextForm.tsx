"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/Button";
import RichTextEditor from "@/components/RichTextEditor";
import type { TextType } from "@/types/database";
import { type TextFormData, textSchema } from "../schemas";

interface TextFormProps {
  initialData?: Partial<TextFormData>;
  onSubmit: (data: TextFormData) => Promise<void>;
  submitButtonText?: string;
  cancelHref?: string;
  isSubmitting?: boolean;
}

export default function TextForm({
  initialData,
  onSubmit,
  submitButtonText = "Salvar Texto",
  cancelHref = "/admin/texts",
  isSubmitting = false,
}: TextFormProps) {
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
      ...initialData,
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

  const handleFormSubmit = async (data: TextFormData) => {
    setError(null);

    try {
      await onSubmit({
        ...data,
        num_words: wordCount,
        type: data.type as TextType,
      });
    } catch {
      setError("Erro inesperado ao processar formulário");
    }
  };

  return (
    <div className="card bg-white border border-gray-200 shadow-lg">
      <div className="card-body p-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <title>Error</title>
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
              <div className="label">
                <span className="label-text-alt text-error">
                  {errors.title.message}
                </span>
              </div>
            )}
          </div>

          {/* Type */}
          <div className="form-control">
            <label className="label" htmlFor="type">
              <span className="label-text text-black font-medium">Tipo *</span>
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
              <div className="label">
                <span className="label-text-alt text-error">
                  {errors.type.message}
                </span>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="form-control">
            <label className="label" htmlFor="language">
              <span className="label-text text-black font-medium">Idioma</span>
            </label>
            <input
              id="language"
              type="text"
              {...register("language")}
              className="input input-bordered w-full bg-white border-gray-300 text-black placeholder-gray-400 focus:border-black focus:ring-0"
              placeholder="pt-BR"
            />
            {errors.language && (
              <div className="label">
                <span className="label-text-alt text-error">
                  {errors.language.message}
                </span>
              </div>
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

          {/* TODO: Add quiz data */}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <a href={cancelHref} className="btn btn-ghost">
              Cancelar
            </a>
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={() => handleSubmit(handleFormSubmit)()}
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
