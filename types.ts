
export interface Word {
  id: string;
  term: string;
  phonetic: string;
  partOfSpeech: string; // e.g., (n.), (v.)
  meaning: string;
  example: string;
  exampleTranslation: string;
  category: string;
  level: '1200' | '800';
  pastExamCount?: number;
  examSource?: string; // e.g. "109會考"
  syllables?: string; // e.g. "pi-a-no" for explicit natural phonics control
  tags?: string; // New field: store "unfamiliar" or other custom tags
  mistakeCount?: number; // New field: sync mistake count to sheet
  coreTag?: string; // New field: e.g. "114年", "113年"
}

export interface QuizQuestion {
  wordId: string;
  wordTerm?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  source?: string; // New field for identifying exam source (e.g., "111年會考")
  grammarTag?: string; // New field for Grammar Unit tagging (e.g., "未來式", "現在完成式")
}

export interface ExamSource {
  year: string; // e.g. "112", "111補考"
  question: string;
  answer?: string;
  options?: string[]; // Optional, if we want to use it for quiz directly
  translation?: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LIST = 'LIST',
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ',
  STATS = 'STATS',
  GRAMMAR = 'GRAMMAR',
  PROGRESS = 'PROGRESS',
  ARTICLES = 'ARTICLES'
}

export interface Article {
  id: string;
  title: string;
  english: string;
  chinese: string;
  createdAt: string;
}

export interface UserProgress {
  markedUnfamiliar: string[]; // array of word IDs
  quizCounts: Record<string, number>; // wordId -> count
  lastQuestions: Record<string, QuizQuestion>; // wordId -> last question object
  mistakeQuestions?: QuizQuestion[]; // List of specific questions answered incorrectly
  mistakeCounts?: Record<string, number>; // Manual mistake counter: wordId -> count
  completedPages?: string[]; // New: Track completed "Category-Page" (e.g., "人物-1")
}

// --- New Types for Multi-User & SRS ---

export interface UserVocabProgress {
  username?: string; // Optional in map
  wordId?: string; // Optional in map
  mapViewed: boolean;
  testedCount: number;
  correctCount: number;
  nextReviewDate: string; // ISO Date string
  isMarked: boolean;
}

export type UserVocabProgressMap = Record<string, UserVocabProgress>;

export interface DailyMission {
  newWords: Word[];
  reviewWords: Word[];
  masteryWords: Word[];
}

export interface QuizResultSubmission {
  wordId: string;
  isCorrect: boolean;
}

export interface GrammarMapData {
  [unit: string]: {
    highestScore: number;
    stars: number;
  };
}

export interface FamilyStats {
  leaderboard: {
    id?: string; // User ID (e.g., 'Dad')
    username: string;
    avatar: string;
    quizCount: number;
    mistakeCount: number;
    masteryPct: number;
    title: string;
    color: string;
  }[];
  familyProgress: {
    totalWords: number;
    masteredWords: number;
    viewedWords: number;
  };
}

export interface MollyGrammarUnit {
  id: string;
  title: string;
  summary: string;
  content: {
    type: 'text' | 'table' | 'list';
    title?: string;
    data: string | string[][] | string[];
    highlight?: boolean;
  }[];
  questions: QuizQuestion[];
  subQuizzes?: { title: string; questionIds: string[]; }[]; // New: For sub-quizzes within a grammar unit
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // Emoji
  color: string; // Tailwind bg color class
}
