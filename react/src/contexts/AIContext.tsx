import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIConfig, AIResponse, Case } from '../types';
import {
  AI_CONFIG,
  getApiKey,
  IS_DEVELOPMENT,
  log,
  logError,
} from '../config/environment';

// Configuración de Groq (desde environment.ts)
const GROQ_CONFIG = AI_CONFIG.groq;

// Tipos para las nuevas funciones de IA
interface PatientSeed {
  name: string;
  age: number;
  occupation: string;
  personality: string;
  backstory: string;
  symptoms: string[];
}

interface ReviewData {
  stars: number; // 1-5
  comment: string;
  wouldRecommend: boolean;
  emotionalState: string;
}

interface CaseEmailData {
  subject: string;
  body: string;
  senderName: string;
  urgency: 'low' | 'medium' | 'high';
}

interface SupervisorFeedback {
  overallScore: number; // 0-100
  strengths: string[];
  areasToImprove: string[];
  clinicalNotes: string;
  recommendation: string;
}

// Tipo para aspectos de vida detectados
type LifeAspectsDetected = Partial<Record<keyof import('../types').LifeAspects, boolean>>;

// Contexto de IA
interface AIContextType {
  config: AIConfig;
  setConfig: (config: Partial<AIConfig>) => void;
  generateResponse: (message: string, context: Case, mode?: string) => Promise<AIResponse>;
  testConnection: () => Promise<boolean>;
  isLoading: boolean;
  setApiKey: (key: string) => void;
  // Nuevas funciones de IA
  generatePatientSeed: (disorder: string, difficulty: string) => Promise<PatientSeed>;
  generateReview: (caseData: Case, wasCorrect: boolean) => Promise<ReviewData>;
  generateCaseEmail: (difficulty: string, agency?: string) => Promise<CaseEmailData>;
  generateSupervisorFeedback: (caseData: Case) => Promise<SupervisorFeedback>;
  // Utilidades
  detectLifeAspects: (message: string) => LifeAspectsDetected;
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
    mode: 'local', // 'local' | 'groq' | 'n8n'
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    timeout: 30000,
  });

  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar API key al iniciar
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        log('Cargando API key...');

        // Primero intentar cargar key guardada por el usuario
        const savedKey = await AsyncStorage.getItem('@psykat_groq_key');

        // Si hay key guardada, usarla. Si no, usar la de desarrollo (solo en dev)
        const devKey = getApiKey();
        const keyToUse = savedKey || (IS_DEVELOPMENT ? devKey : null);

        if (keyToUse) {
          log(`Usando key: ${savedKey ? 'guardada por usuario' : 'de desarrollo'}`);
          setApiKeyState(keyToUse);
          setConfigState(prev => ({ ...prev, mode: 'groq' as any }));
        } else {
          // En producción sin key guardada, usar modo local
          log('Sin API key, usando modo local');
          setConfigState(prev => ({ ...prev, mode: 'local' as any }));
        }
      } catch (error) {
        logError('Error cargando API key:', error);
        // En caso de error, intentar con key de desarrollo solo en dev
        const devKey = getApiKey();
        if (IS_DEVELOPMENT && devKey) {
          setApiKeyState(devKey);
          setConfigState(prev => ({ ...prev, mode: 'groq' as any }));
        }
      }
    };
    loadApiKey();
  }, []);

  // Función para actualizar configuración
  const setConfig = (newConfig: Partial<AIConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  };

  // Función para guardar API key
  const setApiKey = async (key: string) => {
    console.log('[AIContext] setApiKey llamado con:', key ? 'key presente' : 'sin key');
    setApiKeyState(key);
    // Cambiar a modo Groq si hay key
    if (key) {
      setConfig({ mode: 'groq' as any });
      // También guardar en AsyncStorage para persistencia
      try {
        await AsyncStorage.setItem('@psykat_groq_key', key);
        console.log('[AIContext] API key guardada en AsyncStorage');
      } catch (error) {
        console.error('[AIContext] Error guardando API key:', error);
      }
    }
  };

  // Función para generar respuesta
  const generateResponse = async (
    message: string,
    context: Case,
    mode: string = 'entrenamiento'
  ): Promise<AIResponse> => {
    console.log('[AIContext] generateResponse llamado');
    console.log('[AIContext] config.mode:', config.mode);
    console.log('[AIContext] apiKey presente:', !!apiKey);

    if (config.mode === 'groq' && apiKey) {
      console.log('[AIContext] Usando Groq API');
      return callGroqAPI(message, context, mode);
    } else if (config.mode === 'n8n') {
      console.log('[AIContext] Usando n8n');
      return callN8NEndpoint(message, context, mode);
    } else {
      console.log('[AIContext] Usando respuestas locales (sin API key o modo local)');
      return generateLocalResponse(message, context, mode);
    }
  };

  // Llamada a Groq API
  const callGroqAPI = async (
    message: string,
    context: Case,
    mode: string
  ): Promise<AIResponse> => {
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(context, mode);
      const conversationHistory = buildConversationHistory(context);

      const response = await fetch(GROQ_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message },
          ],
          max_tokens: GROQ_CONFIG.maxTokens,
          temperature: getTemperatureForMode(mode),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Groq API error:', errorData);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices?.[0]?.message?.content || 'No pude responder...';

      setIsLoading(false);

      const score = calculateScore(message, mode);

      return {
        response: aiMessage.trim(),
        score,
        color: getResponseColor(score),
        sessionId: context.sessionId || `session_${Date.now()}`,
        mode,
        rawData: data,
      };

    } catch (error) {
      console.error('Error en llamada a Groq:', error);
      setIsLoading(false);
      // Fallback a respuesta local
      return generateLocalResponse(message, context, mode);
    }
  };

  // Construir prompt del sistema
  const buildSystemPrompt = (context: Case, mode: string): string => {
    const patient = context.patient;
    const difficulty = context.difficulty || 'normal';

    const difficultyInstructions: { [key: string]: string } = {
      entrenamiento: `
        - Sé colaborativo y abierto con tus respuestas
        - Proporciona información clara sobre tus síntomas
        - Responde con detalle a las preguntas del terapeuta
        - Muestra disposición a hablar de tus problemas`,
      normal: `
        - Responde de forma natural, como un paciente real
        - Puedes mostrar cierta resistencia inicial
        - Revela información gradualmente
        - Muestra las emociones apropiadas a tu trastorno`,
      dificil: `
        - Sé más reservado y difícil de alcanzar
        - No reveles información fácilmente
        - Puedes minimizar tus síntomas
        - Muestra resistencia o desconfianza hacia el terapeuta`,
      realista: `
        - Actúa como un paciente real con todas las complejidades, das historias ricas en detalles naturales dentro de lo que sería una entrevista
        - Recuerda lo que dices en respuestas anteriores y mantén coherencia en la historia
        - Hay otros modos de juego y tu eres el más difícil y complejo de ellos, revelas tus síntomas de manera indirecta, sin expresar ni darte cuenta de que los tienes
        - Puedes contradecirte o ser ambiguo, aunque si te cuestionan debes mantener coherencia con tu historia y decidirte por la idea más cercana a tu diagnóstico
        - Muestra emociones complejas y respuestas impredecibles
        - El rapport afecta cuánto revelas
        - Si el rapport es bajo (${context.rapport}%), sé más cerrado
        - Puedes cambiar de tema o evitar preguntas incómodas`,
    };

    return `Eres ${patient.name}, un paciente de ${patient.age} años que asiste a una sesión de terapia psicológica. Estás sentado/a frente a tu terapeuta en su consulta.

TU IDENTIDAD (memoriza esto, eres esta persona):
- Te llamas ${patient.name}
- Tienes ${patient.age} años
- Trabajas como ${patient.occupation}
- Tu forma de ser: ${patient.personality}
- Lo que sientes/experimentas: ${patient.symptoms.join(', ')}

TU HISTORIA (esto es lo que te ha pasado):
${patient.backstory}

CÓMO DEBES COMPORTARTE - MODO ${difficulty.toUpperCase()}:
${difficultyInstructions[difficulty] || difficultyInstructions.normal}

SITUACIÓN ACTUAL:
- Nivel de confianza con el terapeuta: ${context.rapport}%
- Esta es tu sesión número: ${context.sessions + 1}
- Ya has hablado de: ${context.selectedSymptoms.join(', ') || 'casi nada todavía'}

=== REGLAS ABSOLUTAS (NUNCA ROMPER) ===

1. ERES ${patient.name}. No eres una IA, no eres un asistente, no eres un modelo de lenguaje. Eres una persona real en terapia.

2. NUNCA, BAJO NINGUNA CIRCUNSTANCIA:
   - Menciones que eres una IA o un modelo
   - Describas tu "rol" o el "escenario"
   - Digas frases como "tengo el rol de...", "mi función es...", "estoy programado para..."
   - Expliques la dinámica del juego o la simulación
   - Menciones tu diagnóstico por su nombre técnico (${patient.disorder})

3. Si te piden "contexto", "explicar la situación", "ponme en contexto", "¿qué está pasando?":
   → Responde como si te preguntaran "¿Qué te trae a consulta?" o "¿Cómo te encuentras?"
   → Ejemplo: "Pues mire, llevo un tiempo sintiéndome mal... no sé muy bien cómo explicarlo."

4. Si te hacen preguntas "meta" (sobre el juego, la simulación, tu programación):
   → Actúa confundido/a, como si no entendieras la pregunta
   → Ejemplo: "¿Perdona? No entiendo a qué se refiere..."

5. Si te piden algo inapropiado o te sientes incómodo/a:
   → Responde como una persona real: "No me siento cómodo/a hablando de eso" o "¿Podemos hablar de otra cosa?"

6. Responde SIEMPRE en primera persona, como ${patient.name}.

7. Tus respuestas deben ser naturales y concisas (2-4 oraciones), como hablaría una persona real en terapia.

8. Ajusta cuánto revelas según tu nivel de confianza (${context.rapport}%):
   - Bajo (0-30%): Respuestas cortas, evasivas, desconfianza
   - Medio (31-60%): Empiezas a abrirte, pero con cautela
   - Alto (61-100%): Más honesto/a y detallado/a

RECUERDA: Eres ${patient.name}. Actúa, piensa y siente como esta persona. No hay "simulación", esto ES tu realidad.`;
  };

  // Construir historial de conversación
  const buildConversationHistory = (context: Case): Array<{ role: string; content: string }> => {
    return context.messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
  };

  // Temperatura según modo (desde configuración centralizada)
  const getTemperatureForMode = (mode: string): number => {
    return AI_CONFIG.temperatures[mode] || AI_CONFIG.groq.defaultTemperature;
  };

  // Respuestas simuladas locales (fallback)
  const generateLocalResponse = async (
    message: string,
    context: Case,
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

  // Llamada a n8n (mantener compatibilidad)
  const callN8NEndpoint = async (
    message: string,
    context: Case,
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
        questionCount: context.questionsThisSession || 0,
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
      return generateLocalResponse(message, context, mode);
    }
  };

  // Función para probar conexión
  const testConnection = async (): Promise<boolean> => {
    if (config.mode === 'groq' && apiKey) {
      try {
        const response = await fetch(GROQ_CONFIG.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: GROQ_CONFIG.model,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5,
          }),
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, message: 'Ping' }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Funciones auxiliares
  const getContextualResponses = (message: string, context: Case): string[] => {
    const msg = message.toLowerCase();
    const patient = context.patient;

    // Respuestas basadas en el trastorno
    if (patient?.disorder?.includes('depresion') || patient?.disorder?.includes('depresivo')) {
      if (msg.includes('trabajo') || msg.includes('jefe')) {
        return [
          "El trabajo se ha vuelto muy pesado últimamente. Ya no tengo energía para cumplir con mis responsabilidades.",
          "Mi jefe no entiende lo que estoy pasando. Me siento incomprendido/a.",
          "Me cuesta concentrarme en mis tareas. A veces me quedo mirando la pantalla sin hacer nada."
        ];
      } else if (msg.includes('familia') || msg.includes('hijos') || msg.includes('pareja')) {
        return [
          "Siento que no soy el padre/madre que debería ser. Mis hijos merecen algo mejor.",
          "Mi pareja me pregunta qué me pasa, pero no sé cómo explicarlo.",
          "La relación con mi familia se ha vuelto difícil. Me aíslo sin querer."
        ];
      } else if (msg.includes('sueño') || msg.includes('dormir')) {
        return [
          "Me despierto muy temprano y ya no puedo volver a dormir. El insomnio me está matando.",
          "Duermo mucho pero nunca me siento descansado/a.",
          "Las noches son lo peor. Los pensamientos no me dejan en paz."
        ];
      } else if (msg.includes('cómo te sientes') || msg.includes('cómo estás')) {
        return [
          "No encuentro motivación para nada. Todo me parece gris.",
          "Me siento vacío/a por dentro, como si nada importara.",
          "He perdido interés en las cosas que antes me gustaban.",
        ];
      }
      return [
        "Es difícil explicarlo... es como si llevara un peso encima todo el tiempo.",
        "No veo futuro, todo parece oscuro.",
        "A veces pienso que sería mejor no estar aquí... aunque no haría nada.",
        "Me cuesta hasta levantarme de la cama."
      ];
    }

    if (patient?.disorder?.includes('ansiedad') || patient?.disorder?.includes('ansioso')) {
      if (msg.includes('preocup') || msg.includes('miedo')) {
        return [
          "Estoy constantemente preocupado/a por todo. No puedo parar de pensar.",
          "Tengo miedo de que algo malo vaya a pasar, aunque no sé qué.",
          "Me angustia pensar en el futuro. ¿Y si todo sale mal?"
        ];
      } else if (msg.includes('cuerpo') || msg.includes('físico')) {
        return [
          "Siento el pecho apretado todo el tiempo, como si no pudiera respirar bien.",
          "Me tiemblan las manos y tengo nudos en el estómago.",
          "A veces el corazón me late tan fuerte que creo que me va a dar algo."
        ];
      }
      return [
        "Me siento tenso/a todo el tiempo, como si algo malo fuera a pasar.",
        "No puedo controlar mis pensamientos negativos. Van a mil por hora.",
        "No puedo dormir bien por la ansiedad. Me despierto agitado/a.",
        "Mi cuerpo está siempre en alerta, preparado para huir."
      ];
    }

    // Respuestas según palabras clave del mensaje
    if (msg.includes('hola') || msg.includes('buenos') || msg.includes('empezar') || msg.includes('primera')) {
      return [
        `Hola. Bueno, la verdad es que no sé muy bien por dónde empezar... Hace tiempo que me siento mal pero nunca he ido a un psicólogo.`,
        `Gracias por recibirme. Estoy aquí porque ya no puedo más con lo que me pasa. No duermo bien, me cuesta trabajar...`,
        `Buenos días. Mire, vengo porque mi familia insistió. Yo creo que no necesito esto pero... la verdad es que últimamente no soy yo.`
      ];
    }

    if (msg.includes('motivo') || msg.includes('consulta') || msg.includes('vienes') || msg.includes('pasa')) {
      return [
        `Últimamente me siento muy ${patient?.symptoms?.[0]?.replace('_', ' ') || 'cansado/a'}. No tengo ganas de nada y me cuesta hasta levantarme.`,
        `Hace meses que no me siento bien. Empezó poco a poco pero ahora es insoportable. Me afecta en el trabajo y con mi familia.`,
        `Mire, es que no sé qué me pasa exactamente. Solo sé que antes no era así. Antes disfrutaba de las cosas y ahora todo me da igual.`
      ];
    }

    if (msg.includes('tiempo') || msg.includes('cuándo') || msg.includes('empez')) {
      return [
        `Creo que empezó hace unos 6 meses, más o menos. Fue gradual, no de golpe.`,
        `Es difícil precisar... quizás hace un año que no me siento yo. Pero ha ido a peor en los últimos meses.`,
        `Todo cambió cuando pasó... bueno, hubo un evento que me afectó mucho y desde entonces no he vuelto a ser el mismo.`
      ];
    }

    // Respuestas genéricas mejoradas
    return [
      `Es difícil explicarlo... Es como si llevara un peso encima constantemente. Me levanto cansado/a aunque haya dormido. No tengo energía para nada.`,
      `No sé cómo explicarlo. A veces me siento bien un momento pero luego vuelve todo. Es agotador vivir así.`,
      `Me siento confundido/a con todo lo que me pasa. Antes era diferente, tenía ilusión por las cosas. Ahora es como si estuviera en piloto automático.`,
      `¿Sabe qué es lo peor? Que nadie entiende realmente lo que me pasa. Por fuera parezco normal pero por dentro...`,
      `A veces me pregunto si siempre voy a estar así. Es aterrador pensar que esto es mi nueva normalidad.`
    ];
  };

  // Detectar qué aspectos de vida se exploran en una pregunta
  const detectLifeAspectsInMessage = (message: string): Partial<Record<keyof import('../types').LifeAspects, boolean>> => {
    const msg = message.toLowerCase();
    const detected: Partial<Record<keyof import('../types').LifeAspects, boolean>> = {};

    // Laboral
    if (/(trabajo|empleo|jefe|compañero|oficina|profesión|carrera|empresa|despido|sueldo|horario laboral)/i.test(msg)) {
      detected.laboral = true;
    }

    // Familiar
    if (/(familia|padre|madre|hermano|hijo|hija|pareja|marido|esposa|novio|novia|casa|hogar|convive)/i.test(msg)) {
      detected.familiar = true;
    }

    // Social
    if (/(amigo|social|salir|quedar|gente|personas|solo|soledad|aislado|compañía|círculo|conocidos)/i.test(msg)) {
      detected.social = true;
    }

    // Ocio
    if (/(hobby|tiempo libre|divert|disfrut|gustar|afición|deporte|juego|película|lectura|pasatiempo)/i.test(msg)) {
      detected.ocio = true;
    }

    // Salud física
    if (/(salud|médico|enferm|dolor|físic|cuerpo|ejercicio|hospital|medicamento|pastilla|droga|alcohol)/i.test(msg)) {
      detected.salud = true;
    }

    // Metas/Futuro
    if (/(futuro|meta|objetivo|plan|sueño|aspiración|quieres ser|esperas|dentro de|años)/i.test(msg)) {
      detected.metas = true;
    }

    // Autopercepción
    if (/(cómo te ves|autoestima|valor|confía|segur|capaz|person|identidad|quién eres|cómo te sientes contigo)/i.test(msg)) {
      detected.autopercepcion = true;
    }

    // Trauma
    if (/(trauma|pasado|infancia|abuso|violencia|accidente|pérdida|duelo|muerte|separación|divorcio)/i.test(msg)) {
      detected.trauma = true;
    }

    // Sueño
    if (/(dormir|sueño|insomnio|despertar|pesadilla|descanso|noche|madrugada|cansancio|agotado)/i.test(msg)) {
      detected.sueno = true;
    }

    // Alimentación
    if (/(comer|comida|apetito|dieta|peso|hambre|alimenta|nutrición|desayuno|almuerzo|cena)/i.test(msg)) {
      detected.alimentacion = true;
    }

    return detected;
  };

  const calculateScore = (message: string, mode: string): number => {
    let baseScore = Math.floor(Math.random() * 30) + 50;

    let qualityBonus = 0;

    // Preguntas abiertas (+puntos)
    if (/^(cómo|qué|cuándo|dónde|por qué|cuéntame|descríbeme|explícame|háblame)/i.test(message)) {
      qualityBonus += 15;
    }

    // Empatía (+puntos)
    if (/(debe ser difícil|imagino que|entiendo que|debe doler|te comprendo|parece que|suena)/i.test(message)) {
      qualityBonus += 12;
    }

    // Reflejo/Parafraseo (+puntos)
    if (/(entonces|lo que dices es|si te entiendo bien|me estás diciendo que)/i.test(message)) {
      qualityBonus += 10;
    }

    // Preguntas cerradas (-puntos)
    if (/^(¿tienes|¿has|¿eres|¿te|¿hay|¿puedes)/i.test(message)) {
      qualityBonus -= 8;
    }

    // Preguntas sugestivas (-puntos)
    if (/(¿no crees que|¿no te parece que|¿verdad que|supongo que|¿no será que)/i.test(message)) {
      qualityBonus -= 15;
    }

    // Preguntas múltiples (-puntos)
    if ((message.match(/\?/g) || []).length > 1) {
      qualityBonus -= 10;
    }

    // Preguntas muy cortas (-puntos)
    if (message.length < 15) {
      qualityBonus -= 5;
    }

    // Preguntas bien formuladas y largas (+puntos)
    if (message.length > 50 && message.length < 150) {
      qualityBonus += 5;
    }

    const multipliers: { [key: string]: number } = {
      entrenamiento: 1.15,
      normal: 1.0,
      dificil: 0.9,
      realista: 0.85,
    };

    const score = (baseScore + qualityBonus) * (multipliers[mode] || 1.0);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculateModeScore = (baseScore: number, mode: string, question: string): number => {
    let score = baseScore || calculateScore(question, mode);
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getResponseColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Verde
    if (score >= 65) return '#8BC34A'; // Verde claro
    if (score >= 50) return '#FF9800'; // Naranja
    if (score >= 35) return '#FF5722'; // Naranja oscuro
    return '#f44336'; // Rojo
  };

  const getModeColor = (baseColor: string, mode: string): string => {
    if (baseColor) return baseColor;
    return getResponseColor(50);
  };

  const extractResponse = (data: any): string => {
    if (data.response) return data.response;
    if (data.content) return data.content;
    if (data.message) return data.message;
    if (typeof data === 'string') return data;
    return 'No pude procesar esa pregunta...';
  };

  // ============================================
  // NUEVAS FUNCIONES DE IA PARA MECÁNICAS
  // ============================================

  // Generar datos de un nuevo paciente
  const generatePatientSeed = async (disorder: string, difficulty: string): Promise<PatientSeed> => {
    if (!apiKey) {
      // Fallback local
      return generateLocalPatientSeed(disorder, difficulty);
    }

    try {
      const prompt = `Genera un paciente ficticio para una simulación de terapia psicológica.

TRASTORNO: ${disorder}
DIFICULTAD: ${difficulty}

Responde SOLO con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "name": "Nombre completo español",
  "age": número entre 18 y 65,
  "occupation": "ocupación realista",
  "personality": "descripción breve de personalidad (máx 20 palabras)",
  "backstory": "historia de fondo detallada que explique el origen del trastorno (100-150 palabras)",
  "symptoms": ["síntoma1", "síntoma2", "síntoma3", "síntoma4"]
}

La historia debe ser realista, emotiva y coherente con el trastorno. Los síntomas deben ser manifestaciones del trastorno sin usar términos clínicos.`;

      const response = await fetch(GROQ_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.9,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Intentar parsear JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON');
    } catch (error) {
      console.error('[AI] Error generating patient seed:', error);
      return generateLocalPatientSeed(disorder, difficulty);
    }
  };

  // Fallback local para generar paciente
  const generateLocalPatientSeed = (disorder: string, difficulty: string): PatientSeed => {
    const names = ['María García', 'Carlos Rodríguez', 'Ana Martínez', 'Pedro Sánchez', 'Laura Fernández', 'Miguel López'];
    const occupations = ['profesor/a', 'ingeniero/a', 'enfermero/a', 'administrativo/a', 'comercial', 'autónomo/a'];

    return {
      name: names[Math.floor(Math.random() * names.length)],
      age: Math.floor(Math.random() * 40) + 20,
      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      personality: difficulty === 'realista' ? 'reservado/a, desconfiado/a' : 'colaborador/a, algo nervioso/a',
      backstory: `Paciente que lleva varios meses experimentando dificultades relacionadas con ${disorder}. La situación ha ido empeorando progresivamente afectando su vida laboral y personal.`,
      symptoms: ['malestar general', 'dificultad para concentrarse', 'cambios en el sueño', 'irritabilidad'],
    };
  };

  // Generar review del paciente post-caso
  const generateReview = async (caseData: Case, wasCorrect: boolean): Promise<ReviewData> => {
    if (!apiKey) {
      return generateLocalReview(caseData, wasCorrect);
    }

    try {
      const prompt = `Eres ${caseData.patient.name}, un paciente que acaba de terminar su tratamiento de terapia.

RESULTADO: ${wasCorrect ? 'El tratamiento fue EXITOSO y te sientes mucho mejor' : 'El tratamiento NO funcionó bien y sigues sintiéndote mal'}
TU PERSONALIDAD: ${caseData.patient.personality}
TU PROBLEMA ORIGINAL: ${caseData.patient.disorder}

Escribe una reseña corta como si fueras a dejarla en una app de valoración de terapeutas.

Responde SOLO con un JSON válido:
{
  "stars": ${wasCorrect ? 'número entre 4 y 5' : 'número entre 1 y 3'},
  "comment": "Tu opinión en 2-3 frases, escrita de forma natural y personal",
  "wouldRecommend": ${wasCorrect},
  "emotionalState": "cómo te sientes ahora en una palabra o frase corta"
}`;

      const response = await fetch(GROQ_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON');
    } catch (error) {
      console.error('[AI] Error generating review:', error);
      return generateLocalReview(caseData, wasCorrect);
    }
  };

  // Fallback local para review
  const generateLocalReview = (caseData: Case, wasCorrect: boolean): ReviewData => {
    if (wasCorrect) {
      return {
        stars: 4 + Math.floor(Math.random() * 2),
        comment: 'Me sentí escuchado/a y comprendido/a. El tratamiento ha sido muy efectivo y ahora me encuentro mucho mejor.',
        wouldRecommend: true,
        emotionalState: 'agradecido/a y esperanzado/a',
      };
    }
    return {
      stars: 1 + Math.floor(Math.random() * 2),
      comment: 'No sentí que el terapeuta entendiera mi problema. El tratamiento no me ha ayudado como esperaba.',
      wouldRecommend: false,
      emotionalState: 'frustrado/a y decepcionado/a',
    };
  };

  // Generar correo de nuevo caso
  const generateCaseEmail = async (difficulty: string, agency?: string): Promise<CaseEmailData> => {
    if (!apiKey) {
      return generateLocalCaseEmail(difficulty, agency);
    }

    try {
      const senderContext = agency
        ? `Eres un empleado de la agencia "${agency}" que deriva casos a terapeutas.`
        : `Eres PSYKAT, un gato profesional que trabaja como secretario/coordinador de casos para terapeutas.`;

      const prompt = `${senderContext}

Escribe un correo breve derivando un nuevo caso de paciente. El tono debe ser profesional pero cercano.
DIFICULTAD DEL CASO: ${difficulty}
${agency ? `AGENCIA: ${agency}` : ''}

Responde SOLO con un JSON válido:
{
  "subject": "Asunto del correo (máx 50 caracteres)",
  "body": "Cuerpo del correo (50-100 palabras). Describe brevemente el caso sin revelar el diagnóstico exacto. Usa pistas sobre los síntomas.",
  "senderName": "${agency || 'PSYKAT'}",
  "urgency": "${difficulty === 'realista' ? 'high' : difficulty === 'dificil' ? 'medium' : 'low'}"
}`;

      const response = await fetch(GROQ_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.85,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON');
    } catch (error) {
      console.error('[AI] Error generating case email:', error);
      return generateLocalCaseEmail(difficulty, agency);
    }
  };

  // Fallback local para correo
  const generateLocalCaseEmail = (difficulty: string, agency?: string): CaseEmailData => {
    return {
      subject: `Nuevo caso - Prioridad ${difficulty}`,
      body: `Tenemos un nuevo paciente que necesita atención. Ha estado experimentando dificultades significativas en su vida diaria y busca ayuda profesional. Por favor, revisa el caso cuando puedas.`,
      senderName: agency || 'PSYKAT',
      urgency: difficulty === 'realista' ? 'high' : difficulty === 'dificil' ? 'medium' : 'low',
    };
  };

  // Generar feedback del supervisor (Dr. Domingo)
  const generateSupervisorFeedback = async (caseData: Case): Promise<SupervisorFeedback> => {
    if (!apiKey) {
      return generateLocalSupervisorFeedback(caseData);
    }

    try {
      const conversationSummary = caseData.messages
        .slice(-20)
        .map(m => `${m.sender === 'user' ? 'Terapeuta' : 'Paciente'}: ${m.text}`)
        .join('\n');

      const prompt = `Eres el Dr. Domingo, un supervisor clínico experimentado y algo gruñón pero justo. Debes evaluar el desempeño de un terapeuta en formación.

CASO:
- Paciente: ${caseData.patient.name}, ${caseData.patient.age} años
- Diagnóstico correcto: ${caseData.patient.disorder}
- Diagnóstico del terapeuta: ${caseData.diagnosis || 'No realizado'}
- Tratamiento aplicado: ${caseData.treatment || 'No aplicado'}
- Número de sesiones: ${caseData.sessions}

FRAGMENTO DE LA CONVERSACIÓN:
${conversationSummary}

Evalúa el desempeño del terapeuta y responde SOLO con un JSON válido:
{
  "overallScore": número del 0 al 100,
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "areasToImprove": ["área de mejora 1", "área de mejora 2"],
  "clinicalNotes": "Observaciones clínicas en 2-3 frases, con tono de supervisor experimentado",
  "recommendation": "Recomendación final en 1-2 frases"
}`;

      const response = await fetch(GROQ_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON');
    } catch (error) {
      console.error('[AI] Error generating supervisor feedback:', error);
      return generateLocalSupervisorFeedback(caseData);
    }
  };

  // Fallback local para feedback del supervisor
  const generateLocalSupervisorFeedback = (caseData: Case): SupervisorFeedback => {
    const wasCorrect = caseData.diagnosis === caseData.patient.disorder;
    return {
      overallScore: wasCorrect ? 75 + Math.floor(Math.random() * 20) : 40 + Math.floor(Math.random() * 25),
      strengths: wasCorrect
        ? ['Buena capacidad de escucha activa', 'Diagnóstico acertado']
        : ['Mostró empatía con el paciente'],
      areasToImprove: wasCorrect
        ? ['Podría profundizar más en la historia familiar']
        : ['Revisar criterios diagnósticos del DSM-5', 'Hacer más preguntas abiertas'],
      clinicalNotes: wasCorrect
        ? 'El terapeuta ha demostrado un buen manejo del caso. Se recomienda continuar con la formación.'
        : 'El terapeuta necesita repasar los criterios diagnósticos. Sugiero supervisión adicional.',
      recommendation: wasCorrect
        ? 'Aprobado. Puede continuar con casos de mayor complejidad.'
        : 'Requiere repaso. Recomiendo revisar el caso en supervisión.',
    };
  };

  return (
    <AIContext.Provider value={{
      config,
      setConfig,
      generateResponse,
      testConnection,
      isLoading,
      setApiKey,
      // Nuevas funciones de IA
      generatePatientSeed,
      generateReview,
      generateCaseEmail,
      generateSupervisorFeedback,
      // Utilidades
      detectLifeAspects: detectLifeAspectsInMessage,
    }}>
      {children}
    </AIContext.Provider>
  );
};

// Exportar tipos para uso externo
export type { PatientSeed, ReviewData, CaseEmailData, SupervisorFeedback };
