"use client";

import { forwardRef } from "react";
import dynamic from "next/dynamic";

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
    ref
  ) => {
    // Calculate word count
    const wordCount = value
      ? value
          .replace(/<[^>]*>/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 0).length
      : 0;

    return (
      <div className={`form-control ${className}`} ref={ref}>
        {label && (
          <label className="label">
            <span className="label-text text-black font-medium">
              {label}
              {required && " *"}
            </span>
            {showWordCount && (
              <span className="label-text-alt text-gray-500">
                {wordCount} palavras
              </span>
            )}
          </label>
        )}

        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-black transition-colors">
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
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
