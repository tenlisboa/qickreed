"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Button from "@/components/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center bg-white border border-gray-200 shadow-lg p-8">
            <h1 className="text-3xl font-bold text-black">Algo deu errado</h1>
            <p className="text-gray-600 mt-2">
              Ocorreu um erro inesperado no carregamento do aplicativo. Tente
              novamente em instantes.
            </p>
            {error.digest ? (
              <p className="text-sm text-gray-500 mt-4">
                Código de referência: {error.digest}
              </p>
            ) : null}
            <div className="mt-8">
              <Button variant="primary" onClick={reset}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
