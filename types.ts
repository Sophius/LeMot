export interface VocabWord {
  id: string;
  word: string;      // The lemma/dictionary form
  part_of_speech?: string; // e.g. v. n. adj.
  answer_form?: string; // The specific conjugated form used in the sentence
  meaning: string;
  sentence: string;
  cloze_sentence: string;
  
  // Learning Stats
  streak: number;
  last_seen: string | null; // YYYY-MM-DD or null
  weight: number;           // Priority weight (default 0.5)
  total_attempts: number;
  total_correct: number;
  is_graduated: boolean;
}

export type AppState = 'WELCOME' | 'CONFIG' | 'DETAILS' | 'QUIZ' | 'SUMMARY';

export interface SessionStats {
  totalQuestions: number;
  correctCount: number;
  graduatedCount: number;
  updatedWords: VocabWord[];
}

export interface QuizResult {
  correct: boolean;
  wordId: string;
}
