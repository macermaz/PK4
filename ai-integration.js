// Sistema de integración con IA
class AIIntegration {
    constructor() {
        this.endpoint = localStorage.getItem('n8nEndpoint') || 'http://localhost:5678/webhook/ask';
        this.mode = localStorage.getItem('aiMode') || 'local';
        this.loading = false;
        this.abortController = null;
    }

    // Método principal para enviar preguntas a la IA
    async ask(patientMessage, caseData = {}, mode = 'entrenamiento') {
        if (this.mode === 'local') {
            return this.generateLocalResponse(patientMessage, caseData, mode);
        } else {
            return this.callN8NEndpoint(patientMessage, caseData, mode);
        }
    }

    // Respuestas simuladas locales (para demostración sin n8n)
    generateLocalResponse(message, caseData, mode) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = this.getContextualResponses(message, caseData);
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                resolve({
                    response: response,
                    score: this.calculateScore(message, mode),
                    color: this.getResponseColor(),
                    sessionId: caseData.sessionId || `session_${Date.now()}`
                });
            }, 1000 + Math.random() * 2000); // Retraso realista
        });
    }

    // Llamada al endpoint de n8n
    async callN8NEndpoint(message, caseData, mode) {
        this.loading = true;
        
        // Cancelar petición anterior si existe
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        // Preparar payload según tu especificación
        const payload = {
            doctorQuestion: message,
            patientName: caseData.patient?.name || 'Paciente',
            disorder: caseData.patient?.disorder || 'Trastorno por determinar',
            personality: caseData.patient?.personality || 'colaborativo',
            symptoms: caseData.selectedSymptoms || caseData.patient?.symptoms || ['malestar general'],
            mode: mode,
            caseFileData: caseData,
            conversationHistory: (caseData.messages || [])
                .slice(-6)
                .map(msg => ({
                    isUser: msg.sender === 'user',
                    text: msg.text,
                    timestamp: msg.timestamp
                })),
            sessionId: caseData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            questionCount: caseData.questionCount || 0
        };

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: this.abortController.signal,
                timeout: this.getTimeoutForMode(mode)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                response: this.extractResponse(data),
                score: this.calculateModeScore(data.score, mode, message),
                color: this.getModeColor(data.color, mode),
                sessionId: payload.sessionId,
                mode: mode,
                rawData: data // Para debugging
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    response: 'Petición cancelada',
                    score: 0,
                    color: 'brown',
                    sessionId: payload.sessionId
                };
            }

            console.error('Error en llamada a n8n:', error);
            
            // Fallback a respuesta local si n8n falla
            return this.generateLocalResponse(message, caseData, mode);
        } finally {
            this.loading = false;
            this.abortController = null;
        }
    }

    // Métodos auxiliares
    getContextualResponses(message, caseData) {
        const msg = message.toLowerCase();
        const patient = caseData.patient;
        
        // Respuestas basadas en el trastorno del paciente
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

        // Respuestas genéricas
        return [
            "Es difícil hablar de esto...",
            "No sé cómo explicarlo",
            "Me siento confundido/a",
            "¿Cree que estoy loco/a?",
            "A veces pienso que no hay solución"
        ];
    }

    calculateScore(message, mode) {
        let baseScore = Math.floor(Math.random() * 40) + 40; // 40-80
        
        // Bonus por calidad de pregunta
        let qualityBonus = 0;
        
        if (this.isOpenEndedQuestion(message)) qualityBonus += 15;
        if (this.isEmpathicQuestion(message)) qualityBonus += 10;
        if (this.isClosedQuestion(message)) qualityBonus -= 10;
        if (this.isLeadingQuestion(message)) qualityBonus -= 15;

        // Aplicar modificador por modo
        switch (mode) {
            case 'entrenamiento':
                return Math.min(100, (baseScore + qualityBonus) * 1.2);
            case 'difícil':
                return baseScore + qualityBonus;
            case 'realista':
                return Math.max(10, (baseScore + qualityBonus) * 0.8);
            default:
                return baseScore + qualityBonus;
        }
    }

    calculateModeScore(baseScore, mode, question) {
        let score = baseScore || Math.floor(Math.random() * 60) + 20;
        
        // Analizar calidad de pregunta
        let qualityBonus = 0;
        
        if (this.isOpenEndedQuestion(question)) qualityBonus += 15;
        if (this.isEmpathicQuestion(question)) qualityBonus += 10;
        if (this.isClosedQuestion(question)) qualityBonus -= 10;
        if (this.isLeadingQuestion(question)) qualityBonus -= 15;

        // Aplicar modificador por modo
        switch (mode) {
            case 'entrenamiento':
                score = Math.min(100, (score + qualityBonus) * 1.2);
                break;
            case 'difícil':
                score = score + qualityBonus;
                break;
            case 'realista':
                score = Math.max(10, (score + qualityBonus) * 0.8);
                break;
        }
        
        return Math.round(Math.max(0, Math.min(100, score)));
    }

    getResponseColor() {
        const colors = ['green', 'blue', 'purple', 'brown'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getModeColor(baseColor, mode) {
        if (baseColor) return baseColor;
        
        const colorsByMode = {
            'entrenamiento': ['green', 'blue'],
            'difícil': ['brown', 'purple', 'blue'],
            'realista': ['brown', 'purple', 'green', 'blue']
        };
        
        const colors = colorsByMode[mode] || ['brown'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    extractResponse(data) {
        if (data.response) return data.response;
        if (data.content) return data.content;
        if (data.message) return data.message;
        if (typeof data === 'string') return data;
        return 'No pude procesar esa pregunta...';
    }

    getTimeoutForMode(mode) {
        switch (mode) {
            case 'entrenamiento': return 10000;
            case 'difícil': return 15000;
            case 'realista': return 20000;
            default: return 12000;
        }
    }

    // Análisis de preguntas
    isOpenEndedQuestion(question) {
        const openStarters = ['cómo', 'qué', 'cuándo', 'dónde', 'por qué', 'cuéntame', 'descríbeme', 'explícame'];
        return openStarters.some(starter => question.toLowerCase().includes(starter));
    }

    isEmpathicQuestion(question) {
        const empathicWords = ['debe ser difícil', 'imagino que', 'entiendo que', 'debe doler', 'te comprendo'];
        return empathicWords.some(word => question.toLowerCase().includes(word));
    }

    isClosedQuestion(question) {
        return question.toLowerCase().startsWith('¿tienes') || 
               question.toLowerCase().startsWith('¿has') ||
               question.toLowerCase().includes('sí o no') ||
               question.toLowerCase().startsWith('¿eres');
    }

    isLeadingQuestion(question) {
        const leadingWords = ['¿no crees que', '¿no te parece que', '¿verdad que', 'supongo que'];
        return leadingWords.some(word => question.toLowerCase().includes(word));
    }

    // Configuración
    setEndpoint(endpoint) {
        this.endpoint = endpoint;
        localStorage.setItem('n8nEndpoint', endpoint);
    }

    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('aiMode', mode);
    }

    async testConnection() {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    test: true,
                    message: 'Ping'
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error de conexión:', error);
            return false;
        }
    }

    // Cancelar petición actual
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    // Estado de carga
    isLoading() {
        return this.loading;
    }
}

// Sistema de integración mejorado para PSYKAT
class PSYKATAI {
    constructor() {
        this.ai = new AIIntegration();
        this.currentCase = null;
        this.conversationHistory = [];
    }

    // Inicializar con datos del caso actual
    setCurrentCase(caseData) {
        this.currentCase = caseData;
        this.conversationHistory = caseData.messages || [];
    }

    // Enviar mensaje del terapeuta
    async sendTherapistMessage(message) {
        if (!this.currentCase) {
            throw new Error('No hay caso activo');
        }

        // Añadir mensaje del terapeuta al historial
        const therapistMessage = {
            id: this.generateId(),
            text: message,
            sender: 'user',
            timestamp: new Date(),
            type: 'text'
        };

        this.conversationHistory.push(therapistMessage);

        // Preparar datos del caso
        const caseData = {
            ...this.currentCase,
            messages: this.conversationHistory,
            questionCount: this.conversationHistory.filter(m => m.sender === 'user').length,
            sessionId: this.currentCase.sessionId || `session_${Date.now()}`
        };

        try {
            // Llamar a la IA
            const aiResponse = await this.ai.ask(message, caseData, this.currentCase.mode || 'entrenamiento');

            // Añadir respuesta del paciente al historial
            const patientMessage = {
                id: this.generateId(),
                text: aiResponse.response,
                sender: 'patient',
                timestamp: new Date(),
                type: 'text',
                score: aiResponse.score,
                color: aiResponse.color
            };

            this.conversationHistory.push(patientMessage);

            // Actualizar caso con nuevo historial
            this.currentCase.messages = this.conversationHistory;
            this.currentCase.sessionId = aiResponse.sessionId;

            return {
                therapistMessage,
                patientMessage,
                aiResponse
            };

        } catch (error) {
            console.error('Error en comunicación con IA:', error);
            
            // Fallback a respuesta local
            const fallbackMessage = {
                id: this.generateId(),
                text: 'Lo siento, estoy teniendo problemas técnicos. ¿Podemos continuar más tarde?',
                sender: 'patient',
                timestamp: new Date(),
                type: 'text',
                score: 0,
                color: 'brown'
            };

            this.conversationHistory.push(fallbackMessage);
            this.currentCase.messages = this.conversationHistory;

            return {
                therapistMessage,
                patientMessage: fallbackMessage,
                aiResponse: {
                    response: fallbackMessage.text,
                    score: 0,
                    color: 'brown',
                    sessionId: caseData.sessionId
                }
            };
        }
    }

    // Aplicar batería de tests
    async applyTestBattery(batteryType) {
        if (!this.currentCase) return null;

        const battery = {
            id: batteryType,
            name: this.getBatteryName(batteryType),
            timestamp: new Date()
        };

        // Simular resultados de batería
        const results = this.generateBatteryResults(batteryType);

        // Añadir mensaje de aplicación de batería
        const batteryMessage = {
            id: this.generateId(),
            text: `Te enviaré el cuestionario ${battery.name}. Por favor complétalo cuando puedas.`,
            sender: 'user',
            timestamp: new Date(),
            type: 'battery'
        };

        this.conversationHistory.push(batteryMessage);

        // Añadir resultados
        const resultsMessage = {
            id: this.generateId(),
            text: `Aquí tienes los resultados del ${battery.name}:\n\n${results}`,
            sender: 'patient',
            timestamp: new Date(Date.now() + 2000), // 2 segundos después
            type: 'results'
        };

        this.conversationHistory.push(resultsMessage);

        // Actualizar caso
        this.currentCase.batteryApplied = batteryType;
        this.currentCase.batteryResults = results;
        this.currentCase.messages = this.conversationHistory;

        return {
            batteryMessage,
            resultsMessage,
            results
        };
    }

    getBatteryName(batteryType) {
        const names = {
            'bdi': 'BDI-II (Inventario Depresión)',
            'bai': 'BAI (Inventario Ansiedad)',
            'pcl': 'PCL-5 (TEPT)',
            'audit': 'AUDIT (Consumo Alcohol)'
        };
        return names[batteryType] || 'Test Psicológico';
    }

    generateBatteryResults(batteryType) {
        const scores = {
            'bdi': Math.floor(Math.random() * 63) + 1,
            'bai': Math.floor(Math.random() * 63) + 1,
            'pcl': Math.floor(Math.random() * 80) + 1,
            'audit': Math.floor(Math.random() * 40) + 1
        };

        const score = scores[batteryType];
        let interpretation = '';
        let clinical = '';

        switch(batteryType) {
            case 'bdi':
                if (score < 14) {
                    interpretation = 'Depresión mínima';
                    clinical = 'No clínicamente significativo';
                } else if (score < 20) {
                    interpretation = 'Depresión leve';
                    clinical = 'Levemente elevado';
                } else if (score < 29) {
                    interpretation = 'Depresión moderada';
                    clinical = 'Moderadamente elevado';
                } else {
                    interpretation = 'Depresión severa';
                    clinical = 'Severamente elevado';
                }
                break;
            case 'bai':
                if (score < 8) {
                    interpretation = 'Ansiedad mínima';
                    clinical = 'No clínicamente significativo';
                } else if (score < 16) {
                    interpretation = 'Ansiedad leve';
                    clinical = 'Levemente elevado';
                } else if (score < 26) {
                    interpretation = 'Ansiedad moderada';
                    clinical = 'Moderadamente elevado';
                } else {
                    interpretation = 'Ansiedad severa';
                    clinical = 'Severamente elevado';
                }
                break;
            default:
                interpretation = 'Nivel moderado';
                clinical = 'Requiere evaluación clínica';
        }

        return `Puntuación: ${score}/63\nInterpretación: ${interpretation}\nNivel clínico: ${clinical}\n\nEsta puntuación sugiere ${interpretation.toLowerCase()} y ${clinical.toLowerCase()}.`;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Configuración
    configure(endpoint, mode) {
        this.ai.setEndpoint(endpoint);
        this.ai.setMode(mode);
        this.mode = mode;
    }

    testConnection() {
        return this.ai.testConnection();
    }
}

// Instancia global
window.psykatAI = new PSYKATAI();