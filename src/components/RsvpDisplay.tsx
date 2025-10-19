"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/Button";
import { PlayIcon, PauseIcon, StopIcon } from "@heroicons/react/24/outline";

interface RsvpDisplayProps {
  text: string;
  targetWpm: number;
  onComplete: (durationSeconds: number) => void;
  onStop: () => void;
}

export default function RsvpDisplay({
  text,
  targetWpm,
  onComplete,
  onStop,
}: RsvpDisplayProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const wordInterval = Math.round(60000 / targetWpm); // ms per word

  // Handle visibility change (pause when tab is not active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isPlaying) {
        handlePause();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying]);

  // Handle word progression
  useEffect(() => {
    if (isPlaying && !isPaused && currentWordIndex < words.length) {
      intervalRef.current = setTimeout(() => {
        setCurrentWordIndex((prev) => {
          if (prev + 1 >= words.length) {
            handleComplete();
            return prev;
          }
          return prev + 1;
        });
      }, wordInterval);
    } else if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, isPaused, currentWordIndex, wordInterval, words.length]);

  const handleStart = () => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsPaused(true);
      setPausedTime(Date.now());
    }
  };

  const handleResume = () => {
    if (isPaused) {
      const now = Date.now();
      setTotalPausedTime((prev) => prev + (now - pausedTime));
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsPaused(false);
    onStop();
  };

  const handleComplete = () => {
    setIsPlaying(false);
    setIsPaused(false);
    const now = Date.now();
    const totalTime = startTime ? now - startTime - totalPausedTime : 0;
    const durationSeconds = Math.floor(totalTime / 1000);
    onComplete(durationSeconds);
  };

  const getCurrentWord = () => {
    if (currentWordIndex >= words.length) return "";
    return words[currentWordIndex];
  };

  const getProgress = () => {
    return ((currentWordIndex + 1) / words.length) * 100;
  };

  const getEstimatedTimeRemaining = () => {
    if (!isPlaying && !isPaused) return 0;
    const remainingWords = words.length - currentWordIndex;
    return Math.ceil((remainingWords * wordInterval) / 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-black">
                Treinamento RSVP
              </h1>
              <div className="text-sm text-gray-600">
                {currentWordIndex + 1} de {words.length} palavras
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isPlaying && !isPaused && (
                <Button
                  variant="primary"
                  onClick={handleStart}
                  className="px-4 py-2"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
              )}
              {isPlaying && (
                <Button
                  variant="secondary"
                  onClick={handlePause}
                  className="px-4 py-2"
                >
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
              {isPaused && (
                <Button
                  variant="primary"
                  onClick={handleResume}
                  className="px-4 py-2"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleStop}
                className="px-4 py-2"
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Parar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto p-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Progresso: {Math.round(getProgress())}%</span>
            {isPlaying && (
              <span>
                Tempo restante: {Math.floor(getEstimatedTimeRemaining() / 60)}:
                {String(getEstimatedTimeRemaining() % 60).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Word Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div
            className={`text-6xl font-bold text-black transition-all duration-200 ${
              isPlaying ? "opacity-100" : "opacity-60"
            }`}
            style={{
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.2,
            }}
          >
            {getCurrentWord()}
          </div>
          {!isPlaying && !isPaused && (
            <p className="text-gray-600 mt-8 text-lg">
              Clique em "Iniciar" para começar o treinamento
            </p>
          )}
          {isPaused && (
            <p className="text-gray-600 mt-8 text-lg">
              Treinamento pausado. Clique em "Retomar" para continuar.
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-sm text-gray-600">
            <p>
              <strong>Instruções:</strong> Mantenha o foco na palavra central.
              Não subvocalize. O treinamento pausa automaticamente quando você
              troca de aba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
