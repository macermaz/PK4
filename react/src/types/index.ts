export type Gender = 'masculine' | 'feminine';

export interface UserProfile {
  id: string;
  name: string;
  gender: Gender;
  specialization?: string;
  createdAt: string;
  isDev: boolean; // Perfil de desarrollador con funciones especiales
}

export interface User {
  profile: UserProfile;
  level: number;
  xp: number;
  maxXp: number;
  coins: number;
  streak: number;
  lastPlayedDate: string | null;
  isPremium: boolean;
  casesCompleted: number;
  totalQuestions: number;
  correctDiagnoses: number;
  unlockedSkins: string[];
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface Patient {
  id: string;
  name: string;
  gender: Gender; // Género del paciente
  age: number;
  occupation: string;
  avatar: string;
  symptoms: string[];
  disorder: string;
  personality: string;
  backstory: string;
  rapport: number;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'patient';
  timestamp: Date;
  type: 'text' | 'battery' | 'results';
  score?: number;
  color?: string;
}

export type CaseDifficulty = 'entrenamiento' | 'normal' | 'dificil' | 'realista';
export type CaseStatus =
  | 'new'
  | 'active'
  | 'diagnosed'
  | 'awaiting_treatment'      // Esperando que el usuario envíe tratamiento
  | 'awaiting_result'         // Esperando respuesta del paciente (2 días)
  | 'treatment_failed'        // Tratamiento incorrecto, segunda oportunidad
  | 'completed'
  | 'cancelled'
  | 'failed';                 // Perdió la partida

// Aspectos de vida a explorar durante la entrevista
export interface LifeAspects {
  laboral: boolean;           // Situación laboral
  familiar: boolean;          // Situación familiar
  social: boolean;            // Relaciones sociales
  ocio: boolean;              // Hobbies, tiempo libre
  salud: boolean;             // Salud física
  metas: boolean;             // Objetivos, futuro
  autopercepcion: boolean;    // Cómo se ve a sí mismo
  trauma: boolean;            // Historia de eventos traumáticos
  sueno: boolean;             // Patrón de sueño
  alimentacion: boolean;      // Hábitos alimenticios
}

export interface Case {
  id: string;
  patient: Patient;
  messages: Message[];
  status: CaseStatus;
  difficulty: CaseDifficulty;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  sessions: number;
  questionsThisSession: number;
  backstoryRevealed: boolean;
  selectedSymptoms: string[];
  notes: CaseNote[];
  diagnosis: string | null;
  diagnosisCorrect: boolean | null;      // OCULTO hasta resultado
  treatment: string | null;
  treatmentAttempts: number;             // Número de intentos (máx 2)
  treatmentCorrect: boolean | null;      // OCULTO hasta resultado
  treatmentSentDate: string | null;
  testsApplied: string[];                // IDs de tests aplicados (máx 2)
  testsResults: TestResult[];            // Resultados de tests aplicados
  sessionId: string | null;
  isFromFamily: boolean;
  rapport: number;
  createdAt: string;
  // Métricas de exploración
  lifeAspectsExplored: LifeAspects;
  // Puntuación final
  finalScore: CaseFinalScore | null;
}

// Puntuación final del caso
export interface CaseFinalScore {
  diagnosisFirstTry: boolean;            // Diagnóstico correcto a la primera
  treatmentFirstTry: boolean;            // Tratamiento correcto a la primera
  questionQuality: number;               // Promedio de calidad de preguntas (0-100)
  lifeAspectsScore: number;              // % de aspectos explorados
  rapportFinal: number;                  // Rapport final
  totalScore: number;                    // Puntuación total (0-100)
  stars: number;                         // Estrellas (1-5)
}

export interface CaseNote {
  id: string;
  text: string;
  type: 'symptom' | 'observation' | 'general';
  timestamp: string;
}

export interface TestResult {
  testId: string;
  testName: string;
  score: number;
  interpretation: string;
  date: string;
}

export interface DSMData {
  categories: {
    [key: string]: string[];
  };
  disorders: {
    [key: string]: {
      name: string;
      symptoms: string[];
      criteria: number;
      duration: string;
      description: string;
    };
  };
}

export interface TestBattery {
  id: string;
  name: string;
  type: string;
  description: string;
  duration: string;
}

export interface PsykTokVideo {
  id: string;
  title: string;
  author: string;
  duration: string;
  description: string;
  likes: number;
  category: string;
}

export interface AIConfig {
  mode: 'local' | 'groq' | 'n8n';
  endpoint: string;
  timeout: number;
}

export interface AIResponse {
  response: string;
  score: number;
  color: string;
  sessionId: string;
  mode: string;
  rawData?: any;
}