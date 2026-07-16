import { z } from "zod";
import { TextType } from "@/types/database";

export const QUIZ_QUESTION_TYPES = [
  "what",
  "who",
  "when",
  "where",
  "why",
] as const;

export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const quizQuestionSchema = z.object({
  id: z.number().int().min(0),
  type: z.enum(QUIZ_QUESTION_TYPES, {
    error: "Tipo de pergunta é obrigatório",
  }),
  question: z
    .string()
    .min(1, "Texto da pergunta é obrigatório")
    .max(500, "Pergunta deve ter no máximo 500 caracteres"),
  options: z
    .array(z.string().min(1, "Opção não pode estar vazia"))
    .min(2, "Pelo menos 2 opções são obrigatórias")
    .max(5, "Máximo de 5 opções por pergunta"),
  correct: z.number().int().min(0),
});

export const quizDataSchema = z
  .object({
    questions: z
      .array(quizQuestionSchema)
      .min(1, "Pelo menos 1 pergunta é obrigatória")
      .max(10, "Máximo de 10 perguntas"),
  })
  .superRefine((data, ctx) => {
    data.questions.forEach((q, qi) => {
      if (q.correct >= q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", qi, "correct"],
          message: "Resposta correta inválida",
        });
      }
      const unique = new Set(q.options.map((o) => o.trim().toLowerCase()));
      if (unique.size !== q.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", qi, "options"],
          message: "Opções devem ser únicas",
        });
      }
    });
  });

export type QuizDataInput = z.infer<typeof quizDataSchema>;

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
  quiz: quizDataSchema.nullable().optional(),
});

export type TextFormData = z.infer<typeof textSchema>;
