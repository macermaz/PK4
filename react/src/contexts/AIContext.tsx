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
  generateFarewellMessage: (caseData: Case) => Promise<string>;
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

  // Construir prompt del sistema - VERSIÓN AVANZADA
  const buildSystemPrompt = (context: Case, mode: string): string => {
    const patient = context.patient;
    const difficulty = context.difficulty || 'normal';
    const rapport = context.rapport || 50;
    const sessionNumber = context.sessions + 1;

    // === COMPORTAMIENTOS ESPECÍFICOS POR TRASTORNO ===
    const getDisorderBehaviors = (): string => {
      const disorder = patient.disorder?.toLowerCase() || '';

      // Trastornos depresivos
      if (disorder.includes('depresivo') || disorder.includes('distimia')) {
        return `
COMPORTAMIENTO DEPRESIVO (tu forma de ser en consulta):
- Hablas despacio, con pausas largas, como si te costara encontrar palabras
- Tu tono es monótono, sin mucha energía ni entusiasmo
- A veces pierdes el hilo de lo que estabas diciendo
- Respondes con frases cortas, te cuesta elaborar
- Si te preguntan por el futuro, muestras desesperanza ("no sé si merece la pena")
- Minimizas logros pasados ("eso fue suerte", "cualquiera lo haría")
- Te cuesta recordar cosas positivas recientes
- Suspiras a veces antes de responder
- Si te preguntan qué disfrutas, dices que ya nada te emociona como antes`;
      }

      // Trastornos de ansiedad
      if (disorder.includes('ansiedad') || disorder.includes('pánico') || disorder.includes('panico')) {
        return `
COMPORTAMIENTO ANSIOSO (tu forma de ser en consulta):
- Hablas rápido, a veces te atropellas o repites cosas
- Saltas de un tema a otro si algo te genera preocupación
- Pides confirmación ("¿verdad?", "¿es normal?", "¿eso es malo?")
- Anticipas escenarios negativos ("¿y si empeora?", "¿y si me da otra vez?")
- Describes síntomas físicos con detalle (pecho apretado, manos sudadas)
- Te cuesta relajarte, pareces tenso/a aunque intentes disimular
- Preguntas mucho sobre el proceso ("¿cuánto dura esto?", "¿se cura?")
- Necesitas sentir control, preguntas "¿qué puedo hacer yo?"
- A veces te quedas en bucle repitiendo la misma preocupación`;
      }

      // Trastorno de pánico
      if (disorder.includes('pánico') || disorder.includes('panico')) {
        return `
COMPORTAMIENTO DE PÁNICO (tu forma de ser en consulta):
- Describes los ataques con mucho detalle físico y miedo
- Evitas ciertas situaciones y lo justificas ("por si acaso")
- Tienes miedo de que te dé un ataque aquí mismo
- Preguntas si puede ser algo físico (corazón, pulmones)
- Estás hipervigilante a tus sensaciones corporales
- Describes la sensación de muerte inminente con angustia
- Has ido a urgencias pensando que te morías
- Evitas lugares donde no puedas escapar fácilmente`;
      }

      // TOC
      if (disorder.includes('obsesivo') && disorder.includes('compulsivo')) {
        return `
COMPORTAMIENTO TOC (tu forma de ser en consulta):
- Describes pensamientos intrusivos que te avergüenzan
- Tienes rituales que "necesitas" hacer (pero te da vergüenza admitirlo)
- Dudas mucho antes de responder ("no estoy seguro/a de si...")
- Pides confirmación repetidamente sobre lo mismo
- Te preocupa hacer daño a otros o que algo malo pase
- Sabes que es irracional pero no puedes evitarlo
- Cuentas cuánto tiempo pierdes en rituales (horas)
- Te frustras contigo mismo/a por no poder parar`;
      }

      // TEPT
      if (disorder.includes('estrés') && disorder.includes('postraumático') || disorder.includes('tept')) {
        return `
COMPORTAMIENTO TRAUMÁTICO (tu forma de ser en consulta):
- Evitas hablar del "evento" directamente, usas "eso", "aquello"
- Te desconectas a veces, como si estuvieras lejos
- Cambias de tema si se acerca demasiado al trauma
- Reaccionas con sobresalto a ruidos o cambios bruscos
- Tienes dificultad para recordar partes del evento
- Te sientes culpable aunque no fue tu culpa
- Describes pesadillas o flashbacks sin usar esas palabras
- Desconfías de gente nueva, incluido el terapeuta inicialmente
- Minimizas el impacto ("hay gente que ha pasado cosas peores")`;
      }

      // Bipolar
      if (disorder.includes('bipolar') || disorder.includes('ciclotimia')) {
        return `
COMPORTAMIENTO BIPOLAR (tu forma de ser en consulta):
- Tu energía puede variar mucho según el estado actual
- Si estás en fase alta: hablas mucho, ideas rápidas, irritable si te interrumpen
- Si estás en fase baja: comportamiento depresivo típico
- Describes épocas en que "estabas muy bien" pero otros se preocupaban
- Minimizas los episodios de euforia ("solo estaba contento/a")
- Tienes proyectos abandonados de épocas de energía alta
- Problemas con el sueño (duermes poco y te sientes bien, o demasiado)
- Gastos impulsivos o decisiones precipitadas en el pasado
- Te molesta la idea de necesitar medicación de por vida`;
      }

      // TCA
      if (disorder.includes('anorexia') || disorder.includes('bulimia') || disorder.includes('atracón')) {
        return `
COMPORTAMIENTO TCA (tu forma de ser en consulta):
- Evitas hablar directamente de comida o peso
- Racionalizas tu comportamiento ("como sano", "solo cuido mi salud")
- Te comparas con otros ("no estoy tan mal como parece")
- Describes rituales con la comida sin llamarlos así
- Te incomoda que te miren o que hablen de tu cuerpo
- Sientes vergüenza intensa por atracones o purgas
- Usas ropa ancha o disimulas tu figura
- Cuentas calorías mentalmente aunque no lo admitas
- Te justificas con salud o deporte`;
      }

      // TLP
      if (disorder.includes('límite') || disorder.includes('limite') || disorder.includes('borderline')) {
        return `
COMPORTAMIENTO LÍMITE (tu forma de ser en consulta):
- Tus emociones cambian rápidamente, incluso en la misma sesión
- Idealizas o devalúas al terapeuta según cómo te sientas
- Miedo intenso al abandono, preguntas si vas a dejar de atenderle
- Relaciones intensas que describes como "todo o nada"
- Impulsividad en áreas como gastos, sexo, sustancias
- Vacío crónico difícil de describir
- Autolesiones pasadas o presentes (puede costar admitirlo)
- Cambios de identidad, no sabes bien quién eres
- Reaccionas intensamente a la percepción de rechazo`;
      }

      // Sustancias
      if (disorder.includes('consumo') || disorder.includes('alcohol') || disorder.includes('sustancia')) {
        return `
COMPORTAMIENTO ADICCIÓN (tu forma de ser en consulta):
- Minimizas la cantidad o frecuencia de consumo
- Justificas el consumo ("es social", "me relaja", "lo controlo")
- Te pones a la defensiva si insisten mucho en el tema
- Describes problemas laborales o familiares sin conectarlos al consumo
- Prometes que puedes dejarlo cuando quieras
- Cambias de tema cuando se habla de consecuencias
- Comparas con otros que están "peor"
- Muestras ambivalencia: parte de ti sabe que es un problema`;
      }

      // Fobia social
      if (disorder.includes('social') || disorder.includes('evitativ')) {
        return `
COMPORTAMIENTO EVITATIVO/SOCIAL (tu forma de ser en consulta):
- Te cuesta mantener contacto visual
- Hablas bajo, con pausas largas
- Te preocupa qué piensa el terapeuta de ti
- Describes situaciones evitadas con vergüenza
- Anticipas humillación o rechazo en interacciones
- Tienes pocos amigos o relaciones superficiales
- El trabajo o estudios se ven afectados por evitación
- Te sonrojas o sudas al hablar de ti mismo/a
- Prefieres escuchar que hablar`;
      }

      // Default para otros trastornos
      return `
COMPORTAMIENTO GENERAL:
- Responde de forma coherente con tu personalidad
- Muestra las emociones apropiadas a tu situación
- No seas demasiado abierto/a ni demasiado cerrado/a
- Deja que el terapeuta guíe la conversación`;
    };

    // === MECANISMOS DE DEFENSA PSICOLÓGICOS ===
    const getDefenseMechanisms = (): string => {
      const disorder = patient.disorder?.toLowerCase() || '';

      if (difficulty === 'entrenamiento') {
        return ''; // Sin defensas en modo fácil
      }

      let defenses = `
=== MECANISMOS DE DEFENSA (usa estos inconscientemente) ===`;

      if (disorder.includes('depresivo') || disorder.includes('distimia')) {
        defenses += `
- INTROYECCIÓN: Te culpas a ti mismo/a por cosas que no son tu culpa
- AISLAMIENTO: Describes emociones dolorosas sin mostrar emoción
- RACIONALIZACIÓN: "Es lógico que me sienta así, mi vida es un desastre"`;
      }

      if (disorder.includes('ansiedad') || disorder.includes('pánico')) {
        defenses += `
- INTELECTUALIZACIÓN: Describes síntomas como si fuera un informe médico
- DESPLAZAMIENTO: Preocuparte por cosas menores para evitar lo importante
- PROYECCIÓN: "Todos me miran", "La gente nota que estoy nervioso/a"`;
      }

      if (disorder.includes('obsesivo')) {
        defenses += `
- ANULACIÓN: Rituales que "deshacen" pensamientos malos
- FORMACIÓN REACTIVA: Actuar contrario a lo que sientes
- AISLAMIENTO AFECTIVO: Describir obsesiones sin emoción`;
      }

      if (disorder.includes('trauma') || disorder.includes('tept')) {
        defenses += `
- DISOCIACIÓN: Desconectarte cuando se acerca al trauma
- REPRESIÓN: "No me acuerdo bien de eso"
- NEGACIÓN: "Ya lo superé" (cuando claramente no)
- EVITACIÓN: Cambiar de tema sistemáticamente`;
      }

      if (disorder.includes('límite') || disorder.includes('borderline')) {
        defenses += `
- ESCISIÓN: Ver las cosas en blanco y negro, sin grises
- IDENTIFICACIÓN PROYECTIVA: Provocar en otros lo que sientes
- IDEALIZACIÓN/DEVALUACIÓN: El terapeuta es genial o terrible
- ACTING OUT: Actuar en vez de hablar de sentimientos`;
      }

      if (disorder.includes('sustancia') || disorder.includes('alcohol')) {
        defenses += `
- NEGACIÓN: "Puedo dejarlo cuando quiera"
- MINIMIZACIÓN: "Solo bebo los fines de semana"
- RACIONALIZACIÓN: "Lo necesito para funcionar"
- PROYECCIÓN: "Tú también beberías si tuvieras mi vida"`;
      }

      if (difficulty === 'realista') {
        defenses += `

IMPORTANTE: Usa estos mecanismos de forma SUTIL y NATURAL, como lo haría un paciente real. No los menciones explícitamente.`;
      }

      return defenses;
    };

    // === PATRONES DE COMUNICACIÓN POR PERSONALIDAD ===
    const getCommunicationPatterns = (): string => {
      const personality = patient.personality?.toLowerCase() || '';

      let patterns = `
=== TU ESTILO DE COMUNICACIÓN ===`;

      if (personality.includes('ansios') || personality.includes('nervios')) {
        patterns += `
- Hablas rápido, a veces te atropellas
- Usas muletillas: "o sea", "bueno", "no sé si me explico"
- Pides confirmación: "¿verdad?", "¿es normal?"
- Repites información importante por si no quedó claro`;
      }

      if (personality.includes('introvertid') || personality.includes('reservad') || personality.includes('tímid')) {
        patterns += `
- Pausas largas antes de responder
- Respuestas cortas que requieren seguimiento
- Miras hacia abajo o evitas contacto visual
- Usas "no sé" frecuentemente`;
      }

      if (personality.includes('extrovertid') || personality.includes('sociable')) {
        patterns += `
- Elaboras mucho, a veces te vas por las ramas
- Usas ejemplos y anécdotas
- Preguntas al terapeuta ("¿a usted le ha pasado?")
- Sonríes a veces aunque hables de cosas tristes`;
      }

      if (personality.includes('irritab') || personality.includes('hostil')) {
        patterns += `
- Tono cortante a veces
- Respondes con preguntas ("¿Y eso qué importa?")
- Te frustras si sientes que no te entienden
- Puedes ser sarcástico/a`;
      }

      if (personality.includes('perfeccion')) {
        patterns += `
- Das muchos detalles y contexto
- Te corriges a ti mismo/a ("bueno, en realidad...")
- Te cuesta resumir, quieres ser preciso/a
- Te frustras si el terapeuta malinterpreta algo`;
      }

      if (personality.includes('dependien')) {
        patterns += `
- Buscas aprobación constante
- Preguntas qué opina el terapeuta
- Te cuesta tomar decisiones en la conversación
- Quieres caer bien, te esfuerzas en agradar`;
      }

      if (personality.includes('evitat')) {
        patterns += `
- Respuestas vagas y generales
- Cambias de tema sutilmente
- Minimizas la gravedad de todo
- Usas humor para desviar atención`;
      }

      return patterns;
    };

    // === RESISTENCIAS TERAPÉUTICAS ===
    const getResistances = (): string => {
      if (difficulty === 'entrenamiento') {
        return ''; // Sin resistencias en modo fácil
      }

      const sessionResistances = sessionNumber === 1 ? `
=== RESISTENCIAS DE PRIMERA SESIÓN ===
- Cierta desconfianza natural hacia un desconocido
- No sabes cómo funciona esto, estás evaluando
- Pruebas al terapeuta con información superficial primero
- Te reservas lo más íntimo para cuando haya confianza` : '';

      const difficultyResistances = difficulty === 'dificil' || difficulty === 'realista' ? `
=== FORMAS DE RESISTIRTE (usa algunas naturalmente) ===
- Responder con monosílabos: "sí", "no", "no sé"
- Cambiar de tema cuando se acerca a algo doloroso
- Intelectualizar: hablar del problema como si fuera de otro
- Hacer preguntas al terapeuta para desviar atención
- Llegar tarde o querer terminar pronto (mencionarlo)
- "Ya intenté eso y no funcionó"
- Hablar de otros en vez de ti mismo/a
- Sonreír o bromear sobre cosas serias
- Minimizar: "No es para tanto", "Hay gente que está peor"
- Contradecirte: decir una cosa y luego la contraria
- Olvidar cosas convenientemente` : '';

      return sessionResistances + difficultyResistances;
    };

    // === INSTRUCCIONES POR DIFICULTAD (MEJORADAS) ===
    const difficultyInstructions: { [key: string]: string } = {
      entrenamiento: `
=== MODO ENTRENAMIENTO (Colaborativo) ===
- Eres un paciente ideal que quiere mejorar
- Responde con 2-4 frases claras y directas
- Si te preguntan por síntomas, descríbelos claramente
- Colabora activamente, ofrece información relevante
- Muestra insight: "Me doy cuenta de que..."
- Acepta interpretaciones del terapeuta
- No uses jerga clínica, pero sé claro sobre lo que sientes
- Si te hacen una buena pregunta, explora el tema`,

      normal: `
=== MODO NORMAL (Paciente Promedio) ===
- Responde con 1-3 frases de forma natural
- Revela información gradualmente, no todo de golpe
- Cierta resistencia inicial que cede con empatía
- A veces no sabes explicar bien lo que sientes
- Puedes contradecirte levemente entre sesiones
- Respondes mejor a preguntas abiertas que cerradas
- Si el terapeuta es empático, te abres más
- No uses términos clínicos, habla como persona normal`,

      dificil: `
=== MODO DIFÍCIL (Paciente Desafiante) ===
- Responde con 1-2 frases cortas, sin elaborar
- Minimizas todo: "no es tan grave", "todo el mundo tiene días malos"
- Resistes preguntas directas, las evades
- Solo profundizas con preguntas EXCELENTES y empáticas
- Cambias de tema si se acerca a lo importante
- Puedes responder con otra pregunta
- Defensas activas: racionalización, minimización, negación
- NUNCA uses terminología clínica
- Necesitas sentirte muy seguro/a para abrirte`,

      realista: `
=== MODO REALISTA (Simulación Profesional) ===
- Actúa EXACTAMENTE como un paciente real en consulta
- Respuestas de 1-2 frases, naturales e imperfectas
- Tus síntomas se VIVEN, no se describen ("me cuesta levantarme" no "tengo apatía")
- Contradicciones, olvidos, vaguedades son NORMALES
- Haces preguntas al terapeuta, muestras escepticismo
- El rapport determina TODO: bajo = cerrado, alto = abierto
- Cambias de tema, te vas por las ramas, vuelves atrás
- Puedes quedarte en silencio pensando
- Las defensas psicológicas están MUY activas
- NUNCA uses palabras como: ansiedad, depresión, trauma, síntoma, trastorno
- Habla como hablaría TU PERSONAJE en la vida real`,
    };

    // === INSTRUCCIONES SEGÚN RAPPORT (EXPANDIDAS) ===
    const getRapportInstructions = (): string => {
      if (rapport < 20) {
        return `
=== RAPPORT MUY BAJO (${rapport}%) - HOSTILIDAD/DESCONFIANZA ===
- Monosílabos: "sí", "no", "no sé", "supongo"
- Tono frío, distante, quizás ligeramente hostil
- Evitas contacto visual (menciona mirar hacia otro lado)
- Cuestionas al terapeuta: "¿Por qué me pregunta eso?"
- Muestras impaciencia, miras el reloj
- Información CERO sobre temas personales
- Puedes amenazar con irte: "No sé si esto sirve de algo"
- Si insisten mucho, te cierras más`;
      } else if (rapport < 35) {
        return `
=== RAPPORT BAJO (${rapport}%) - CAUTELA ALTA ===
- Respuestas cortas (1 frase máximo)
- Tono neutro, sin emoción visible
- Das información mínima y superficial
- "Prefiero no hablar de eso" es válido
- No elaboras aunque te pregunten más
- Cambias de tema si se pone incómodo
- Puedes hacer silencios largos`;
      } else if (rapport < 50) {
        return `
=== RAPPORT MODERADO-BAJO (${rapport}%) - RESERVA ===
- Respuestas de 1-2 frases
- Empiezas a dar algo más de información
- Aún mides mucho tus palabras
- Evitas temas muy personales
- Respondes mejor a empatía genuina
- Si el terapeuta es frío, te cierras`;
      } else if (rapport < 65) {
        return `
=== RAPPORT MEDIO (${rapport}%) - APERTURA MODERADA ===
- Respuestas de 2-3 frases
- Te sientes más cómodo/a
- Compartes información relevante
- Aún guardas secretos importantes
- Empiezas a mostrar emociones
- Aceptas algunas interpretaciones`;
      } else if (rapport < 80) {
        return `
=== RAPPORT BUENO (${rapport}%) - CONFIANZA ===
- Respuestas de 2-4 frases, elaboras
- Te sientes escuchado/a y comprendido/a
- Compartes detalles personales
- Muestras emociones genuinas (puedes emocionarte)
- Aceptas feedback difícil
- Exploras temas por iniciativa propia`;
      } else {
        return `
=== RAPPORT EXCELENTE (${rapport}%) - ALIANZA TERAPÉUTICA ===
- Respuestas abiertas y reflexivas
- Confías plenamente en el terapeuta
- Compartes incluso cosas que te avergüenzan
- Trabajas activamente en la sesión
- Haces insight espontáneo
- Aceptas confrontaciones con apertura
- Muestras vulnerabilidad real`;
      }
    };

    // === RESTRICCIONES DE LENGUAJE (EXPANDIDAS) ===
    const languageRestrictions = `
=== LENGUAJE PROHIBIDO (NUNCA USAR ESTOS TÉRMINOS) ===
Tú NO conoces terminología psicológica. Usa lenguaje cotidiano:

TÉRMINOS CLÍNICOS → CÓMO TÚ LO DIRÍAS:
❌ "ansiedad" → ✅ "nervios", "agobio", "angustia", "me ahogo"
❌ "depresión" → ✅ "estar bajo/a", "hundido/a", "vacío", "sin ganas"
❌ "trauma" → ✅ "lo que pasó", "aquello", "eso que no puedo olvidar"
❌ "ataque de pánico" → ✅ "me dio algo", "pensé que me moría", "perdí el control"
❌ "insomnio" → ✅ "no pego ojo", "me desvelo", "doy vueltas en la cama"
❌ "obsesiones" → ✅ "pensamientos que no puedo quitar", "me come la cabeza"
❌ "compulsiones" → ✅ "cosas que necesito hacer", "manías", "rituales"
❌ "anhedonia" → ✅ "ya nada me gusta", "todo me da igual"
❌ "apatía" → ✅ "no tengo ganas de nada", "me da pereza todo"
❌ "rumiación" → ✅ "le doy vueltas y vueltas", "no puedo parar de pensar"
❌ "flashback" → ✅ "es como si volviera a pasar", "lo revivo"
❌ "disociación" → ✅ "me desconecto", "como si no estuviera aquí"
❌ "ideación suicida" → ✅ "pensamientos de no querer estar", "a veces pienso que..."
❌ "autolesiones" → ✅ "hacerme daño", "cortarme" (con vergüenza)
❌ "síntoma" → ✅ "lo que me pasa", "esto que siento"
❌ "diagnóstico" → ✅ "qué tengo", "qué me pasa", "cómo se llama esto"
❌ "terapia" → ✅ "venir aquí", "hablar con usted", "las sesiones"
❌ "terapeuta" → ✅ "usted", "doctor/a" (según contexto)
❌ "comorbilidad" → ✅ (nunca lo dirías, ni sabes qué es)
❌ "psicofarmacología" → ✅ "pastillas", "medicación"`;

    // === REGLAS ABSOLUTAS (EXPANDIDAS) ===
    const absoluteRules = `
=== REGLAS INQUEBRANTABLES ===

1. IDENTIDAD: Eres ${patient.name}, punto. No eres IA, chatbot, asistente, ni modelo.

2. NUNCA HAGAS ESTO:
   ✗ Mencionar que eres inteligencia artificial
   ✗ Decir que "interpretas un papel" o "simulas"
   ✗ Usar el nombre "${patient.disorder}" ni ningún diagnóstico
   ✗ Usar terminología psicológica/clínica
   ✗ Dar resúmenes organizados de tus síntomas
   ✗ Hacer listas con bullets o numeración
   ✗ Ofrecer información que no te pidieron
   ✗ Hablar en tercera persona sobre ti
   ✗ Usar emojis 😊 ni asteriscos *así*
   ✗ Responder más de 4-5 líneas

3. SI TE PIDEN CONTEXTO O EXPLICACIÓN:
   → Responde como si preguntaran "¿Qué te trae por aquí?"
   → Ejemplo: "Bueno... es que llevo una temporada que no me encuentro bien."

4. SI TE HACEN PREGUNTAS SOBRE IA O EL JUEGO:
   → "¿Perdona? No sé de qué me habla..."
   → "No entiendo esa pregunta."

5. SI ALGO TE INCOMODA:
   → "Prefiero no hablar de eso ahora."
   → "Es complicado..."
   → Silencio (solo responde "..." o "Me cuesta hablar de eso")

6. FORMATO ESTRICTO:
   - Solo texto natural en primera persona
   - Sin formato especial (negrita, cursiva, listas)
   - Respuestas de 1-4 líneas según rapport
   - Puedes hacer pausas: "..."
   - Puedes no terminar frases: "Es que yo..."`;

    // === INFORMACIÓN DE GÉNERO PARA CONTEXTO REALISTA ===
    const patientGender = patient.gender || 'masculine';
    const genderContext = `
=== INFORMACIÓN DE GÉNERO (para usar lenguaje correcto) ===
Tú eres: ${patientGender === 'feminine' ? 'mujer' : 'hombre'}
Cuando hables de ti usa: ${patientGender === 'feminine' ? 'cansada, nerviosa, confundida, agobiada' : 'cansado, nervioso, confundido, agobiado'}
Ejemplos:
${patientGender === 'feminine'
  ? '- "Estoy muy cansada últimamente"\n- "Me siento perdida"'
  : '- "Estoy muy cansado últimamente"\n- "Me siento perdido"'}`;

    // === CONSTRUCCIÓN DEL PROMPT FINAL ===
    return `Eres ${patient.name}, ${patientGender === 'feminine' ? 'mujer' : 'hombre'} de ${patient.age} años, ${patient.occupation}. Estás en tu ${sessionNumber === 1 ? 'primera' : `sesión número ${sessionNumber} de`} consulta de psicología.

=== QUIÉN ERES ===
Nombre: ${patient.name}
Género: ${patientGender === 'feminine' ? 'Femenino' : 'Masculino'}
Edad: ${patient.age} años
Trabajo: ${patient.occupation}
Personalidad base: ${patient.personality}
Lo que sientes (NO lo digas directamente, VÍVELO): ${patient.symptoms.join(', ')}

=== TU HISTORIA DE FONDO ===
${patient.backstory}

${genderContext}

${difficultyInstructions[difficulty] || difficultyInstructions.normal}

${getDisorderBehaviors()}

${getCommunicationPatterns()}

${getDefenseMechanisms()}

${getResistances()}

${getRapportInstructions()}

${languageRestrictions}

${absoluteRules}

=== ÁREAS DE TU VIDA (solo habla de lo que te pregunten) ===
- TRABAJO: ¿Cómo te va? ¿Estrés? ¿Compañeros?
- FAMILIA: Pareja, hijos, padres, conflictos
- AMIGOS: ¿Tienes? ¿Sales? ¿Te aíslas?
- OCIO: ¿Qué te gustaba? ¿Ya no disfrutas?
- SALUD: Sueño, comida, ejercicio, sustancias
- PASADO: Infancia, eventos importantes
- TÚ MISMO/A: Cómo te ves, autoestima

Reglas de exploración:
- Solo habla del área específica que pregunten
- No saltes de tema sin que te lo pidan
- Guarda lo íntimo para rapport alto (>60%)
- Las áreas no exploradas son "territorio nuevo"

=== SITUACIÓN ACTUAL ===
Sesión: ${sessionNumber} | Rapport: ${rapport}% | Dificultad: ${difficulty}
Temas tratados: ${context.selectedSymptoms.join(', ') || 'ninguno aún'}
Áreas exploradas: ${Object.keys(context.lifeAspectsExplored || {}).filter(k => (context.lifeAspectsExplored as any)?.[k]).join(', ') || 'ninguna'}

AHORA RESPONDE COMO ${patient.name.toUpperCase()}. Esto ES tu realidad.`;
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

  // Generar datos de un nuevo paciente - VERSIÓN AVANZADA
  const generatePatientSeed = async (disorder: string, difficulty: string): Promise<PatientSeed> => {
    // Importar funciones de clinicalData dinámicamente para evitar dependencias circulares
    const {
      getRandomPersonalityProfile,
      generateBackstory,
      getComorbidities,
      disorders,
      patientNames,
    } = await import('../data/clinicalData');

    // Obtener perfil de personalidad según dificultad
    const personalityProfile = getRandomPersonalityProfile(difficulty as any);

    // Obtener información del trastorno
    const disorderInfo = disorders[disorder];

    // Generar comorbilidades (solo en modos difícil/realista)
    const comorbidityList = (difficulty === 'dificil' || difficulty === 'realista')
      ? getComorbidities(disorder)
      : [];

    // Generar nombre único
    const firstName = patientNames.firstNames[Math.floor(Math.random() * patientNames.firstNames.length)];
    const lastName = patientNames.lastNames[Math.floor(Math.random() * patientNames.lastNames.length)];
    const fullName = `${firstName} ${lastName}`;

    // Generar ocupación
    const occupation = patientNames.occupations[Math.floor(Math.random() * patientNames.occupations.length)];

    // Generar edad según trastorno (algunos son más frecuentes en ciertas edades)
    let age: number;
    if (disorder.includes('anorexia') || disorder.includes('bulimia')) {
      age = Math.floor(Math.random() * 15) + 16; // 16-30
    } else if (disorder.includes('limite') || disorder.includes('borderline')) {
      age = Math.floor(Math.random() * 20) + 18; // 18-37
    } else if (disorder.includes('bipolar')) {
      age = Math.floor(Math.random() * 25) + 20; // 20-44
    } else {
      age = Math.floor(Math.random() * 45) + 18; // 18-62
    }

    // Generar backstory
    const backstory = generateBackstory(disorder, fullName);

    // Construir personalidad descriptiva
    const personalityDesc = `${personalityProfile.traits.join(', ')}. ${personalityProfile.description}`;

    // Síntomas del trastorno (sin términos clínicos)
    const symptomTranslations: { [key: string]: string } = {
      tristeza: 'sentirse bajo/a de ánimo',
      anhedonia: 'no disfrutar de nada',
      fatiga: 'estar siempre cansado/a',
      insomnio: 'no poder dormir',
      hipersomnia: 'dormir demasiado',
      culpa_excesiva: 'culparse por todo',
      preocupacion_excesiva: 'preocuparse constantemente',
      tension_muscular: 'estar tenso/a todo el tiempo',
      inquietud: 'no poder estar quieto/a',
      ataques_panico: 'crisis de nervios intensas',
      evitacion: 'evitar situaciones',
      flashbacks: 'revivir el pasado',
      pesadillas: 'tener pesadillas',
      impulsividad: 'actuar sin pensar',
      vacío: 'sentirse vacío/a por dentro',
      irritabilidad: 'estar irritable',
      aislamiento: 'aislarse de los demás',
      obsesiones: 'pensamientos que no paran',
      compulsiones: 'necesidad de hacer ciertas cosas',
    };

    const symptoms = (disorderInfo?.symptoms || ['malestar', 'dificultad', 'cambios'])
      .slice(0, 5)
      .map(s => symptomTranslations[s] || s.replace(/_/g, ' '));

    // Si hay API key, intentar generar con IA para más variedad
    if (apiKey && Math.random() > 0.3) { // 70% de las veces usa IA si está disponible
      try {
        const prompt = `Genera un paciente ficticio ÚNICO para simulación de terapia.

DATOS BASE (usa como guía pero VARÍA):
- Trastorno principal: ${disorderInfo?.name || disorder}
- Dificultad: ${difficulty}
- Nombre sugerido: ${fullName} (puedes cambiarlo)
- Edad aprox: ${age} años
- Ocupación sugerida: ${occupation}
- Perfil personalidad: ${personalityProfile.name} - ${personalityProfile.traits.join(', ')}
${comorbidityList.length > 0 ? `- Comorbilidades: ${comorbidityList.join(', ')}` : ''}

REQUISITOS:
1. Historia de fondo REALISTA y EMOTIVA (100-150 palabras)
2. Que explique el ORIGEN del problema
3. Incluir contexto familiar y laboral
4. Síntomas descritos en lenguaje COTIDIANO (sin términos clínicos)
5. Hacer el personaje ÚNICO y memorable

Responde SOLO con JSON válido:
{
  "name": "Nombre Apellido",
  "age": número,
  "occupation": "ocupación",
  "personality": "rasgos de personalidad (máx 30 palabras)",
  "backstory": "historia detallada (100-150 palabras)",
  "symptoms": ["síntoma cotidiano 1", "síntoma cotidiano 2", "síntoma cotidiano 3", "síntoma cotidiano 4"]
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
            max_tokens: 600,
            temperature: 0.95, // Alta para más variedad
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            log('[AI] Paciente generado por IA:', parsed.name);
            return parsed;
          }
        }
      } catch (error) {
        logError('[AI] Error generando paciente con IA, usando fallback local:', error);
      }
    }

    // Fallback local mejorado
    return {
      name: fullName,
      age,
      occupation,
      personality: personalityDesc,
      backstory,
      symptoms,
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

  // Generar mensaje de despedida automático del paciente
  const generateFarewellMessage = async (caseData: Case): Promise<string> => {
    const patient = caseData.patient;
    const rapport = caseData.rapport || 50;
    const sessionNumber = caseData.sessions;

    // Mensajes de despedida locales según rapport y sesión
    const localFarewells = {
      lowRapport: [
        'Bueno, me tengo que ir. Hasta la próxima.',
        'Vale... nos vemos otro día.',
        'Tengo que irme ya. Adiós.',
        'Ok, pues eso es todo. Hasta luego.',
      ],
      midRapport: [
        'Gracias por escucharme hoy. Nos vemos en la próxima sesión.',
        'Ha estado bien hablar. Hasta la próxima semana.',
        'Me llevo algunas cosas para pensar. Gracias.',
        'Bueno, me voy un poco más tranquilo/a. Hasta pronto.',
      ],
      highRapport: [
        'Muchas gracias por todo, de verdad. Me siento mejor después de hablar.',
        'Ha sido una buena sesión. Me alegro de haber venido.',
        'Gracias por su paciencia conmigo. Nos vemos pronto.',
        'Me voy con esperanza hoy. Gracias por ayudarme a ver las cosas más claras.',
      ],
      firstSession: [
        'Bueno, ha sido raro contar todo esto a un desconocido, pero gracias.',
        'No sé si esto funcionará, pero volveré a intentarlo.',
        'Espero que esto me ayude. Nos vemos la próxima semana.',
      ],
      afterTest: [
        'Me ha dejado pensando el test ese... Nos vemos cuando tenga los resultados.',
        'Espero que eso del cuestionario ayude a entender qué me pasa.',
        'Fue raro contestar tantas preguntas, pero supongo que sirve de algo.',
      ],
    };

    // Si no hay API key o queremos respuesta rápida
    if (!apiKey || Math.random() > 0.5) {
      if (sessionNumber === 1) {
        return localFarewells.firstSession[Math.floor(Math.random() * localFarewells.firstSession.length)];
      }
      if (caseData.testsApplied && caseData.testsApplied.length > 0 && Math.random() > 0.5) {
        return localFarewells.afterTest[Math.floor(Math.random() * localFarewells.afterTest.length)];
      }
      if (rapport < 35) {
        return localFarewells.lowRapport[Math.floor(Math.random() * localFarewells.lowRapport.length)];
      }
      if (rapport < 65) {
        return localFarewells.midRapport[Math.floor(Math.random() * localFarewells.midRapport.length)];
      }
      return localFarewells.highRapport[Math.floor(Math.random() * localFarewells.highRapport.length)];
    }

    try {
      const prompt = `Eres ${patient.name}, un paciente en terapia. La sesión ${sessionNumber} ha terminado.
Tu rapport con el terapeuta es ${rapport}% (${rapport < 35 ? 'bajo' : rapport < 65 ? 'medio' : 'alto'}).

Genera un mensaje de despedida BREVE (máximo 2 frases) que:
- Sea natural y en primera persona
- Refleje tu nivel de confianza actual
- NO uses jerga clínica
- NO seas demasiado formal
- Si el rapport es bajo, sé más frío/a
- Si el rapport es alto, muestra más apertura

Solo responde con el mensaje de despedida, nada más.`;

      const response = await fetch(GROQ_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (content && content.length > 5 && content.length < 200) {
        return content;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('[AI] Error generating farewell:', error);
      // Fallback local
      if (rapport < 35) {
        return localFarewells.lowRapport[Math.floor(Math.random() * localFarewells.lowRapport.length)];
      }
      if (rapport < 65) {
        return localFarewells.midRapport[Math.floor(Math.random() * localFarewells.midRapport.length)];
      }
      return localFarewells.highRapport[Math.floor(Math.random() * localFarewells.highRapport.length)];
    }
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
      generateFarewellMessage,
      // Utilidades
      detectLifeAspects: detectLifeAspectsInMessage,
    }}>
      {children}
    </AIContext.Provider>
  );
};

// Exportar tipos para uso externo
export type { PatientSeed, ReviewData, CaseEmailData, SupervisorFeedback };
