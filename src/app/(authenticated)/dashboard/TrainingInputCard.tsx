"use client";

import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useActionState, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import SubmitButton from "@/components/SubmitButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormControl } from "@/components/ui/form-control";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/utils/actions/types";
import { type PreparedTrainingText, prepareTrainingText } from "./actions";

const MIN_CHARS = 200;

interface TrainingInputCardProps {
  suggestedWpm: number;
}

export default function TrainingInputCard({
  suggestedWpm,
}: TrainingInputCardProps) {
  const [state, formAction] = useActionState<
    ActionResult<PreparedTrainingText>,
    FormData
  >(prepareTrainingText, null);
  const [content, setContent] = useState("");

  const prepared = state?.data ?? null;
  const targetWpm = suggestedWpm || 200;
  const remaining = MIN_CHARS - content.length;

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center border-[3px] border-black shadow-brutal-sm">
              <ClipboardDocumentIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-black mb-2">
              Material de Treinamento
            </h2>
            <p className="text-gray-600 mb-4">
              Cole o texto que deseja treinar. O sistema vai gerar perguntas de
              compreensão e habilitar o início do treinamento.
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error ? (
            <Alert variant="error">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{state.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <FormControl>
            <Label htmlFor="training-content">Texto para treinamento</Label>
            <Textarea
              id="training-content"
              name="content"
              required
              minLength={MIN_CHARS}
              maxLength={12000}
              rows={8}
              className="w-full"
              placeholder="Cole aqui o texto que você quer ler…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!!prepared}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo de {MIN_CHARS} caracteres.
              {remaining > 0
                ? ` Faltam ${remaining}.`
                : " Texto suficiente para processar."}
            </p>
          </FormControl>

          <input type="hidden" name="language" value="pt-BR" />

          {!prepared ? (
            <SubmitButton
              variant="primary"
              className="px-8"
              pendingLabel="Processando texto…"
            >
              Processar texto
            </SubmitButton>
          ) : null}
        </form>

        {prepared ? (
          <div className="space-y-4">
            <Alert variant="success">
              <AlertTitle>Texto processado!</AlertTitle>
              <AlertDescription>
                {prepared.numWords} palavras · {prepared.quiz.questions.length}{" "}
                perguntas geradas. Você já pode iniciar o treinamento.
              </AlertDescription>
            </Alert>

            <div className="bg-white border-[3px] border-black rounded-none p-4 shadow-brutal-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-black" />
                <span className="font-bold text-black">
                  Pronto para treinar a {targetWpm} PPM
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Velocidade sugerida baseada no seu último diagnóstico (+20%).
              </p>
              <Link
                href={`/training/rsvp/session?textId=${prepared.textId}&targetWpm=${targetWpm}`}
                className="focus-brutal"
              >
                <Button variant="primary" className="px-8">
                  <RocketLaunchIcon className="h-4 w-4 mr-2" />
                  Iniciar Treinamento
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
