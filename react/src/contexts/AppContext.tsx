import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Case, Patient, Message } from '../types';
import { mockPatients } from '../data/mockData';

// Estado inicial
interface AppState {
  user: User;
  cases: Case[];
  currentCase: Case | null;
  isLoading: boolean;
}

const initialState: AppState = {
  user: {
    level: 1,
    xp: 0,
    maxXp: 100,
    isPremium: false,
    casesCompleted: 0,
    totalQuestions: 0,
    correctDiagnoses: 0,
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
  | { type: 'SET_CURRENT_CASE'; payload: Case | null }
  | { type: 'ADD_XP'; payload: number }
  | { type: 'COMPLETE_CASE'; payload: { caseId: string; correct: boolean } };

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
    
    case 'COMPLETE_CASE':
      return {
        ...state,
        user: {
          ...state.user,
          casesCompleted: state.user.casesCompleted + 1,
          correctDiagnoses: action.payload.correct 
            ? state.user.correctDiagnoses + 1
            : state.user.correctDiagnoses,
        },
        cases: state.cases.map(case_ => 
          case_.id === action.payload.caseId 
            ? { ...case_, status: 'completed' as const }
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
  const createNewCase = (patient: Patient): Case => {
    const newCase: Case = {
      id: generateId(),
      patient,
      messages: [],
      status: 'new',
      lastMessage: '',
      lastMessageTime: '',
      unreadCount: 0,
      sessions: 0,
      backstoryRevealed: false,
      selectedSymptoms: [],
      diagnosis: null,
      diagnosisCorrect: null,
      batteryApplied: null,
      batteryResults: null,
      sessionId: null,
    };
    return newCase;
  };

  // Función para añadir mensaje
  const addMessage = (caseId: string, message: Message) => {
    const case_ = state.cases.find(c => c.id === caseId);
    if (case_) {
      const updatedMessages = [...case_.messages, message];
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: caseId,
          updates: {
            messages: updatedMessages,
            lastMessage: message.text,
            lastMessageTime: new Date().toLocaleTimeString(),
          },
        },
      });
    }
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
    }}>
      {children}
    </AppContext.Provider>
  );
};