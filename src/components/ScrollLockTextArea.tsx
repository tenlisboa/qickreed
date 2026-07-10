"use client";

import DOMPurify from "dompurify";
import { useEffect, useRef } from "react";

interface ScrollLockTextAreaProps {
  content: string;
  className?: string;
}

export default function ScrollLockTextArea({
  content,
  className = "",
}: ScrollLockTextAreaProps) {
  const textAreaRef = useRef<HTMLDivElement>(null);

  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "b",
      "i",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "class", "id"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
    ],
    FORBID_ATTR: [
      "onload",
      "onerror",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
    ],
  });

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.scrollTop < 0) {
        target.scrollTop = 0;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const target = e.currentTarget as HTMLElement;
      if (e.deltaY < 0 && target.scrollTop <= 0) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.currentTarget as HTMLElement;
      // Prevent arrow up, page up, home when at top
      if (
        target.scrollTop <= 0 &&
        (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Home")
      ) {
        e.preventDefault();
      }
    };

    textArea.addEventListener("scroll", handleScroll);
    textArea.addEventListener("wheel", handleWheel);
    textArea.addEventListener("keydown", handleKeyDown);

    return () => {
      textArea.removeEventListener("scroll", handleScroll);
      textArea.removeEventListener("wheel", handleWheel);
      textArea.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={textAreaRef}
      className={`overflow-y-auto max-h-96 rounded-base border-[3px] border-black p-6 bg-white text-black focus-brutal ${className}`}
      style={{ scrollBehavior: "smooth" }}
    >
      <div
        className="prose prose-sm max-w-none text-black leading-relaxed"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}
