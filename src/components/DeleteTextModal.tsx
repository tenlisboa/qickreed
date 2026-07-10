"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { deleteText } from "@/app/(authenticated)/admin/texts/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface DeleteTextModalProps {
  textId: string;
  textTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteTextModal({
  textId,
  textTitle,
  isOpen,
  onClose,
  onSuccess,
}: DeleteTextModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteText(textId);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Erro ao deletar texto");
      }
    } catch (_err) {
      setError("Erro inesperado ao deletar texto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deletar Texto</DialogTitle>
          <DialogDescription>Esta ação não pode ser desfeita</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-black">Tem certeza que deseja deletar o texto:</p>
          <div className="border-[3px] border-black bg-white p-3 rounded-base shadow-brutal-sm">
            <p className="font-medium text-black">&quot;{textTitle}&quot;</p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 border-[3px] border-black bg-error px-4 py-3 rounded-base shadow-brutal-sm text-black"
            >
              <TrashIcon className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center border-[3px] border-black bg-white px-4 py-2 text-sm font-medium text-black rounded-base shadow-brutal-sm transition-brutal hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-brutal disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-error px-4 py-2 text-sm font-medium text-black rounded-base shadow-brutal-sm transition-brutal hover:shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-brutal disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" />
                Deletando...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                Deletar
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
