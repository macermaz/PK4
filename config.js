// Configuración de PSYKAT
const PSYKAT_CONFIG = {
    // Configuración de IA
    ai: {
        // Modo de funcionamiento: 'local' o 'n8n'
        mode: 'local',
        
        // Endpoint de n8n (cuando mode = 'n8n')
        n8nEndpoint: 'http://localhost:5678/webhook/ask',
        
        // Timeout por modo (en milisegundos)
        timeouts: {
            entrenamiento: 10000,
            dificil: 15000,
            realista: 20000,
            historico: 12000
        },
        
        // Configuración de prompts
        prompts: {
            system: `Eres un paciente ficticio español en una sesión de terapia. Tu personalidad y síntomas siguen el DSM-5-TR. No revelas todo de golpe. Solo inventas nombres, episodios o recuerdos SI la pregunta del terapeuta es abierta o empática. Mantén coherencia total con tu historia inicial. Max 2 frases por mensaje.`,
            
            patientProfiles: {
                'depresion_mayor': {
                    personality: 'reservado',
                    baseSymptoms: ['tristeza', 'pérdida_interés', 'fatiga', 'insomnio', 'culpa'],
                    speechPatterns: ['No sé...', 'Todo está muy difícil', 'No veo salida'],
                    backstory: 'Divorcio reciente, problemas económicos'
                },
                'trastorno_ansiedad_generalizada': {
                    personality: 'preocupado',
                    baseSymptoms: ['ansiedad', 'preocupación_excesiva', 'irritabilidad', 'concentración'],
                    speechPatterns: ['Me preocupa que...', '¿Y si...?', 'No puedo dejar de pensar en...'],
                    backstory: 'Problemas laborales, padre estricto en infancia'
                },
                'trastorno_pánico': {
                    personality: 'ansioso',
                    baseSymptoms: ['ataques_pánico', 'evitación', 'sudoración', 'palpitaciones'],
                    speechPatterns: ['Me da miedo que...', 'Siento que me voy a morir', 'No puedo salir de casa'],
                    backstory: 'Trauma en adolescencia, miedo a espacios cerrados'
                }
            }
        }
    },
    
    // Configuración del juego
    game: {
        // Número de preguntas por sesión
        questionsPerSession: 5,
        
        // Máximo de casos simultáneos
        maxActiveCases: 5,
        
        // Niveles y XP
        levels: {
            1: { name: 'Principiante', xpRequired: 0 },
            2: { name: 'Aprendiz', xpRequired: 100 },
            3: { name: 'Intermedio', xpRequired: 250 },
            4: { name: 'Avanzado', xpRequired: 500 },
            5: { name: 'Experto', xpRequired: 1000 },
            6: { name: 'Maestro', xpRequired: 2000 },
            7: { name: 'Especialista', xpRequired: 4000 },
            8: { name: 'Veterano', xpRequired: 8000 },
            9: { name: 'Leyenda', xpRequired: 16000 },
            10: { name: 'Sabio', xpRequired: 32000 }
        },
        
        // Puntuación XP por acción
        xpRewards: {
            correctDiagnosis: 100,
            incorrectDiagnosis: 25,
            sessionCompleted: 50,
            batteryApplied: 30,
            symptomIdentified: 10,
            videoInteraction: 5
        },
        
        // Modos de juego
        modes: {
            entrenamiento: {
                name: 'Entrenamiento',
                description: 'Modo educativo con ayudas',
                unlockLevel: 1,
                hasHints: true,
                xpMultiplier: 1.0
            },
            dificil: {
                name: 'Difícil',
                description: 'Casos complejos con pistas limitadas',
                unlockLevel: 5,
                hasHints: false,
                xpMultiplier: 1.5
            },
            realista: {
                name: 'Realista',
                description: 'Simulación real con sistema de rapport',
                unlockLevel: 10,
                hasHints: false,
                xpMultiplier: 2.0,
                hasRapport: true
            },
            historico: {
                name: 'Histórico',
                description: 'Casos basados en personajes reales',
                unlockLevel: 15,
                hasHints: false,
                xpMultiplier: 2.5,
                isPremium: true
            }
        }
    },
    
    // Configuración clínica
    clinical: {
        // DSM-5-TR Trastornos
        disorders: {
            'depresion_mayor': {
                name: 'Trastorno Depresivo Mayor',
                code: 'F32.x',
                criteriaCount: 5,
                duration: '2 semanas',
                symptoms: ['tristeza', 'anhedonia', 'cambios_peso', 'insomnio', 'psicomotor', 'fatiga', 'culpa', 'cognicion', 'pensamientos_muerte']
            },
            'trastorno_ansiedad_generalizada': {
                name: 'Trastorno de Ansiedad Generalizada',
                code: 'F41.1',
                criteriaCount: 3,
                duration: '6 meses',
                symptoms: ['preocupacion_excesiva', 'dificultad_control', 'sintomas_somaticos', 'sintomas_cognitivos']
            },
            'trastorno_pánico': {
                name: 'Trastorno de Pánico',
                code: 'F41.0',
                criteriaCount: 4,
                duration: '1 mes',
                symptoms: ['ataques_panico', 'preocupacion_ataques', 'comportamiento_evitacion']
            },
            'tept': {
                name: 'Trastorno de Estrés Postraumático',
                code: 'F43.1',
                criteriaCount: 6,
                duration: '1 mes',
                symptoms: ['exposicion_trauma', 'recuerdos_intrusivos', 'evitacion', 'cogniciones_negativas', 'hipervigilancia']
            },
            'fobia_social': {
                name: 'Fobia Social',
                code: 'F40.1',
                criteriaCount: 4,
                duration: '6 meses',
                symptoms: ['miedo_social', 'miedo_humillacion', 'exposicion_social', 'evitacion']
            }
        },
        
        // Baterías de tests
        batteries: {
            'bdi': {
                name: 'Beck Depression Inventory-II',
                type: 'depresion',
                items: 21,
                duration: '5-10 minutos',
                ranges: {
                    minima: { min: 0, max: 13, description: 'Depresión mínima' },
                    leve: { min: 14, max: 19, description: 'Depresión leve' },
                    moderada: { min: 20, max: 28, description: 'Depresión moderada' },
                    severa: { min: 29, max: 63, description: 'Depresión severa' }
                }
            },
            'bai': {
                name: 'Beck Anxiety Inventory',
                type: 'ansiedad',
                items: 21,
                duration: '5-10 minutos',
                ranges: {
                    minima: { min: 0, max: 7, description: 'Ansiedad mínima' },
                    leve: { min: 8, max: 15, description: 'Ansiedad leve' },
                    moderada: { min: 16, max: 25, description: 'Ansiedad moderada' },
                    severa: { min: 26, max: 63, description: 'Ansiedad severa' }
                }
            },
            'pcl': {
                name: 'PTSD Checklist for DSM-5',
                type: 'trauma',
                items: 20,
                duration: '5-8 minutos',
                ranges: {
                    no_sintomas: { min: 0, max: 20, description: 'Sin síntomas significativos' },
                    leve: { min: 21, max: 34, description: 'Síntomas leves' },
                    moderado: { min: 35, max: 43, description: 'Síntomas moderados' },
                    severo: { min: 44, max: 80, description: 'Síntomas severos' }
                }
            }
        }
    },
    
    // Configuración de monetización
    monetization: {
        // Modelo freemium
        freemium: {
            freeCasesPerDay: 2,
            freeModes: ['entrenamiento'],
            premiumModes: ['dificil', 'realista', 'historico'],
            hasAds: true
        },
        
        // Precios (ejemplo)
        pricing: {
            monthly: 9.99,
            yearly: 89.99,
            lifetime: 299.99
        },
        
        // Beneficios premium
        premiumBenefits: [
            'Acceso a todos los modos de juego',
            'Casos ilimitados por día',
            'Sin anuncios',
            'Contenido exclusivo',
            'Baterías de tests avanzadas',
            'Estadísticas detalladas',
            'Soporte prioritario'
        ]
    },
    
    // Configuración técnica
    technical: {
        // Storage
        storageKeys: {
            userState: 'psykat_user_state',
            cases: 'psykat_cases',
            settings: 'psykat_settings',
            aiConfig: 'psykat_ai_config'
        },
        
        // Analytics (placeholder)
        analytics: {
            enabled: false,
            trackingId: null
        },
        
        // Performance
        performance: {
            maxMessagesPerChat: 1000,
            cacheExpiration: 24 * 60 * 60 * 1000, // 24 horas
            lazyLoading: true
        }
    }
};

// Funciones de utilidad para la configuración
const ConfigUtils = {
    // Obtener configuración
    get: (path, defaultValue = null) => {
        const keys = path.split('.');
        let current = PSYKAT_CONFIG;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    },
    
    // Establecer configuración (para settings dinámicos)
    set: (path, value) => {
        const keys = path.split('.');
        let current = PSYKAT_CONFIG;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    },
    
    // Obtener nivel actual
    getCurrentLevel: (xp) => {
        const levels = ConfigUtils.get('game.levels');
        let currentLevel = 1;
        
        for (const [level, data] of Object.entries(levels)) {
            if (xp >= data.xpRequired) {
                currentLevel = parseInt(level);
            }
        }
        
        return currentLevel;
    },
    
    // Obtener siguiente nivel
    getNextLevel: (currentLevel) => {
        const levels = ConfigUtils.get('game.levels');
        const nextLevel = currentLevel + 1;
        
        return levels[nextLevel] || null;
    },
    
    // Verificar si un modo está desbloqueado
    isModeUnlocked: (mode, userLevel) => {
        const modeConfig = ConfigUtils.get(`game.modes.${mode}`);
        return modeConfig && userLevel >= modeConfig.unlockLevel;
    },
    
    // Obtener configuración de trastorno
    getDisorderConfig: (disorderKey) => {
        return ConfigUtils.get(`clinical.disorders.${disorderKey}`);
    },
    
    // Obtener configuración de batería
    getBatteryConfig: (batteryKey) => {
        return ConfigUtils.get(`clinical.batteries.${batteryKey}`);
    }
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PSYKAT_CONFIG, ConfigUtils };
} else {
    window.PSYKAT_CONFIG = PSYKAT_CONFIG;
    window.ConfigUtils = ConfigUtils;
}