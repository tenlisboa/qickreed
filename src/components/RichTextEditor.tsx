"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";

// Import ReactQuill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  showWordCount?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = "Digite o conteúdo aqui...",
      height = "100%",
      showWordCount = true,
      error,
      label,
      required = false,
      className = "",
    },
    ref,
  ) => {
    // Calculate word count
    const wordCount = value
      ? value
          .replace(/<[^>]*>/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 0).length
      : 0;

    return (
      <div className={`flex flex-col gap-2 ${className}`} ref={ref}>
        {label && (
          <div className="flex items-center justify-between">
            <span className="text-black font-bold">
              {label}
              {required && " *"}
            </span>
            {showWordCount && (
              <span className="text-sm font-medium text-black/70 border-[3px] border-black bg-main rounded-base px-2 py-0.5">
                {wordCount} palavras
              </span>
            )}
          </div>
        )}

        <div className="border-[3px] border-black rounded-base overflow-hidden shadow-brutal-sm focus-within:shadow-brutal transition-brutal">
          <ReactQuill
            theme="snow"
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            style={{ height }}
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link"],
                ["clean"],
              ],
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="border-[3px] border-black bg-error text-black rounded-base shadow-brutal-sm px-3 py-1 text-sm font-bold"
          >
            {error}
          </div>
        )}
      </div>
    );
  },
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
