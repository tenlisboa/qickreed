"use client";

import {
  ArrowRightIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";

interface RsvpDisplayProps {
  text: string;
  targetWpm: number;
  onComplete: (durationSeconds: number) => void;
  onStop: () => void;
}

interface RegressionEvent {
  type: "mousedown" | "selectstart";
  wordIndex: number;
  timestamp: number;
}

const MIN_WPM = 80;
const MAX_WPM = 800;
const WPM_STEP = 10;
const WORDS_PER_BLOCK = 500;

export default function RsvpDisplay({
  text,
  targetWpm,
  onComplete,
  onStop,
}: RsvpDisplayProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [wpm, setWpm] = useState(
    Math.min(Math.max(targetWpm, MIN_WPM), MAX_WPM),
  );
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [onBreak, setOnBreak] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastWordTimeRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const isPausedRef = useRef(isPaused);
  const currentWordIndexRef = useRef(currentWordIndex);
  const wpmRef = useRef(wpm);
  const startTimeRef = useRef(startTime);
  const pausedTimeRef = useRef(pausedTime);
  const totalPausedTimeRef = useRef(totalPausedTime);
  const onBreakRef = useRef(onBreak);
  const regressionLogRef = useRef<RegressionEvent[]>([]);

  const words = text.split(/\s+/).filter((word) => word.length > 0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);
  useEffect(() => {
    wpmRef.current = wpm;
  }, [wpm]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  useEffect(() => {
    pausedTimeRef.current = pausedTime;
  }, [pausedTime]);
  useEffect(() => {
    totalPausedTimeRef.current = totalPausedTime;
  }, [totalPausedTime]);
  useEffect(() => {
    onBreakRef.current = onBreak;
  }, [onBreak]);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    const now = performance.now();
    const st = startTimeRef.current;
    const tpt = totalPausedTimeRef.current;
    const totalTime = st ? now - st - tpt : 0;
    const durationSeconds = Math.floor(totalTime / 1000);
    onComplete(durationSeconds);
  }, [onComplete]);

  const rafLoop = useCallback(
    (now: number) => {
      if (!isPlayingRef.current || isPausedRef.current) {
        rafRef.current = null;
        return;
      }

      const last = lastWordTimeRef.current;
      const interval = 60000 / wpmRef.current;

      if (last === null) {
        lastWordTimeRef.current = now;
      } else if (now - last >= interval) {
        const next = currentWordIndexRef.current + 1;

        if (next >= words.length) {
          lastWordTimeRef.current = null;
          rafRef.current = null;
          handleComplete();
          return;
        }

        const isBlockBoundary =
          next % WORDS_PER_BLOCK === 0 && next < words.length;

        currentWordIndexRef.current = next;
        setCurrentWordIndex(next);
        lastWordTimeRef.current = now;

        if (isBlockBoundary) {
          setIsPlaying(false);
          setIsPaused(true);
          setPausedTime(performance.now());
          setOnBreak(true);
          rafRef.current = null;
          return;
        }
      }

      rafRef.current = requestAnimationFrame(rafLoop);
    },
    [words.length, handleComplete],
  );

  useEffect(() => {
    if (isPlaying && !isPaused) {
      rafRef.current = requestAnimationFrame(rafLoop);
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, isPaused, rafLoop]);

  const handleStart = useCallback(() => {
    if (!startTimeRef.current) {
      const now = performance.now();
      setStartTime(now);
      startTimeRef.current = now;
    }
    lastWordTimeRef.current = null;
    setIsPlaying(true);
    setIsPaused(false);
    setOnBreak(false);
  }, []);

  const handlePause = useCallback(() => {
    if (isPlayingRef.current) {
      setIsPlaying(false);
      setIsPaused(true);
      setPausedTime(performance.now());
    }
  }, []);

  const handleResume = useCallback(() => {
    if (isPausedRef.current) {
      const now = performance.now();
      setTotalPausedTime((prev) => prev + (now - pausedTimeRef.current));
      lastWordTimeRef.current = null;
      setIsPlaying(true);
      setIsPaused(false);
      setOnBreak(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlayingRef.current) {
      handlePause();
    } else if (isPausedRef.current) {
      handleResume();
    } else {
      handleStart();
    }
  }, [handlePause, handleResume, handleStart]);

  const logRegression = useCallback((type: RegressionEvent["type"]) => {
    regressionLogRef.current.push({
      type,
      wordIndex: currentWordIndexRef.current,
      timestamp: performance.now(),
    });
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    onStop();
  }, [onStop]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isPlayingRef.current) {
        handlePause();
      } else if (
        document.visibilityState === "visible" &&
        isPausedRef.current &&
        !onBreakRef.current
      ) {
        handleResume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handlePause, handleResume]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause]);

  useEffect(() => {
    const handleAutoStart = () => {
      if (!startTimeRef.current) {
        const now = performance.now();
        setStartTime(now);
        startTimeRef.current = now;
      }
      lastWordTimeRef.current = null;
      setIsPlaying(true);
      setIsPaused(false);
      setOnBreak(false);
    };
    window.addEventListener("rsvp-autostart", handleAutoStart);
    return () => window.removeEventListener("rsvp-autostart", handleAutoStart);
  }, []);

  useEffect(() => {
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      logRegression("selectstart");
    };
    document.addEventListener("selectstart", handleSelectStart);
    return () => document.removeEventListener("selectstart", handleSelectStart);
  }, [logRegression]);

  useEffect(() => {
    const handleMouseDown = (e: Event) => {
      e.preventDefault();
      logRegression("mousedown");
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [logRegression]);

  const clampWpm = useCallback((next: number) => {
    const clamped = Math.min(Math.max(next, MIN_WPM), MAX_WPM);
    setWpm(clamped);
  }, []);

  const currentWord =
    currentWordIndex < words.length ? words[currentWordIndex] : "";
  const progressPct = words.length
    ? ((currentWordIndex + 1) / words.length) * 100
    : 0;

  const currentBlock = Math.floor(currentWordIndex / WORDS_PER_BLOCK);
  const totalBlocks = Math.max(1, Math.ceil(words.length / WORDS_PER_BLOCK));
  const wordsInCurrentBlock =
    currentWordIndex - currentBlock * WORDS_PER_BLOCK + 1;
  const wordsRemainingInBlock = WORDS_PER_BLOCK - wordsInCurrentBlock;

  return (
    <div
      className="training-surface min-h-screen flex flex-col select-none"
      style={{ userSelect: "none" }}
    >
      {/* Minimal Progress Bar — PRD: minimalist, top of screen */}
      <div className="border-b-[3px] border-white px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2 text-sm font-bold text-white">
            <span>
              Palavra {currentWordIndex + 1} / {words.length}
            </span>
            {totalBlocks > 1 && (
              <span>
                Bloco {currentBlock + 1} / {totalBlocks}
              </span>
            )}
          </div>
          <div
            className="training-progress-track w-full h-2 border-[3px] border-white rounded-base overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="training-progress-fill h-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Word Display — dark, bold, center-anchored at viewport middle */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div
          className="training-word text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className={`font-bold leading-none ${
              isPlaying ? "opacity-100" : "opacity-70"
            }`}
            style={{
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              fontSize: "clamp(2.5rem, 8vw, 6rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {currentWord}
          </div>
        </div>

        {/* Idle / paused / break overlays — centered, non-distracting */}
        {!isPlaying && !isPaused && !onBreak && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <p className="text-white text-lg font-bold mb-6 text-center px-4">
              Clique em &quot;Iniciar&quot; para começar o treinamento
            </p>
            <Button
              variant="primary"
              onClick={handleStart}
              className="px-8 py-3 text-lg"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Iniciar
            </Button>
          </div>
        )}

        {isPaused && !onBreak && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <p className="text-white text-lg font-bold mb-6 text-center px-4">
              Treinamento pausado. Espaço para retomar.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleResume}
                className="px-6 py-3"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Retomar
              </Button>
              <Button
                variant="outline"
                onClick={handleStop}
                className="px-6 py-3 bg-white"
              >
                <StopIcon className="h-5 w-5 mr-2" />
                Parar
              </Button>
            </div>
          </div>
        )}

        {onBreak && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-6">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 border-[3px] border-white bg-main rounded-base flex items-center justify-center mx-auto mb-6">
                <ArrowRightIcon className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Pausa obrigatória
              </h2>
              <p className="text-white text-base mb-2">
                Você completou o bloco {currentBlock + 1} de {totalBlocks}.
              </p>
              <p className="text-white/80 text-sm mb-8">
                Para evitar a fadiga ocular, faça uma pequena pausa antes de
                continuar. Olhe para um ponto distante por alguns segundos.
              </p>
              <Button
                variant="primary"
                onClick={handleResume}
                className="px-8 py-3 text-lg"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Continuar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Minimal WPM control — footer, subtle */}
      <div className="border-t-[3px] border-white px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">WPM:</span>
              <span className="text-sm font-bold text-black bg-main border-[3px] border-white rounded-base px-2 py-1 min-w-[64px] text-center">
                {wpm}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clampWpm(wpm - WPM_STEP)}
                className="px-2 py-1 bg-white"
                aria-label="Diminuir WPM"
              >
                −
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clampWpm(wpm + WPM_STEP)}
                className="px-2 py-1 bg-white"
                aria-label="Aumentar WPM"
              >
                +
              </Button>
            </div>
            <input
              type="range"
              min={MIN_WPM}
              max={MAX_WPM}
              step={WPM_STEP}
              value={wpm}
              onChange={(e) => clampWpm(Number(e.target.value))}
              className="flex-1 max-w-xs accent-[#FFD23F]"
              aria-label="Ajustar WPM"
            />
            {isPlaying && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                className="px-4 py-2 bg-white"
              >
                <PauseIcon className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
          </div>
          {totalBlocks > 1 && (
            <p className="text-xs text-white/70 mt-2 text-center">
              {wordsRemainingInBlock > 0
                ? `${wordsRemainingInBlock} palavras até a próxima pausa`
                : "Pausa obrigatória ao final deste bloco"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
