/**
 * PSYKAT - Configuración de Entorno
 *
 * Este archivo centraliza toda la configuración del entorno.
 * Cambia IS_DEVELOPMENT a false antes de publicar la app.
 */

// ============================================
// CONFIGURACIÓN PRINCIPAL
// ============================================

/**
 * Modo de desarrollo
 * - true: Usa API key de desarrollo, monedas infinitas, timers cortos
 * - false: Modo producción, requiere backend seguro
 */
export const IS_DEVELOPMENT = true;

/**
 * Configuración por entorno
 */
const ENV_CONFIG = {
  development: {
    // API Key de desarrollo (solo para testing local)
    // ADVERTENCIA: Esta key se expone en el cliente. Solo usar en desarrollo.
    GROQ_API_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // Timers cortos para testing
    TREATMENT_WAIT_MS: 5000, // 5 segundos

    // Usuario inicial con ventajas para testing
    INITIAL_USER: {
      level: 10,
      coins: 99999,
      xp: 5000,
    },

    // Logs habilitados
    ENABLE_LOGS: true,

    // Rate limiting desactivado
    RATE_LIMIT_ENABLED: false,
  },

  production: {
    // En producción, la API key viene del backend (Supabase Edge Functions)
    // El cliente NO debe tener acceso directo a la API key
    GROQ_API_KEY: null,

    // Timer real de 2 días
    TREATMENT_WAIT_MS: 2 * 24 * 60 * 60 * 1000, // 2 días en ms

    // Usuario inicial normal
    INITIAL_USER: {
      level: 1,
      coins: 100,
      xp: 0,
    },

    // Logs desactivados
    ENABLE_LOGS: false,

    // Rate limiting activado
    RATE_LIMIT_ENABLED: true,
  },
};

// ============================================
// EXPORTACIONES
// ============================================

// Configuración actual según el entorno
export const CONFIG = IS_DEVELOPMENT ? ENV_CONFIG.development : ENV_CONFIG.production;

// Helpers para acceso rápido
export const getApiKey = (): string | null => CONFIG.GROQ_API_KEY;
export const getTreatmentWaitTime = (): number => CONFIG.TREATMENT_WAIT_MS;
export const getInitialUser = () => CONFIG.INITIAL_USER;
export const isLoggingEnabled = (): boolean => CONFIG.ENABLE_LOGS;
export const isRateLimitEnabled = (): boolean => CONFIG.RATE_LIMIT_ENABLED;

// ============================================
// CONFIGURACIÓN DE IA
// ============================================

export const AI_CONFIG = {
  // Groq API
  groq: {
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    maxTokens: 300,
    defaultTemperature: 0.7,
  },

  // Temperaturas por modo de dificultad
  temperatures: {
    entrenamiento: 0.7,
    normal: 0.8,
    dificil: 0.9,
    realista: 0.95,
  } as Record<string, number>,

  // Límites
  limits: {
    maxConversationHistory: 10,
    maxQuestionsPerSession: 5,
    requestTimeout: 30000, // 30 segundos
  },
};

// ============================================
// CONFIGURACIÓN DE SUPABASE (Fase 2)
// ============================================

export const SUPABASE_CONFIG = {
  // Estos valores se configurarán cuando se implemente Supabase
  url: '', // 'https://tu-proyecto.supabase.co'
  anonKey: '', // 'eyJ...' (clave pública, segura de exponer)

  // Edge Functions endpoints
  endpoints: {
    generateResponse: '/functions/v1/ai-generate-response',
    generatePatient: '/functions/v1/ai-generate-patient',
    generateReview: '/functions/v1/ai-generate-review',
  },
};

// ============================================
// LOGGING HELPER
// ============================================

export const log = (message: string, data?: any) => {
  if (CONFIG.ENABLE_LOGS) {
    if (data) {
      console.log(`[PSYKAT] ${message}`, data);
    } else {
      console.log(`[PSYKAT] ${message}`);
    }
  }
};

export const logError = (message: string, error?: any) => {
  // Los errores siempre se loggean
  console.error(`[PSYKAT ERROR] ${message}`, error || '');
};
