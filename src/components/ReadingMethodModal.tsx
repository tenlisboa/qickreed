"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Radio } from "@/components/ui/radio";
import { READING_METHOD_LABELS, ReadingMethod } from "@/types/database";

interface ReadingMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (method: ReadingMethod) => void;
}

const OPTIONS: ReadingMethod[] = [
  ReadingMethod.OUT_LOUD,
  ReadingMethod.INNER_VOICE,
  ReadingMethod.VISUAL_ONLY,
];

export default function ReadingMethodModal({
  isOpen,
  onClose,
  onSubmit,
}: ReadingMethodModalProps) {
  const [selected, setSelected] = useState<ReadingMethod | null>(null);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected);
    setSelected(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Como você leu o texto?</DialogTitle>
          <DialogDescription>
            Sua resposta nos ajuda a categorizar seu perfil de leitura.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-3">
          <legend className="sr-only">
            Selecione o método de leitura utilizado
          </legend>
          {OPTIONS.map((method) => {
            const optionId = `reading-method-${method}`;
            return (
              <label
                key={method}
                htmlFor={optionId}
                className={`flex items-center p-4 border-[3px] border-black rounded-base cursor-pointer transition-brutal shadow-brutal-sm ${
                  selected === method
                    ? "bg-main shadow-brutal"
                    : "bg-white hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px]"
                }`}
              >
                <Radio
                  id={optionId}
                  name="reading-method"
                  value={method}
                  checked={selected === method}
                  onChange={() => setSelected(method)}
                  className="mr-3"
                />
                <span className="text-black flex-1 font-medium">
                  {READING_METHOD_LABELS[method]}
                </span>
              </label>
            );
          })}
        </fieldset>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center border-[3px] border-black bg-white px-4 py-2 text-sm font-medium text-black rounded-base shadow-brutal-sm transition-brutal hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-brutal"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-main px-4 py-2 text-sm font-medium text-black rounded-base shadow-brutal-sm transition-brutal hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-brutal disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
