export enum TextType {
  DIAGNOSTIC = "diagnostic",
  TRAINING = "training",
}

export enum TrainingType {
  RSVP = "rsvp",
}

export enum UserRole {
  MEMBER = "member",
  ADMIN = "admin",
}

export enum ReadingMethod {
  OUT_LOUD = "out_loud",
  INNER_VOICE = "inner_voice",
  VISUAL_ONLY = "visual_only",
}

export const READING_METHOD_LABELS: Record<ReadingMethod, string> = {
  [ReadingMethod.OUT_LOUD]: "Em voz alta",
  [ReadingMethod.INNER_VOICE]: "Com voz interior",
  [ReadingMethod.VISUAL_ONLY]: "Apenas visual",
} as const;

export interface Text {
  id: string;
  type: TextType;
  title: string;
  content: string;
  num_words: number;
  quiz_json: QuizData | null;
  language: string;
  user_id: string | null;
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
  reading_method: ReadingMethod | null;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  text_id: string;
  training_type: TrainingType;
  target_wpm: number;
  duration_time_s: number;
  comprehension_score: number | null;
  passed: boolean | null;
  created_at: string;
}

export interface AssessmentResult {
  wpm: number;
  comprehension_score: number;
  target_wpm: number;
  text_title: string;
  reading_time_seconds: number;
  reading_method: ReadingMethod | null;
  category: string;
  level: number;
}

export interface UserAssessmentHistory {
  id: string;
  wpm: number;
  comprehension_score: number;
  created_at: string;
  text_title: string;
}

/**
 * A single point on the Operations Dashboard timeline.
 * `ppm` is sourced from `diagnostic_session.wpm` or `training_session.target_wpm`.
 * `comprehension` is only available for diagnostic sessions (null for training).
 */
export interface DashboardTimelinePoint {
  date: string;
  ppm: number | null;
  comprehension: number | null;
  type: "diagnostic" | "training";
}

export interface TrainingSessionResult {
  id: string;
  text_title: string;
  target_wpm: number;
  duration_time_s: number;
  comprehension_score: number | null;
  passed: boolean | null;
  next_target_wpm: number;
  created_at: string;
}

export interface DashboardData {
  current_wpm: number;
  current_comprehension: number;
  target_wpm: number;
  timeline: DashboardTimelinePoint[];
  has_assessments: boolean;
}

export interface Profile {
  id: string;
  role: UserRole;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingHistory {
  id: string;
  training_type: TrainingType;
  target_wpm: number;
  duration_time_s: number;
  comprehension_score: number | null;
  passed: boolean | null;
  created_at: string;
  text_title: string;
}
