import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Case, Patient, Message, CaseDifficulty, CaseNote, LifeAspects, CaseFinalScore, UserProfile } from '../types';
import { mockPatients } from '../data/mockData';
import { IS_DEVELOPMENT, getInitialUser, log } from '../config/environment';

// Re-exportar para compatibilidad con código existente
export const DEV_MODE = IS_DEVELOPMENT;

// Perfil DEV predefinido para modo desarrollador
const DEV_PROFILE: UserProfile = {
  id: 'dev_profile_001',
  name: 'Developer',
  gender: 'masculine',
  specialization: 'Psicología Clínica (Modo DEV)',
  createdAt: new Date().toISOString(),
  isDev: true,
};

// Obtener configuración inicial del usuario desde environment.ts
const initialUserConfig = getInitialUser();

// Estado inicial
interface AppState {
  user: User;
  cases: Case[];
  currentCase: Case | null;
  isLoading: boolean;
}

const initialState: AppState = {
  user: {
    profile: DEV_PROFILE, // Perfil DEV por defecto
    level: initialUserConfig.level,
    xp: initialUserConfig.xp,
    maxXp: 100,
    coins: initialUserConfig.coins,
    streak: 0,
    lastPlayedDate: null,
    isPremium: false,
    casesCompleted: 0,
    totalQuestions: 0,
    correctDiagnoses: 0,
    unlockedSkins: ['default'],
    settings: {
      theme: 'light',
      fontSize: 'medium',
      soundEnabled: true,
      vibrationEnabled: true,
      notificationsEnabled: true,
    },
  },
  cases: [],
  currentCase: null,
  isLoading: true,
};

// Acciones
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: Partial<User> }
  | { type: 'SET_CASES'; payload: Case[] }
  | { type: 'ADD_CASE'; payload: Case }
  | { type: 'UPDATE_CASE'; payload: { id: string; updates: Partial<Case> } }
  | { type: 'REMOVE_CASE'; payload: string }
  | { type: 'SET_CURRENT_CASE'; payload: Case | null }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'SPEND_COINS'; payload: number }
  | { type: 'UPDATE_STREAK' }
  | { type: 'COMPLETE_CASE'; payload: { caseId: string; correct: boolean; xpGained: number; coinsGained: number } }
  | { type: 'CANCEL_CASE'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { caseId: string; message: Message } }
  | { type: 'MARK_MESSAGES_READ'; payload: string };

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    
    case 'SET_CASES':
      return { ...state, cases: action.payload };
    
    case 'ADD_CASE':
      return { ...state, cases: [...state.cases, action.payload] };
    
    case 'UPDATE_CASE':
      return {
        ...state,
        cases: state.cases.map(case_ => 
          case_.id === action.payload.id 
            ? { ...case_, ...action.payload.updates }
            : case_
        ),
        currentCase: state.currentCase?.id === action.payload.id 
          ? { ...state.currentCase, ...action.payload.updates }
          : state.currentCase,
      };
    
    case 'SET_CURRENT_CASE':
      return { ...state, currentCase: action.payload };
    
    case 'ADD_XP':
      const newXp = state.user.xp + action.payload;
      let newLevel = state.user.level;
      let newMaxXp = state.user.maxXp;
      
      // Verificar si sube de nivel
      if (newXp >= newMaxXp) {
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.2);
      }
      
      return {
        ...state,
        user: {
          ...state.user,
          xp: newXp,
          level: newLevel,
          maxXp: newMaxXp,
        },
      };
    
    case 'REMOVE_CASE':
      return {
        ...state,
        cases: state.cases.filter(case_ => case_.id !== action.payload),
      };

    case 'ADD_COINS':
      return {
        ...state,
        user: {
          ...state.user,
          coins: state.user.coins + action.payload,
        },
      };

    case 'SPEND_COINS':
      return {
        ...state,
        user: {
          ...state.user,
          coins: Math.max(0, state.user.coins - action.payload),
        },
      };

    case 'UPDATE_STREAK':
      const today = new Date().toDateString();
      const lastPlayed = state.user.lastPlayedDate;
      let newStreak = state.user.streak;

      if (lastPlayed) {
        const lastDate = new Date(lastPlayed);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
          newStreak += 1;
        } else if (lastDate.toDateString() !== today) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      return {
        ...state,
        user: {
          ...state.user,
          streak: newStreak,
          lastPlayedDate: today,
        },
      };

    case 'COMPLETE_CASE':
      return {
        ...state,
        user: {
          ...state.user,
          casesCompleted: state.user.casesCompleted + 1,
          correctDiagnoses: action.payload.correct
            ? state.user.correctDiagnoses + 1
            : state.user.correctDiagnoses,
          xp: state.user.xp + action.payload.xpGained,
          coins: state.user.coins + action.payload.coinsGained,
        },
        cases: state.cases.map(case_ =>
          case_.id === action.payload.caseId
            ? { ...case_, status: 'completed' as const }
            : case_
        ),
      };

    case 'CANCEL_CASE':
      return {
        ...state,
        cases: state.cases.map(case_ =>
          case_.id === action.payload
            ? { ...case_, status: 'cancelled' as const }
            : case_
        ),
        currentCase: state.currentCase?.id === action.payload ? null : state.currentCase,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        cases: state.cases.map(case_ =>
          case_.id === action.payload.caseId
            ? {
                ...case_,
                messages: [...case_.messages, action.payload.message],
                lastMessage: action.payload.message.text,
                lastMessageTime: new Date().toLocaleTimeString(),
                // Incrementar unreadCount solo si el mensaje es del paciente
                unreadCount: action.payload.message.sender === 'patient'
                  ? (case_.unreadCount || 0) + 1
                  : case_.unreadCount,
              }
            : case_
        ),
      };

    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        cases: state.cases.map(case_ =>
          case_.id === action.payload
            ? { ...case_, unreadCount: 0 }
            : case_
        ),
      };

    default:
      return state;
  }
};

// Contexto
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: (caseId: string, message: Message) => void;
  createNewCase: (patient: Patient) => Case;
  generateId: () => string;
  calculateFinalScore: (caseData: Case) => CaseFinalScore;
} | null>(null);

// Hook personalizado
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider');
  }
  return context;
};

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Función para generar ID único
  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Función para crear nuevo caso
  const createNewCase = (patient: Patient, difficulty: CaseDifficulty = 'normal', isFromFamily: boolean = false): Case => {
    const newCase: Case = {
      id: generateId(),
      patient,
      messages: [],
      status: 'new',
      difficulty,
      lastMessage: '',
      lastMessageTime: '',
      unreadCount: 0,
      sessions: 0,
      questionsThisSession: 0,
      backstoryRevealed: false,
      selectedSymptoms: [],
      notes: [],
      diagnosis: null,
      diagnosisCorrect: null,
      treatment: null,
      treatmentAttempts: 0,
      treatmentCorrect: null,
      treatmentSentDate: null,
      testsApplied: [],
      testsResults: [],
      sessionId: null,
      isFromFamily,
      rapport: difficulty === 'realista' ? 50 : 70,
      createdAt: new Date().toISOString(),
      // Métricas de aspectos de vida explorados
      lifeAspectsExplored: {
        laboral: false,
        familiar: false,
        social: false,
        ocio: false,
        salud: false,
        metas: false,
        autopercepcion: false,
        trauma: false,
        sueno: false,
        alimentacion: false,
      },
      finalScore: null,
    };
    return newCase;
  };

  // Función para añadir mensaje - usa dispatch directo para evitar problemas de closure
  const addMessage = (caseId: string, message: Message) => {
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { caseId, message },
    });
  };

  // Función para calcular puntuación final del caso
  const calculateFinalScore = (caseData: Case): CaseFinalScore => {
    // 1. Diagnóstico a la primera (fue correcto desde el principio)
    const diagnosisFirstTry = caseData.diagnosisCorrect === true;

    // 2. Tratamiento a la primera (solo un intento)
    const treatmentFirstTry = (caseData.treatmentAttempts || 1) === 1 && caseData.treatmentCorrect === true;

    // 3. Calidad de preguntas (promedio de scores de mensajes del paciente)
    const patientMessages = caseData.messages.filter(m => m.sender === 'patient' && m.score !== undefined);
    const questionQuality = patientMessages.length > 0
      ? Math.round(patientMessages.reduce((sum, m) => sum + (m.score || 50), 0) / patientMessages.length)
      : 50;

    // 4. Aspectos de vida explorados (% de 10 aspectos)
    const lifeAspects = caseData.lifeAspectsExplored || {};
    const aspectsExplored = Object.values(lifeAspects).filter(Boolean).length;
    const lifeAspectsScore = Math.round((aspectsExplored / 10) * 100);

    // 5. Rapport final
    const rapportFinal = caseData.rapport || 50;

    // 6. Calcular puntuación total ponderada
    // Pesos: Diagnóstico 20%, Tratamiento 30%, Preguntas 25%, Aspectos 15%, Rapport 10%
    let totalScore = 0;
    totalScore += diagnosisFirstTry ? 20 : (caseData.diagnosisCorrect ? 10 : 0);
    totalScore += treatmentFirstTry ? 30 : (caseData.treatmentCorrect ? 15 : 0);
    totalScore += (questionQuality / 100) * 25;
    totalScore += (lifeAspectsScore / 100) * 15;
    totalScore += (rapportFinal / 100) * 10;

    totalScore = Math.round(totalScore);

    // 7. Calcular estrellas (1-5)
    let stars = 1;
    if (totalScore >= 90) stars = 5;
    else if (totalScore >= 75) stars = 4;
    else if (totalScore >= 55) stars = 3;
    else if (totalScore >= 35) stars = 2;

    return {
      diagnosisFirstTry,
      treatmentFirstTry,
      questionQuality,
      lifeAspectsScore,
      rapportFinal,
      totalScore,
      stars,
    };
  };

  // Cargar datos al iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar usuario
        const userData = await AsyncStorage.getItem('@psykat_user');
        if (userData) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(userData) });
        }

        // Cargar casos
        const casesData = await AsyncStorage.getItem('@psykat_cases');
        if (casesData) {
          dispatch({ type: 'SET_CASES', payload: JSON.parse(casesData) });
        } else {
          // Crear casos iniciales si no existen
          const initialCases = mockPatients.slice(0, 3).map(patient => createNewCase(patient));
          dispatch({ type: 'SET_CASES', payload: initialCases });
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('@psykat_user', JSON.stringify(state.user));
        await AsyncStorage.setItem('@psykat_cases', JSON.stringify(state.cases));
      } catch (error) {
        console.error('Error guardando datos:', error);
      }
    };

    if (!state.isLoading) {
      saveData();
    }
  }, [state.user, state.cases, state.isLoading]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      addMessage,
      createNewCase,
      generateId,
      calculateFinalScore,
    }}>
      {children}
    </AppContext.Provider>
  );
};