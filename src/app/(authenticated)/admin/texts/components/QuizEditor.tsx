"use client";

import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import Button from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FormControl } from "@/components/ui/form-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QUIZ_QUESTION_TYPES, type QuizQuestionType } from "../schemas";

const QUIZ_TYPE_LABELS: Record<QuizQuestionType, string> = {
  what: "O Quê",
  who: "Quem",
  when: "Quando",
  where: "Onde",
  why: "Por Que",
};

export interface QuizQuestionInput {
  id: number;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correct: number;
}

export interface QuizEditorProps {
  value: QuizQuestionInput[] | null;
  onChange: (questions: QuizQuestionInput[] | null) => void;
  errors?: string[];
}

function nextId(questions: QuizQuestionInput[]): number {
  return questions.length === 0
    ? 0
    : Math.max(...questions.map((q) => q.id)) + 1;
}

function emptyQuestion(id: number): QuizQuestionInput {
  return {
    id,
    type: "what",
    question: "",
    options: ["", "", "", ""],
    correct: 0,
  };
}

export default function QuizEditor({
  value,
  onChange,
  errors,
}: QuizEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const questions = value ?? [];

  const addQuestion = () => {
    if (questions.length >= 10) return;
    onChange([...questions, emptyQuestion(nextId(questions))]);
  };

  const removeQuestion = (id: number) => {
    const filtered = questions.filter((q) => q.id !== id);
    onChange(filtered.length === 0 ? null : filtered);
  };

  const updateQuestion = (id: number, patch: Partial<QuizQuestionInput>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const addOption = (id: number) => {
    const q = questions.find((q) => q.id === id);
    if (!q || q.options.length >= 5) return;
    updateQuestion(id, { options: [...q.options, ""] });
  };

  const removeOption = (id: number, index: number) => {
    const q = questions.find((q) => q.id === id);
    if (!q || q.options.length <= 2) return;
    const newOptions = q.options.filter((_, i) => i !== index);
    const newCorrect = q.correct >= newOptions.length ? 0 : q.correct;
    updateQuestion(id, { options: newOptions, correct: newCorrect });
  };

  const updateOption = (id: number, index: number, text: string) => {
    const q = questions.find((q) => q.id === id);
    if (!q) return;
    const newOptions = q.options.map((o, i) => (i === index ? text : o));
    updateQuestion(id, { options: newOptions });
  };

  return (
    <div className="border-[3px] border-black rounded-base bg-white shadow-brutal-sm">
      {/* Header - collapsible */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-black">Quiz de Compreensão</h2>
          {questions.length > 0 && (
            <Badge variant="default">{questions.length} pergunta(s)</Badge>
          )}
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-black transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t-[3px] border-black p-4 space-y-4">
          {errors && errors.length > 0 && (
            <Alert variant="error">
              <ul className="list-disc pl-4 space-y-0.5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Alert>
          )}

          {questions.length === 0 && (
            <p className="text-sm text-black/70">
              Nenhum quiz adicionado. O texto pode ser salvo sem quiz, mas a
              avaliação de compreensão exigirá um quiz para funcionar.
            </p>
          )}

          {questions.map((q, qi) => (
            <div
              key={q.id}
              className="border-[3px] border-black rounded-base p-4 space-y-3 bg-white"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">Pergunta {qi + 1}</span>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-black hover:text-error transition-brutal"
                  aria-label={`Remover pergunta ${qi + 1}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <FormControl>
                <Label htmlFor={`q-${q.id}-type`}>Tipo de Pergunta *</Label>
                <Select
                  id={`q-${q.id}-type`}
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(q.id, {
                      type: e.target.value as QuizQuestionType,
                    })
                  }
                >
                  {QUIZ_QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QUIZ_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <Label htmlFor={`q-${q.id}-text`}>Pergunta *</Label>
                <Textarea
                  id={`q-${q.id}-text`}
                  value={q.question}
                  maxLength={500}
                  onChange={(e) =>
                    updateQuestion(q.id, { question: e.target.value })
                  }
                  placeholder="Digite a pergunta..."
                />
                <span className="text-xs text-black/60">
                  {q.question.length}/500 caracteres
                </span>
              </FormControl>

              <div className="space-y-2">
                <Label>Opções * (marque a correta)</Label>
                {q.options.map((opt, oi) => (
                  <div
                    key={`opt-${q.id}-${oi}`}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { correct: oi })}
                      className={`flex-shrink-0 ${q.correct === oi ? "text-black" : "text-black/30 hover:text-black/60"}`}
                      aria-label={`Marcar opção ${oi + 1} como correta`}
                    >
                      <CheckCircleIcon className="h-6 w-6" />
                    </button>
                    <Input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(q.id, oi, e.target.value)}
                      placeholder={`Opção ${oi + 1}`}
                      className={q.correct === oi ? "border-main" : ""}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(q.id, oi)}
                        className="flex-shrink-0 text-black hover:text-error transition-brutal"
                        aria-label={`Remover opção ${oi + 1}`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(q.id)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Adicionar Opção
                  </Button>
                )}
              </div>
            </div>
          ))}

          {questions.length < 10 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={addQuestion}
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar Pergunta
            </Button>
          )}

          {questions.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview
                  ? "Ocultar Pré-visualização"
                  : "Pré-visualizar Quiz"}
              </Button>
            </div>
          )}

          {showPreview && questions.length > 0 && (
            <div className="border-[3px] border-black rounded-base p-4 space-y-4 bg-white/50">
              <h3 className="font-bold text-black">Pré-visualização</h3>
              {questions.map((q, qi) => (
                <div key={q.id} className="space-y-2">
                  <p className="font-bold text-black">
                    {qi + 1}. {q.question || "(pergunta vazia)"}
                  </p>
                  <ul className="space-y-1">
                    {q.options.map((opt, oi) => (
                      <li
                        key={`preview-opt-${q.id}-${oi}`}
                        className={`flex items-center gap-2 text-sm ${q.correct === oi ? "font-bold text-black" : "text-black/70"}`}
                      >
                        {q.correct === oi && (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                        {opt || `(opção ${oi + 1} vazia)`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
