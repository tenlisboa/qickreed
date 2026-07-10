import { z } from "zod";
import { TextType } from "@/types/database";

export const textSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  type: z.enum(Object.values(TextType) as [string, ...string[]], {
    error: "Tipo é obrigatório",
  }),
  language: z.string().min(1, "Idioma é obrigatório").default("pt-BR"),
  num_words: z.number().int().positive("Número de palavras deve ser positivo"),
});

export type TextFormData = z.infer<typeof textSchema>;
