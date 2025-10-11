import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AIConfig, AIResponse } from '../types';

// Contexto de IA
interface AIContextType {
  config: AIConfig;
  setConfig: (config: Partial<AIConfig>) => void;
  generateResponse: (message: string, context: any, mode?: string) => Promise<AIResponse>;
  testConnection: () => Promise<boolean>;
  isLoading: boolean;
}

const AIContext = createContext<AIContextType | null>(null);

// Hook personalizado
export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI debe ser usado dentro de AIProvider');
  }
  return context;
};

// Provider
interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [config, setConfigState] = useState<AIConfig>({
    mode: 'local',
    endpoint: 'http://localhost:5678/webhook/ask',
    timeout: 15000,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Función para actualizar configuración
  const setConfig = (newConfig: Partial<AIConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  };

  // Función para generar respuesta
  const generateResponse = async (
    message: string, 
    context: any, 
    mode: string = 'entrenamiento'
  ): Promise<AIResponse> => {
    if (config.mode === 'n8n') {
      return callN8NEndpoint(message, context, mode);
    } else {
      return generateLocalResponse(message, context, mode);
    }
  };

  // Respuestas simuladas locales
  const generateLocalResponse = async (
    message: string, 
    context: any, 
    mode: string
  ): Promise<AIResponse> => {
    setIsLoading(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = getContextualResponses(message, context);
        const response = responses[Math.floor(Math.random() * responses.length)];
        const score = calculateScore(message, mode);
        
        setIsLoading(false);
        
        resolve({
          response,
          score,
          color: getResponseColor(score),
          sessionId: context.sessionId || `session_${Date.now()}`,
          mode,
        });
      }, 1000 + Math.random() * 2000);
    });
  };

  // Llamada a n8n
  const callN8NEndpoint = async (
    message: string, 
    context: any, 
    mode: string
  ): Promise<AIResponse> => {
    setIsLoading(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const payload = {
        doctorQuestion: message,
        patientName: context.patient?.name || 'Paciente',
        disorder: context.patient?.disorder || 'Trastorno por determinar',
        personality: context.patient?.personality || 'colaborativo',
        symptoms: context.selectedSymptoms || context.patient?.symptoms || ['malestar general'],
        mode,
        caseFileData: context,
        conversationHistory: (context.messages || [])
          .slice(-6)
          .map((msg: any) => ({
            isUser: msg.sender === 'user',
            text: msg.text,
            timestamp: msg.timestamp,
          })),
        sessionId: context.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionCount: context.questionCount || 0,
      };

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setIsLoading(false);
      
      return {
        response: extractResponse(data),
        score: calculateModeScore(data.score, mode, message),
        color: getModeColor(data.color, mode),
        sessionId: payload.sessionId,
        mode,
        rawData: data,
      };

    } catch (error) {
      console.error('Error en llamada a n8n:', error);
      setIsLoading(false);
      
      // Fallback a respuesta local
      return generateLocalResponse(message, context, mode);
    }
  };

  // Función para probar conexión
  const testConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, message: 'Ping' }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error de conexión:', error);
      return false;
    }
  };

  // Funciones auxiliares
  const getContextualResponses = (message: string, context: any): string[] => {
    const msg = message.toLowerCase();
    const patient = context.patient;
    
    if (patient?.disorder === 'depresion_mayor') {
      if (msg.includes('trabajo') || msg.includes('jefe')) {
        return [
          "El trabajo se ha vuelto muy pesado últimamente...",
          "Mi jefe no entiende lo que estoy pasando",
          "Me cuesta concentrarme en mis tareas"
        ];
      } else if (msg.includes('familia') || msg.includes('hijos')) {
        return [
          "Siento que no soy el padre/madre que debería ser",
          "Mi hija Lucía me preguntó por qué estaba triste",
          "La relación con mi familia se ha vuelto difícil"
        ];
      } else {
        return [
          "No encuentro motivación para nada",
          "Me siento vacío/a por dentro",
          "He perdido interés en las cosas que antes me gustaban",
          "No veo futuro, todo parece gris"
        ];
      }
    } else if (patient?.disorder === 'trastorno_ansiedad_generalizada') {
      if (msg.includes('preocup') || msg.includes('miedo')) {
        return [
          "Estoy constantemente preocupado por todo",
          "No puedo controlar mis pensamientos negativos",
          "Me angustia pensar en el futuro"
        ];
      } else {
        return [
          "Me siento tenso/a todo el tiempo",
          "Tengo ataques de pánico sin razón aparente",
          "No puedo dormir bien por la ansiedad",
          "Mi cuerpo está siempre en alerta"
        ];
      }
    }

    return [
      "Es difícil hablar de esto...",
      "No sé cómo explicarlo",
      "Me siento confundido/a",
      "¿Cree que estoy loco/a?",
      "A veces pienso que no hay solución"
    ];
  };

  const calculateScore = (message: string, mode: string): number => {
    let baseScore = Math.floor(Math.random() * 40) + 40;
    
    let qualityBonus = 0;
    
    if (/^(cómo|qué|cuándo|dónde|por qué|cuéntame|descríbeme|explícame)/i.test(message)) qualityBonus += 15;
    if (/(debe ser difícil|imagino que|entiendo que|debe doler|te comprendo)/i.test(message)) qualityBonus += 10;
    if (/^(¿tienes|¿has|¿eres)/i.test(message)) qualityBonus -= 10;
    if (/(¿no crees que|¿no te parece que|¿verdad que|supongo que)/i.test(message)) qualityBonus -= 20;
    
    const multipliers: { [key: string]: number } = {
      entrenamiento: 1.2,
      dificil: 1.0,
      realista: 0.8,
    };
    
    const score = (baseScore + qualityBonus) * (multipliers[mode] || 1.0);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculateModeScore = (baseScore: number, mode: string, question: string): number => {
    let score = baseScore || Math.floor(Math.random() * 60) + 20;
    
    let qualityBonus = 0;
    
    if (/^(cómo|qué|cuándo|dónde|por qué|cuéntame|descríbeme|explícame)/i.test(question)) qualityBonus += 15;
    if (/(debe ser difícil|imagino que|entiendo que|debe doler|te comprendo)/i.test(question)) qualityBonus += 10;
    if (/^(¿tienes|¿has|¿eres)/i.test(question)) qualityBonus -= 10;
    if (/(¿no crees que|¿no te parece que|¿verdad que|supongo que)/i.test(question)) qualityBonus -= 15;

    const multipliers: { [key: string]: number } = {
      entrenamiento: 1.2,
      dificil: 1.0,
      realista: 0.8,
    };
    
    score = (score + qualityBonus) * (multipliers[mode] || 1.0);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getResponseColor = (score: number): string => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'purple';
    return 'brown';
  };

  const getModeColor = (baseColor: string, mode: string): string => {
    if (baseColor) return baseColor;
    
    const colorsByMode: { [key: string]: string[] } = {
      entrenamiento: ['green', 'blue'],
      dificil: ['brown', 'purple', 'blue'],
      realista: ['brown', 'purple', 'green', 'blue'],
    };
    
    const colors = colorsByMode[mode] || ['brown'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const extractResponse = (data: any): string => {
    if (data.response) return data.response;
    if (data.content) return data.content;
    if (data.message) return data.message;
    if (typeof data === 'string') return data;
    return 'No pude procesar esa pregunta...';
  };

  return (
    <AIContext.Provider value={{
      config,
      setConfig,
      generateResponse,
      testConnection,
      isLoading,
    }}>
      {children}
    </AIContext.Provider>
  );
};