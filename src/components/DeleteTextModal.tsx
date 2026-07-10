"use client";

import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { deleteText } from "@/app/(authenticated)/admin/texts/actions";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 shadow-lg rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">
                Deletar Texto
              </h3>
              <p className="text-sm text-gray-600">
                Esta ação não pode ser desfeita
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Tem certeza que deseja deletar o texto:
          </p>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-6">
            <p className="font-medium text-black">"{textTitle}"</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Error</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost text-black hover:bg-gray-100 border border-gray-300"
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn bg-red-600 hover:bg-red-700 text-white border-none"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deletando...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4" />
                  Deletar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
