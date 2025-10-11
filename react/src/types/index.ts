export interface User {
  level: number;
  xp: number;
  maxXp: number;
  isPremium: boolean;
  casesCompleted: number;
  totalQuestions: number;
  correctDiagnoses: number;
}

export interface Patient {
  id: string;
  name: string;
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

export interface Case {
  id: string;
  patient: Patient;
  messages: Message[];
  status: 'new' | 'active' | 'completed';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  sessions: number;
  backstoryRevealed: boolean;
  selectedSymptoms: string[];
  diagnosis: string | null;
  diagnosisCorrect: boolean | null;
  batteryApplied: string | null;
  batteryResults: string | null;
  sessionId: string | null;
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
  mode: 'local' | 'n8n';
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