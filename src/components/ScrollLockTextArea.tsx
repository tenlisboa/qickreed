"use client";

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
      className={`overflow-y-auto max-h-96 border border-gray-300 rounded-lg p-6 bg-white focus:outline-none focus:border-black ${className}`}
      tabIndex={0}
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="prose prose-sm max-w-none text-black leading-relaxed">
        {content.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
