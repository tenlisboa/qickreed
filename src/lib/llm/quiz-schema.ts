import { z } from "zod";
import type { QuizData, QuizQuestion } from "@/types/database";
import { type ChatMessage, callChat, LlmClientError } from "./client";

const MAX_QUESTIONS = 5;
const MIN_OPTIONS = 4;
const MAX_OPTIONS = 5;
const MAX_RETRIES = 3;
const MAX_CONTENT_CHARS = 12_000;

const llmQuizQuestionSchema = z.object({
  type: z.enum(["what", "who", "when", "where", "why"]),
  question: z.string().min(1).max(500),
  options: z
    .array(z.string().min(1).max(300))
    .min(MIN_OPTIONS)
    .max(MAX_OPTIONS),
  correct_answer: z.number().int().min(0),
});

const llmQuizResponseSchema = z.object({
  questions: z.array(llmQuizQuestionSchema).length(MAX_QUESTIONS),
});

export type LlmQuizResponse = z.infer<typeof llmQuizResponseSchema>;

export class QuizGenerationError extends Error {
  constructor(
    message: string,
    readonly code: "validation" | "llm_error" | "max_retries" | "empty_content",
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "QuizGenerationError";
  }
}

function buildStrictExtractionPrompt(
  textContent: string,
  language: string,
): ChatMessage[] {
  const langName = language === "pt-BR" ? "Portuguese (pt-BR)" : language;

  const system = `You are a strict context extractor for a speed-reading comprehension test.
Your ONLY job is to formulate questions whose answers are contained EXCLUSIVELY in the provided text.
Do NOT use outside knowledge. Do NOT ask about opinions or interpretation.
Return STRICT JSON only — no markdown, no code fences, no commentary.
The output MUST match this exact schema:
{
  "questions": [
    {
      "type": "what" | "who" | "when" | "where" | "why",
      "question": "<question text in ${langName}, max 500 chars>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correct_answer": <0-based index of the correct option>
    }
  ]
}
Rules:
- Produce EXACTLY ${MAX_QUESTIONS} questions: one of each type (what, who, when, where, why).
- Each question must have ${MIN_OPTIONS} options (you MAY use ${MAX_OPTIONS}).
- Exactly one option per question is correct; "correct_answer" is the 0-based index of that option.
- All options must be distinct within a question.
- All text (questions + options) must be in ${langName}.
- Answers must be grounded EXCLUSIVELY in the provided text.`;

  const truncated =
    textContent.length > MAX_CONTENT_CHARS
      ? `${textContent.slice(0, MAX_CONTENT_CHARS)}\n[...truncated...]`
      : textContent;

  const user = `TEXT:\n"""\n${truncated}\n"""\n\nGenerate the ${MAX_QUESTIONS}-question comprehension quiz now as strict JSON.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function extractJsonObject(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return content.slice(start, end + 1);
  }
  return content.trim();
}

function validateAndNormalize(raw: LlmQuizResponse): QuizData {
  const questions: QuizQuestion[] = raw.questions.map((q, index) => {
    if (q.correct_answer >= q.options.length) {
      throw new QuizGenerationError(
        `Question ${index + 1}: correct_answer index out of range`,
        "validation",
      );
    }
    const unique = new Set(q.options.map((o) => o.trim().toLowerCase()));
    if (unique.size !== q.options.length) {
      throw new QuizGenerationError(
        `Question ${index + 1}: options must be unique`,
        "validation",
      );
    }
    return {
      id: index + 1,
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correct: q.correct_answer,
    };
  });

  return { questions };
}

export interface GenerateQuizOptions {
  temperature?: number;
  maxRetries?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function generateQuiz(
  textContent: string,
  language: string,
  options: GenerateQuizOptions = {},
): Promise<QuizData> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const messages = buildStrictExtractionPrompt(textContent, language);
  const stripped = textContent.replace(/<[^>]*>/g, "").trim();

  if (stripped.length === 0) {
    throw new QuizGenerationError("Text content is empty", "empty_content");
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callChat(messages, {
        temperature: options.temperature ?? 0.1,
        timeoutMs: options.timeoutMs,
        signal: options.signal,
      });

      const jsonStr = extractJsonObject(result.content);
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseErr) {
        lastError = new QuizGenerationError(
          `Attempt ${attempt}: LLM returned invalid JSON`,
          "validation",
          parseErr,
        );
        continue;
      }

      const validation = llmQuizResponseSchema.safeParse(parsed);
      if (!validation.success) {
        lastError = new QuizGenerationError(
          `Attempt ${attempt}: schema validation failed — ${validation.error.issues.map((i) => i.message).join("; ")}`,
          "validation",
          validation.error.issues,
        );
        continue;
      }

      return validateAndNormalize(validation.data);
    } catch (err) {
      lastError = err;
      if (err instanceof LlmClientError) {
        // network / timeout / HTTP error — retry
        continue;
      }
      if (err instanceof QuizGenerationError) {
        lastError = err;
        continue;
      }
      lastError = err;
    }
  }

  if (lastError instanceof QuizGenerationError) {
    throw lastError;
  }
  throw new QuizGenerationError(
    `Quiz generation failed after ${maxRetries} attempts`,
    "max_retries",
    lastError,
  );
}
