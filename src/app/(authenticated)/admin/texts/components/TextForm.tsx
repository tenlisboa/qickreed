"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Button from "@/components/Button";
import Card from "@/components/Card";
import RichTextEditor from "@/components/RichTextEditor";
import { Alert } from "@/components/ui/alert";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
    <Card shadow="lg" padding="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Title */}
        <FormControl>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            type="text"
            {...register("title")}
            placeholder="Digite o título do texto"
          />
          {errors.title && (
            <span className="inline-block bg-error px-2 py-0.5 text-sm font-bold text-black border-[3px] border-black">
              {errors.title.message}
            </span>
          )}
        </FormControl>

        {/* Type */}
        <FormControl>
          <Label htmlFor="type">Tipo *</Label>
          <Select id="type" {...register("type")}>
            <option value="">Selecione o tipo</option>
            <option value="diagnostic">Diagnóstico</option>
            <option value="training">Treinamento</option>
          </Select>
          {errors.type && (
            <span className="inline-block bg-error px-2 py-0.5 text-sm font-bold text-black border-[3px] border-black">
              {errors.type.message}
            </span>
          )}
        </FormControl>

        {/* Language */}
        <FormControl>
          <Label htmlFor="language">Idioma</Label>
          <Input
            id="language"
            type="text"
            {...register("language")}
            placeholder="pt-BR"
          />
          {errors.language && (
            <span className="inline-block bg-error px-2 py-0.5 text-sm font-bold text-black border-[3px] border-black">
              {errors.language.message}
            </span>
          )}
        </FormControl>

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
          <Button asChild variant="outline">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
          <Button
            variant="primary"
            disabled={isSubmitting}
            onClick={() => handleSubmit(handleFormSubmit)()}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Card>
  );
}
