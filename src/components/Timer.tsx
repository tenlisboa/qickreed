"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate: (timeMs: number) => void;
  className?: string;
}

export default function Timer({
  isRunning,
  onTimeUpdate,
  className = "",
}: TimerProps) {
  const [timeMs, setTimeMs] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeMs((prev) => prev + 100);
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    onTimeUpdate(timeMs);
  }, [timeMs, onTimeUpdate]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 100);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds}`;
  };

  return (
    <div
      className={`inline-flex items-center justify-center border-[3px] border-black bg-white rounded-base shadow-brutal-sm px-4 py-2 ${className}`}
    >
      <div className="text-2xl font-mono font-bold text-black tabular-nums">
        {formatTime(timeMs)}
      </div>
    </div>
  );
}
