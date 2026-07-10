"use client";

import { Radio } from "@/components/ui/radio";
import type { QuizQuestion as QuizQuestionType } from "@/types/database";

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (questionId: number, answerIndex: number) => void;
  selectedAnswer?: number;
  disabled?: boolean;
}

export default function QuizQuestion({
  question,
  onAnswer,
  selectedAnswer,
  disabled = false,
}: QuizQuestionProps) {
  const handleAnswerSelect = (answerIndex: number) => {
    if (!disabled) {
      onAnswer(question.id, answerIndex);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-black">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const optionId = `question-${question.id}-option-${index}`;
          return (
            <label
              key={option}
              htmlFor={optionId}
              className={`flex items-center p-4 border-[3px] border-black rounded-base cursor-pointer transition-brutal shadow-brutal-sm ${
                selectedAnswer === index
                  ? "bg-main shadow-brutal"
                  : "bg-white hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px]"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Radio
                id={optionId}
                name={`question-${question.id}`}
                value={index}
                checked={selectedAnswer === index}
                onChange={() => handleAnswerSelect(index)}
                disabled={disabled}
                className="mr-3"
              />
              <span className="text-black flex-1 font-medium">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
