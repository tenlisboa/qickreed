import type { ReadingMethod } from "@/types/database";

export interface ReaderCategory {
  key: string;
  label: string;
  description: string;
}

const SLOW = 200;
const SUBVOCAL_CEILING = 300;

export function categorizeReader(
  wpm: number,
  method: ReadingMethod,
): ReaderCategory {
  if (method === "visual_only") {
    if (wpm >= SUBVOCAL_CEILING) {
      return {
        key: "visual_fast",
        label: "Leitor Visual Avançado",
        description:
          "Você já lê de forma visual acima do teto de subvocalização (300 PPM).",
      };
    }
    return {
      key: "visual_emerging",
      label: "Leitor Visual em Formação",
      description:
        "Você demonstra leitura visual, mas ainda abaixo do teto de subvocalização.",
    };
  }

  if (method === "inner_voice") {
    if (wpm >= SUBVOCAL_CEILING) {
      return {
        key: "subvocal_fast",
        label: "Subvocalização Rápida",
        description:
          "Você lê com voz interior acima de 300 PPM — pronto para acelerar a transição visual.",
      };
    }
    return {
      key: "subvocal",
      label: "Leitor Subvocal",
      description:
        "Você lê com voz interior. O treinamento RSVP vai quebrar esse teto fonético.",
    };
  }

  if (wpm >= SLOW) {
    return {
      key: "phonetic_steady",
      label: "Leitor Fonético Estável",
      description:
        "Você lê em voz alta com ritmo estável. A transição para leitura visual começa agora.",
    };
  }

  return {
    key: "phonetic_beginner",
    label: "Leitor Fonético Iniciante",
    description:
      "Você lê em voz alta em ritmo inicial. O treinamento vai construir velocidade e silenciar a subvocalização.",
  };
}
