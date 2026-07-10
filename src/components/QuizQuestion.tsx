"use client";

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
      <h3 className="text-lg font-medium text-black">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label
            key={option}
            className={`
              flex items-center p-4 border rounded-lg cursor-pointer transition-colors
              ${
                selectedAnswer === index
                  ? "border-black bg-gray-50"
                  : "border-gray-300 hover:border-gray-400"
              }
              ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50"}
            `}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={index}
              checked={selectedAnswer === index}
              onChange={() => handleAnswerSelect(index)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={`
              w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
              ${selectedAnswer === index ? "border-black" : "border-gray-300"}
            `}
            >
              {selectedAnswer === index && (
                <div className="w-2 h-2 rounded-full bg-black"></div>
              )}
            </div>
            <span className="text-black flex-1">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
