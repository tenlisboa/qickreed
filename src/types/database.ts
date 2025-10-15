export type TextType = "diagnostic" | "training";

export interface Text {
  id: string;
  type: TextType;
  title: string;
  content: string;
  num_words: number;
  quiz_json: QuizData | null;
  language: string;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // index of correct option (0-based)
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface DiagnosticSession {
  id: string;
  user_id: string;
  text_id: string;
  reading_time_ms: number;
  comprehension_score: number;
  wpm: number;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  text_id: string;
  target_wpm: number;
  duration_time_s: number;
  created_at: string;
}

export interface AssessmentResult {
  wpm: number;
  comprehension_score: number;
  target_wpm: number;
  text_title: string;
  reading_time_seconds: number;
}

export interface UserAssessmentHistory {
  id: string;
  wpm: number;
  comprehension_score: number;
  created_at: string;
  text_title: string;
}
