// Estado global de la aplicación
const AppState = {
    currentView: 'lockScreen',
    user: {
        level: 1,
        xp: 0,
        maxXp: 100,
        isPremium: false,
        casesCompleted: 0,
        totalQuestions: 0,
        correctDiagnoses: 0
    },
    cases: [],
    currentCase: null,
    currentChat: null,
    questionsCount: 0,
    maxQuestions: 5,
    aiMode: 'local' // 'local' o 'n8n'
};

// Datos de pacientes simulados
const mockPatients = [
    {
        id: 'patient_1',
        name: 'María García',
        age: 28,
        occupation: 'Profesora',
        avatar: 'MG',
        symptoms: ['ansiedad', 'insomnio', 'irritabilidad', 'preocupación_excesiva'],
        disorder: 'trastorno_ansiedad_generalizada',
        personality: 'colaborativo',
        backstory: 'Problemas en el trabajo con su jefe Luis, recuerdos de infancia con padre estricto Roberto',
        rapport: 70,
        sessions: 0,
        sessionId: null
    },
    {
        id: 'patient_2',
        name: 'Carlos Rodríguez',
        age: 35,
        occupation: 'Ingeniero',
        avatar: 'CR',
        symptoms: ['tristeza', 'fatiga', 'pérdida_interés', 'insomnio', 'culpa'],
        disorder: 'depresion_mayor',
        personality: 'reservado',
        backstory: 'Divorcio reciente, problemas económicos, hija Lucía de 7 años',
        rapport: 65,
        sessions: 0,
        sessionId: null
    },
    {
        id: 'patient_3',
        name: 'Ana Martínez',
        age: 22,
        occupation: 'Estudiante',
        avatar: 'AM',
        symptoms: ['ataques_pánico', 'evitación', 'sudoración', 'palpitaciones'],
        disorder: 'trastorno_pánico',
        personality: 'ansioso',
        backstory: 'Trauma en adolescencia, miedo a espacios cerrados, problemas académicos',
        rapport: 60,
        sessions: 0,
        sessionId: null
    },
    {
        id: 'patient_4',
        name: 'Diego Fernández',
        age: 41,
        occupation: 'Médico',
        avatar: 'DF',
        symptoms: ['flashbacks', 'pesadillas', 'hipervigilancia', 'insomnio'],
        disorder: 'tept',
        personality: 'perfeccionista',
        backstory: 'Experiencia traumática en el hospital durante la pandemia',
        rapport: 55,
        sessions: 0,
        sessionId: null
    },
    {
        id: 'patient_5',
        name: 'Sofia López',
        age: 19,
        occupation: 'Estudiante',
        avatar: 'SL',
        symptoms: ['miedo_social', 'evitación', 'ruborización', 'temblores'],
        disorder: 'fobia_social',
        personality: 'tímido',
        backstory: 'Bullying en la escuela, dificultades para hacer amigos',
        rapport: 45,
        sessions: 0,
        sessionId: null
    }
];

// DSM-5-TR Síntomas y trastornos
const dsmData = {
    categories: {
        afectivos: ['tristeza', 'ansiedad', 'irritabilidad', 'pérdida_interés', 'culpa', 'vacío_emocional'],
        cognitivos: ['concentración', 'memoria', 'decisiones', 'pensamientos_negativos', 'rumiación'],
        somaticos: ['insomnio', 'fatiga', 'cambios_apetito', 'dolores', 'sudoración', 'palpitaciones'],
        conductuales: ['evitación', 'aislamiento', 'agitación', 'lentitud_motora', 'flashbacks'],
        psicoticos: ['alucinaciones', 'delirios', 'desorganización', 'catatonia'],
        sociales: ['miedo_social', 'ruborización', 'temblores', 'miedo_humillación']
    },
    disorders: {
        'depresion_mayor': {
            name: 'Trastorno Depresivo Mayor (F32.x)',
            symptoms: ['tristeza', 'pérdida_interés', 'fatiga', 'insomnio', 'culpa', 'vacío_emocional'],
            criteria: 5,
            duration: '2 semanas',
            description: 'Episodio depresivo caracterizado por tristeza, anhedonia y síntomas somáticos/cognitivos'
        },
        'trastorno_ansiedad_generalizada': {
            name: 'Trastorno de Ansiedad Generalizada (F41.1)',
            symptoms: ['ansiedad', 'preocupación_excesiva', 'irritabilidad', 'concentración', 'fatiga'],
            criteria: 3,
            duration: '6 meses',
            description: 'Ansiedad y preocupación excesivas durante al menos 6 meses'
        },
        'trastorno_pánico': {
            name: 'Trastorno de Pánico (F41.0)',
            symptoms: ['ataques_pánico', 'evitación', 'sudoración', 'palpitaciones', 'miedo_morir'],
            criteria: 4,
            duration: '1 mes',
            description: 'Ataques de pánico recurrentes con preocupación por ataques futuros'
        },
        'tept': {
            name: 'Trastorno de Estrés Postraumático (F43.1)',
            symptoms: ['flashbacks', 'pesadillas', 'hipervigilancia', 'evitación', 'insomnio'],
            criteria: 6,
            duration: '1 mes',
            description: 'Síntomas tras exposición a evento traumático con intrusión, evitación y hipervigilancia'
        },
        'fobia_social': {
            name: 'Fobia Social (F40.1)',
            symptoms: ['miedo_social', 'evitación', 'ruborización', 'temblores', 'miedo_humillación'],
            criteria: 4,
            duration: '6 meses',
            description: 'Miedo marcado a situaciones sociales con temor a ser juzgado negativamente'
        }
    }
};

// Baterías de tests
const testBatteries = [
    { 
        id: 'bdi', 
        name: 'BDI-II (Inventario Depresión)', 
        type: 'depresion',
        description: 'Evalúa la severidad de síntomas depresivos en adultos y adolescentes',
        duration: '5-10 minutos'
    },
    { 
        id: 'bai', 
        name: 'BAI (Inventario Ansiedad)', 
        type: 'ansiedad',
        description: 'Mide la severidad de síntomas de ansiedad en adultos y adolescentes',
        duration: '5-10 minutos'
    },
    { 
        id: 'pcl', 
        name: 'PCL-5 (TEPT)', 
        type: 'trauma',
        description: 'Evalúa los 20 síntomas del TEPT según el DSM-5',
        duration: '5-8 minutos'
    },
    { 
        id: 'audit', 
        name: 'AUDIT (Consumo Alcohol)', 
        type: 'sustancias',
        description: 'Identifica consumo de alcohol de riesgo y dependencia',
        duration: '2-3 minutos'
    },
    { 
        id: 'mcmi', 
        name: 'MCMI-IV', 
        type: 'personalidad',
        description: 'Evaluación de trastornos de personalidad y síntomas clínicos',
        duration: '25-30 minutos'
    }
];

// Videos de PsykTok
const psykTokVideos = [
    {
        id: 'video_1',
        title: 'Cómo detectar signos de depresión',
        author: '@psicologa_maria',
        duration: '0:45',
        description: 'Aprende a identificar los síntomas principales de la depresión en tus pacientes',
        likes: 12500,
        category: 'educativo'
    },
    {
        id: 'video_2',
        title: 'Técnicas de entrevista clínica',
        author: '@dr_psicologia',
        duration: '1:20',
        description: '5 técnicas esenciales para una entrevista terapéutica efectiva',
        likes: 8900,
        category: 'técnicas'
    },
    {
        id: 'video_3',
        title: 'DSM-5-TR: Novedades importantes',
        author: '@psiquiatra_carlos',
        duration: '2:15',
        description: 'Las actualizaciones más importantes del DSM-5-TR explicadas',
        likes: 15600,
        category: 'actualización'
    },
    {
        id: 'video_4',
        title: 'Manejo de pacientes difíciles',
        author: '@terapeuta_experto',
        duration: '1:05',
        description: 'Estrategias para trabajar con pacientes resistentes al tratamiento',
        likes: 7200,
        category: 'técnicas'
    },
    {
        id: 'video_5',
        title: 'Autocuidado para psicólogos',
        author: '@psicologa_selfcare',
        duration: '0:55',
        description: 'La importancia del autocuidado en la práctica clínica',
        likes: 9800,
        category: 'bienestar'
    }
];

// Funciones de utilidad
function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function saveState() {
    localStorage.setItem('psykat_state', JSON.stringify(AppState));
}

function loadState() {
    const saved = localStorage.getItem('psykat_state');
    if (saved) {
        const state = JSON.parse(saved);
        Object.assign(AppState, state);
    }
}

// Sistema de bloqueo y escritorio
class LockScreen {
    static init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.setupEvents();
    }

    static updateTime() {
        const now = new Date();
        document.getElementById('lockTime').textContent = formatTime(now);
        document.getElementById('lockDate').textContent = formatDate(now);
        document.getElementById('currentTime').textContent = formatTime(now);
    }

    static setupEvents() {
        let tapCount = 0;
        const lockScreen = document.getElementById('lockScreen');
        
        lockScreen.addEventListener('click', () => {
            tapCount++;
            if (tapCount === 2) {
                this.unlock();
                tapCount = 0;
            }
            setTimeout(() => tapCount = 0, 500);
        });
    }

    static unlock() {
        anime({
            targets: '#lockScreen',
            opacity: 0,
            duration: 500,
            easing: 'easeOutQuad',
            complete: () => {
                document.getElementById('lockScreen').classList.add('hidden');
                document.getElementById('desktop').classList.remove('hidden');
                this.showDesktop();
            }
        });
    }

    static showDesktop() {
        anime({
            targets: '.app-icon',
            scale: [0, 1],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 600,
            easing: 'easeOutElastic(1, .8)'
        });
    }
}

// Sistema de navegación
class Navigation {
    static init() {
        this.setupAppIcons();
        this.setupBackButtons();
    }

    static setupAppIcons() {
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const app = e.currentTarget.dataset.app;
                if (app) {
                    this.openApp(app);
                }
            });
        });
    }

    static setupBackButtons() {
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.app;
                this.navigateTo(target);
            });
        });
    }

    static openApp(appName) {
        // Ocultar todas las vistas
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.add('hidden');
        });

        // Mostrar la vista correspondiente
        const targetView = document.getElementById(appName + 'View');
        if (targetView) {
            targetView.classList.remove('hidden');
            AppState.currentView = appName;
            
            // Inicializar la app específica
            this.initializeApp(appName);
            
            // Animación de entrada
            anime({
                targets: targetView,
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
    }

    static navigateTo(viewName) {
        if (viewName === 'desktop') {
            document.querySelectorAll('.app-view').forEach(view => {
                view.classList.add('hidden');
            });
            document.getElementById('desktop').classList.remove('hidden');
            AppState.currentView = 'desktop';
        } else {
            this.openApp(viewName);
        }
    }

    static initializeApp(appName) {
        switch(appName) {
            case 'messaging':
                MessagingApp.init();
                break;
            case 'mail':
                MailApp.init();
                break;
            case 'contacts':
                ContactsApp.init();
                break;
            case 'diagnosis':
                DiagnosisTool.init();
                break;
            case 'tubetok':
                PsykTokApp.init();
                break;
            case 'diary':
                DiaryApp.init();
                break;
        }
    }
}

// App de Mensajería
class MessagingApp {
    static init() {
        this.renderChatList();
    }

    static renderChatList() {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        // Obtener casos activos
        const activeCases = AppState.cases.filter(c => c.status === 'active');

        if (activeCases.length === 0) {
            chatList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No hay conversaciones activas</p>
                    <p style="font-size: 0.9rem;">Visita Contactos para añadir nuevos casos</p>
                </div>
            `;
            return;
        }

        activeCases.forEach(case_ => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.innerHTML = `
                <div class="chat-avatar">${case_.patient.avatar}</div>
                <div class="chat-details">
                    <div class="chat-name">${case_.patient.name}</div>
                    <div class="chat-preview">${case_.lastMessage || 'Inicia la conversación...'}</div>
                </div>
                <div class="chat-meta">
                    <div>${case_.lastMessageTime || 'Ahora'}</div>
                    ${case_.unreadCount ? `<div class="notification-badge">${case_.unreadCount}</div>` : ''}
                </div>
            `;

            chatItem.addEventListener('click', () => {
                this.openChat(case_);
            });

            chatList.appendChild(chatItem);
        });
    }

    static openChat(case_) {
        AppState.currentChat = case_;
        Navigation.openApp('chat');
        this.setupChatView();
    }

    static setupChatView() {
        const case_ = AppState.currentChat;
        
        // Configurar encabezado
        document.getElementById('chatName').textContent = case_.patient.name;
        
        // Configurar IA
        window.psykatAI.setCurrentCase(case_);
        
        // Renderizar mensajes
        this.renderMessages();
        
        // Configurar contador
        AppState.questionsCount = case_.messages.filter(m => m.sender === 'user').length;
        this.updateQuestionCounter();
        
        // Configurar eventos
        this.setupChatEvents();
    }

    static renderMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        const case_ = AppState.currentChat;
        
        // Si no hay mensajes, iniciar con saludo
        if (case_.messages.length === 0) {
            const greeting = this.generatePatientGreeting(case_.patient);
            const message = {
                id: generateId(),
                text: greeting,
                sender: 'patient',
                timestamp: new Date(),
                type: 'text'
            };
            case_.messages.push(message);
        }

        case_.messages.forEach(msg => {
            const messageEl = this.createMessageElement(msg);
            chatMessages.appendChild(messageEl);
        });

        // Scroll al final
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    static generatePatientGreeting(patient) {
        const greetings = [
            `Hola doctor/a, soy ${patient.name}. Gracias por verme.`,
            `Buenos días, necesito hablar con alguien sobre lo que me está pasando.`,
            `Hola, no sé por dónde empezar... estoy teniendo problemas.`,
            `Gracias por la cita, doctor/a. He estado luchando con algunas cosas.`
        ];
        
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    static createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === 'user' ? 'sent' : 'received'}`;
        
        const time = formatTime(new Date(message.timestamp));
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${time}</div>
                ${message.score ? `<div class="message-score" style="color: ${this.getScoreColor(message.score)}">Calidad: ${message.score}/100</div>` : ''}
            </div>
        `;

        return messageDiv;
    }

    static getScoreColor(score) {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FF9800';
        if (score >= 40) return '#FFC107';
        return '#f44336';
    }

    static setupChatEvents() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const menuButton = document.getElementById('menuButton');

        const sendMessage = async () => {
            const text = messageInput.value.trim();
            if (text && AppState.questionsCount < AppState.maxQuestions) {
                await this.sendUserMessage(text);
                messageInput.value = '';
            }
        };

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        menuButton.addEventListener('click', () => {
            this.showSessionMenu();
        });
    }

    static async sendUserMessage(text) {
        const case_ = AppState.currentChat;
        
        // Añadir mensaje del usuario
        const userMessage = {
            id: generateId(),
            text: text,
            sender: 'user',
            timestamp: new Date(),
            type: 'text'
        };
        
        case_.messages.push(userMessage);
        AppState.questionsCount++;
        AppState.user.totalQuestions++;
        
        // Renderizar mensaje del usuario
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(this.createMessageElement(userMessage));
        
        // Generar respuesta del paciente usando IA
        try {
            const aiResponse = await window.psykatAI.sendTherapistMessage(text);
            
            // Actualizar caso con respuesta
            case_.messages = aiResponse.patientMessage ? 
                [...case_.messages, aiResponse.patientMessage] : 
                case_.messages;
            
            case_.lastMessage = aiResponse.patientMessage?.text || text;
            case_.lastMessageTime = formatTime(new Date());
            
            // Renderizar mensaje del paciente
            if (aiResponse.patientMessage) {
                chatMessages.appendChild(this.createMessageElement(aiResponse.patientMessage));
            }
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
        } catch (error) {
            console.error('Error generando respuesta:', error);
            
            // Respuesta de fallback
            const fallbackResponse = this.generateFallbackResponse(text, case_.patient);
            const patientMessage = {
                id: generateId(),
                text: fallbackResponse,
                sender: 'patient',
                timestamp: new Date(),
                type: 'text'
            };
            
            case_.messages.push(patientMessage);
            chatMessages.appendChild(this.createMessageElement(patientMessage));
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        this.updateQuestionCounter();
        saveState();
    }

    static generateFallbackResponse(message, patient) {
        // Si la IA falla, usar respuestas contextuales básicas
        const msg = message.toLowerCase();
        
        if (msg.includes('cómo') || msg.includes('qué')) {
            return 'Es complicado... necesito pensarlo más.';
        } else if (msg.includes('por qué')) {
            return 'No estoy seguro/a de las razones.';
        } else if (msg.includes('cuándo')) {
            return 'Hace tiempo que vengo sintiendo esto.';
        } else {
            return 'Gracias por preguntar. Me ayuda hablar de esto.';
        }
    }

    static updateQuestionCounter() {
        const counter = document.getElementById('questionCounter');
        const remaining = AppState.maxQuestions - AppState.questionsCount;
        counter.textContent = remaining;
        
        if (remaining <= 1) {
            counter.style.color = '#FF3B30';
            counter.parentElement.style.background = 'rgba(255, 59, 48, 0.1)';
        } else {
            counter.style.color = '#666';
            counter.parentElement.style.background = 'rgba(0, 0, 0, 0.05)';
        }
    }

    static showSessionMenu() {
        const menu = document.getElementById('sessionMenu');
        menu.classList.remove('hidden');
        
        // Configurar eventos del menú
        document.getElementById('newSession').onclick = () => this.startNewSession();
        document.getElementById('diagnosisTool').onclick = () => this.openDiagnosisTool();
        document.getElementById('saveExit').onclick = () => this.saveAndExit();
        document.getElementById('cancelCase').onclick = () => this.cancelCase();
        
        // Cerrar menú al hacer clic en el overlay
        document.querySelector('.menu-overlay').onclick = () => {
            menu.classList.add('hidden');
        };
    }

    static startNewSession() {
        const case_ = AppState.currentChat;
        case_.sessions++;
        AppState.questionsCount = 0;
        
        // Añadir mensaje de inicio de nueva sesión
        const sessionMessage = {
            id: generateId(),
            text: "Hola de nuevo, ¿cómo ha ido la semana?",
            sender: 'user',
            timestamp: new Date(),
            type: 'text'
        };
        
        case_.messages.push(sessionMessage);
        
        // Generar respuesta contextual
        const responses = [
            "Regular, he estado pensando en lo que hablamos la última vez...",
            "Bien, aunque todavía tengo algunas dudas sobre lo que me dijiste",
            "La semana ha sido difícil, pero quiero seguir trabajando en esto",
            "Mejor, gracias. He estado reflexionando sobre nuestra conversación"
        ];
        
        const patientResponse = {
            id: generateId(),
            text: responses[Math.floor(Math.random() * responses.length)],
            sender: 'patient',
            timestamp: new Date(),
            type: 'text'
        };
        
        case_.messages.push(patientResponse);
        
        document.getElementById('sessionMenu').classList.add('hidden');
        this.renderMessages();
        this.updateQuestionCounter();
        saveState();
    }

    static openDiagnosisTool() {
        document.getElementById('sessionMenu').classList.add('hidden');
        Navigation.openApp('diagnosis');
        
        // Configurar herramienta con el caso actual
        setTimeout(() => {
            DiagnosisTool.setCurrentCase(AppState.currentChat);
        }, 100);
    }

    static saveAndExit() {
        document.getElementById('sessionMenu').classList.add('hidden');
        Navigation.navigateTo('desktop');
        this.renderChatList(); // Actualizar lista
    }

    static cancelCase() {
        if (confirm('¿Estás seguro de que quieres anular este caso? Se perderá todo el progreso.')) {
            const index = AppState.cases.findIndex(c => c.id === AppState.currentChat.id);
            if (index > -1) {
                AppState.cases.splice(index, 1);
            }
            document.getElementById('sessionMenu').classList.add('hidden');
            Navigation.navigateTo('desktop');
            this.renderChatList();
            saveState();
        }
    }
}

// App de Correo
class MailApp {
    static init() {
        this.renderMailList();
    }

    static renderMailList() {
        const mailList = document.getElementById('mailList');
        
        // Verificar si hay nuevos casos disponibles
        const availablePatients = mockPatients.filter(patient => 
            !AppState.cases.some(c => c.patient.id === patient.id)
        );

        if (availablePatients.length === 0) {
            mailList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-envelope" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No hay nuevos casos disponibles</p>
                    <p style="font-size: 0.9rem;">Revisa más tarde para nuevos pacientes</p>
                </div>
            `;
            return;
        }

        // Crear email con nuevos casos
        const email = document.createElement('div');
        email.className = 'mail-item';
        email.innerHTML = `
            <div class="mail-sender">secretario@psykat.com</div>
            <div class="mail-subject">Nuevos casos para evaluación - ${formatDate(new Date())}</div>
            <div class="mail-preview">
                Buenos días,<br><br>
                Tenemos ${availablePatients.length} nuevo(s) paciente(s) pendientes de evaluación:<br>
                ${availablePatients.map(p => `• ${p.name}, ${p.age} años (${p.occupation})`).join('<br>')}
                <br><br>
                Por favor, revisa los casos y añádelos a tu lista de contactos para comenzar la evaluación.
                <br><br>
                Saludos,<br>
                Secretaría PSYKAT
            </div>
        `;

        email.addEventListener('click', () => {
            this.processNewCases(availablePatients);
        });

        mailList.innerHTML = '';
        mailList.appendChild(email);

        // Actualizar badge de correo
        document.getElementById('mailBadge').textContent = '1';
    }

    static processNewCases(patients) {
        patients.forEach(patient => {
            // Añadir a contactos temporalmente
            if (!AppState.cases.some(c => c.patient.id === patient.id)) {
                const newCase = {
                    id: generateId(),
                    patient: {...patient}, // Copiar objeto
                    messages: [],
                    status: 'new',
                    lastMessage: '',
                    lastMessageTime: '',
                    unreadCount: 0,
                    sessions: 0,
                    backstoryRevealed: false,
                    selectedSymptoms: [],
                    diagnosis: null,
                    batteryApplied: null,
                    batteryResults: null,
                    sessionId: null
                };
                AppState.cases.push(newCase);
            }
        });
        
        // Limpiar badge de correo
        document.getElementById('mailBadge').textContent = '0';
        
        // Actualizar badge de contactos
        const newCases = AppState.cases.filter(c => c.status === 'new').length;
        document.getElementById('contactsBadge').textContent = newCases;
        
        // Mostrar notificación
        this.showNotification(`${patients.length} nuevo(s) caso(s) añadido(s) a contactos`);
        
        saveState();
        
        // Navegar a contactos
        setTimeout(() => {
            Navigation.openApp('contacts');
        }, 1000);
    }

    static showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1000;
            font-size: 0.9rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        anime({
            targets: notification,
            translateY: [-20, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad',
            complete: () => {
                setTimeout(() => {
                    anime({
                        targets: notification,
                        opacity: 0,
                        translateY: -20,
                        duration: 300,
                        complete: () => notification.remove()
                    });
                }, 3000);
            }
        });
    }
}

// App de Contactos
class ContactsApp {
    static init() {
        this.renderContactsList();
    }

    static renderContactsList() {
        const contactsList = document.getElementById('contactsList');
        contactsList.innerHTML = '';

        const availableCases = AppState.cases.filter(c => c.status === 'new');

        if (availableCases.length === 0) {
            contactsList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-address-book" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No hay nuevos contactos disponibles</p>
                    <p style="font-size: 0.9rem;">Revisa tu correo para nuevos casos</p>
                </div>
            `;
            return;
        }

        availableCases.forEach(case_ => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <div class="contact-avatar">
                    ${case_.patient.avatar}
                    <div class="contact-new">N</div>
                </div>
                <div class="contact-info">
                    <div class="contact-name">${case_.patient.name}</div>
                    <div class="contact-details">${case_.patient.age} años • ${case_.patient.occupation}</div>
                    <div class="contact-symptoms">Síntomas: ${case_.patient.symptoms.slice(0, 3).join(', ')}...</div>
                </div>
            `;

            contactItem.addEventListener('click', () => {
                this.addContact(case_);
            });

            contactsList.appendChild(contactItem);
        });

        // Actualizar badge
        document.getElementById('contactsBadge').textContent = availableCases.length;
    }

    static addContact(case_) {
        case_.status = 'active';
        
        // Mostrar notificación
        MailApp.showNotification(`${case_.patient.name} añadido a Mensajería`);
        
        // Actualizar badges
        const remaining = AppState.cases.filter(c => c.status === 'new').length;
        document.getElementById('contactsBadge').textContent = remaining;
        
        // Actualizar badge de mensajería
        const activeCases = AppState.cases.filter(c => c.status === 'active').length;
        document.getElementById('messagingBadge').textContent = activeCases;
        
        saveState();
        
        // Navegar a mensajería
        setTimeout(() => {
            Navigation.openApp('messaging');
        }, 1000);
    }
}

// Herramienta de Diagnóstico mejorada
class DiagnosisTool {
    static init() {
        this.currentCase = null;
        this.setupTabs();
        this.renderSymptoms();
        this.renderBatteries();
        this.setupDiagnosisForm();
    }

    static setCurrentCase(case_) {
        this.currentCase = case_;
        document.getElementById('caseName').textContent = `Caso: ${case_.patient.name}`;
        
        // Restaurar síntomas seleccionados
        if (case_.selectedSymptoms) {
            case_.selectedSymptoms.forEach(symptom => {
                const checkbox = document.getElementById(`symptom_${symptom}`);
                if (checkbox) checkbox.checked = true;
            });
            this.updateHypothesis();
        }
    }

    static setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    static switchTab(tabName) {
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');

        // Renderizar contenido específico
        switch(tabName) {
            case 'symptoms':
                this.renderSymptoms();
                break;
            case 'hypothesis':
                this.renderHypothesis();
                break;
            case 'batteries':
                this.renderBatteries();
                break;
            case 'diagnose':
                this.renderDiagnosisOptions();
                break;
        }
    }

    static renderSymptoms() {
        const symptomsGrid = document.querySelector('.symptoms-grid');
        symptomsGrid.innerHTML = '';

        Object.entries(dsmData.categories).forEach(([category, symptoms]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'symptom-category';
            categoryDiv.innerHTML = `
                <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            `;

            symptoms.forEach(symptom => {
                const symptomDiv = document.createElement('div');
                symptomDiv.className = 'symptom-item';
                
                const isSelected = this.currentCase?.selectedSymptoms?.includes(symptom);
                
                symptomDiv.innerHTML = `
                    <button class="symptom-btn ${isSelected ? 'selected' : ''}" data-symptom="${symptom}">
                        <span class="symptom-icon">
                            <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                        </span>
                        <span class="symptom-text">${symptom.replace('_', ' ')}</span>
                    </button>
                `;

                const button = symptomDiv.querySelector('.symptom-btn');
                button.addEventListener('click', () => {
                    this.toggleSymptom(symptom, button);
                });

                categoryDiv.appendChild(symptomDiv);
            });

            symptomsGrid.appendChild(categoryDiv);
        });
    }

    static toggleSymptom(symptom, button) {
        if (!this.currentCase) return;

        if (!this.currentCase.selectedSymptoms) {
            this.currentCase.selectedSymptoms = [];
        }

        const index = this.currentCase.selectedSymptoms.indexOf(symptom);
        const icon = button.querySelector('i');
        
        if (index === -1) {
            // Añadir síntoma
            this.currentCase.selectedSymptoms.push(symptom);
            button.classList.add('selected');
            icon.className = 'fas fa-check-circle';
        } else {
            // Remover síntoma
            this.currentCase.selectedSymptoms.splice(index, 1);
            button.classList.remove('selected');
            icon.className = 'fas fa-circle';
        }

        this.updateHypothesis();
        saveState();
    }

    static updateHypothesis() {
        const hypothesisList = document.querySelector('.hypothesis-list');
        hypothesisList.innerHTML = '';

        if (!this.currentCase || !this.currentCase.selectedSymptoms || this.currentCase.selectedSymptoms.length === 0) {
            hypothesisList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>Selecciona síntomas para ver hipótesis diagnósticas</p>
                </div>
            `;
            return;
        }

        // Calcular coincidencias con trastornos
        const matches = [];
        Object.entries(dsmData.disorders).forEach(([key, disorder]) => {
            const matchingSymptoms = disorder.symptoms.filter(s => 
                this.currentCase.selectedSymptoms.includes(s)
            );
            
            if (matchingSymptoms.length > 0) {
                const percentage = (matchingSymptoms.length / disorder.criteria) * 100;
                matches.push({
                    id: key,
                    name: disorder.name,
                    match: matchingSymptoms.length,
                    total: disorder.criteria,
                    percentage: percentage,
                    symptoms: matchingSymptoms,
                    description: disorder.description,
                    duration: disorder.duration
                });
            }
        });

        // Ordenar por porcentaje de coincidencia
        matches.sort((a, b) => b.percentage - a.percentage);

        matches.forEach((match, index) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'hypothesis-item';
            
            const isTopMatch = index === 0 && match.percentage >= 60;
            
            matchDiv.innerHTML = `
                <div class="hypothesis-header">
                    <h3>${match.name} ${isTopMatch ? '<span class="top-match">🔥 Principal</span>' : ''}</h3>
                    <div class="match-percentage">
                        <div class="percentage-bar">
                            <div class="percentage-fill" style="width: ${Math.min(match.percentage, 100)}%"></div>
                        </div>
                        <span class="percentage-text">${Math.round(match.percentage)}%</span>
                    </div>
                </div>
                <div class="hypothesis-details">
                    <p class="hypothesis-description">${match.description}</p>
                    <div class="hypothesis-criteria">
                        <span class="criteria-match">${match.match}/${match.total} criterios</span>
                        <span class="duration">Duración: ${match.duration}</span>
                    </div>
                    <div class="matching-symptoms">
                        <strong>Síntomas coincidentes:</strong> ${match.symptoms.join(', ')}
                    </div>
                </div>
            `;

            hypothesisList.appendChild(matchDiv);
        });

        if (matches.length === 0) {
            hypothesisList.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #666;">
                    <i class="fas fa-question-circle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No se encontraron trastornos que coincidan con los síntomas seleccionados</p>
                    <p style="font-size: 0.9rem;">Considera ampliar la selección o revisar otros síntomas</p>
                </div>
            `;
        }

        AppState.diagnosisHypothesis = matches;
    }

    static renderHypothesis() {
        this.updateHypothesis();
    }

    static renderBatteries() {
        const batteriesList = document.querySelector('.batteries-list');
        batteriesList.innerHTML = '';

        testBatteries.forEach(battery => {
            const batteryDiv = document.createElement('div');
            batteryDiv.className = 'battery-item';
            
            const isApplied = this.currentCase?.batteryApplied === battery.id;
            const hasResults = this.currentCase?.batteryResults && isApplied;
            
            batteryDiv.innerHTML = `
                <div class="battery-header">
                    <h3>${battery.name}</h3>
                    ${isApplied ? '<span class="applied-badge">✓ Aplicado</span>' : ''}
                </div>
                <div class="battery-details">
                    <p class="battery-description">${battery.description}</p>
                    <div class="battery-meta">
                        <span class="battery-type">Tipo: ${battery.type}</span>
                        <span class="battery-duration">Duración: ${battery.duration}</span>
                    </div>
                    ${hasResults ? `
                        <div class="battery-results">
                            <strong>Resultados:</strong>
                            <pre>${this.currentCase.batteryResults}</pre>
                        </div>
                    ` : ''}
                    <button class="battery-btn ${isApplied ? 'disabled' : ''}" 
                            onclick="DiagnosisTool.applyBattery('${battery.id}')"
                            ${isApplied ? 'disabled' : ''}>
                        ${isApplied ? 'Aplicado' : 'Aplicar batería'}
                    </button>
                </div>
            `;

            batteriesList.appendChild(batteryDiv);
        });
    }

    static async applyBattery(batteryId) {
        if (!this.currentCase) return;

        const battery = testBatteries.find(b => b.id === batteryId);
        if (!battery) return;

        // Mostrar confirmación
        if (!confirm(`¿Aplicar ${battery.name}? Esto consumirá una sesión.`)) {
            return;
        }

        try {
            const result = await window.psykatAI.applyTestBattery(batteryId);
            
            if (result) {
                this.currentCase.batteryApplied = batteryId;
                this.currentCase.batteryResults = result.results;
                
                // Actualizar vista
                this.renderBatteries();
                
                // Mostrar notificación
                MailApp.showNotification(`Batería ${battery.name} aplicada correctamente`);
                
                // Volver al chat para nueva sesión
                setTimeout(() => {
                    Navigation.navigateTo('messaging');
                    MessagingApp.openChat(this.currentCase);
                }, 2000);
            }
        } catch (error) {
            console.error('Error aplicando batería:', error);
            MailApp.showNotification('Error al aplicar la batería');
        }

        saveState();
    }

    static renderDiagnosisOptions() {
        const select = document.getElementById('dsmDiagnosis');
        select.innerHTML = '<option value="">Selecciona un diagnóstico DSM-5-TR</option>';
        
        Object.entries(dsmData.disorders).forEach(([key, disorder]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = disorder.name;
            select.appendChild(option);
        });

        // Mostrar resumen si hay hipótesis
        this.renderDiagnosisSummary();
    }

    static renderDiagnosisSummary() {
        const summaryDiv = document.getElementById('diagnosisSummary');
        
        if (AppState.diagnosisHypothesis && AppState.diagnosisHypothesis.length > 0) {
            const topMatch = AppState.diagnosisHypothesis[0];
            
            summaryDiv.innerHTML = `
                <div class="diagnosis-summary-content">
                    <h4>Hipótesis principal:</h4>
                    <p><strong>${topMatch.name}</strong></p>
                    <p>Coincidencia: ${Math.round(topMatch.percentage)}%</p>
                    <p>Síntomas: ${topMatch.symptoms.join(', ')}</p>
                </div>
            `;
        } else {
            summaryDiv.innerHTML = `
                <div class="diagnosis-summary-content">
                    <p>Selecciona síntomas en la pestaña "Síntomas" para ver hipótesis diagnósticas.</p>
                </div>
            `;
        }
    }

    static setupDiagnosisForm() {
        document.getElementById('confirmDiagnosis').addEventListener('click', () => {
            this.confirmDiagnosis();
        });

        document.getElementById('dsmDiagnosis').addEventListener('change', () => {
            this.renderDiagnosisSummary();
        });
    }

    static confirmDiagnosis() {
        const selectedDiagnosis = document.getElementById('dsmDiagnosis').value;
        if (!selectedDiagnosis) {
            alert('Por favor selecciona un diagnóstico');
            return;
        }

        const case_ = this.currentCase;
        const correct = selectedDiagnosis === case_.patient.disorder;
        
        // Calcular XP
        let xpGained = 50; // Base
        if (correct) xpGained += 100;
        if (case_.sessions >= 2) xpGained += 50; // Bonus por profundidad
        if (case_.batteryApplied) xpGained += 30; // Bonus por batería
        if (case_.selectedSymptoms && case_.selectedSymptoms.length >= 3) xpGained += 20; // Bonus por análisis

        // Actualizar estado del usuario
        AppState.user.xp += xpGained;
        AppState.user.casesCompleted++;
        if (correct) AppState.user.correctDiagnoses++;

        // Verificar nivel
        this.checkLevelUp();

        // Marcar caso como completado
        case_.status = 'completed';
        case_.diagnosis = selectedDiagnosis;
        case_.diagnosisCorrect = correct;
        case_.diagnosisDate = new Date();

        // Mostrar resultados
        this.showResults(correct, xpGained, selectedDiagnosis);

        saveState();
    }

    static checkLevelUp() {
        while (AppState.user.xp >= AppState.user.maxXp) {
            AppState.user.xp -= AppState.user.maxXp;
            AppState.user.level++;
            AppState.user.maxXp = Math.floor(AppState.user.maxXp * 1.2);
            
            MailApp.showNotification(`¡Subiste al nivel ${AppState.user.level}!`);
        }
    }

    static showResults(correct, xpGained, diagnosis) {
        Navigation.openApp('results');
        
        const case_ = this.currentCase;
        
        // Configurar resultados
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        
        if (correct) {
            resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            resultIcon.className = 'result-icon';
            resultTitle.textContent = '¡Diagnóstico Correcto!';
        } else {
            resultIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            resultIcon.className = 'result-icon incorrect';
            resultTitle.textContent = 'Diagnóstico Incorrecto';
        }
        
        document.getElementById('xpGained').textContent = xpGained;
        document.getElementById('currentLevel').textContent = AppState.user.level;
        
        // Configurar barra de progreso
        const progress = (AppState.user.xp / AppState.user.maxXp) * 100;
        document.getElementById('xpProgress').style.width = progress + '%';
        
        // Configurar retroalimentación
        this.setupResultsFeedback(correct, diagnosis, case_);
        
        // Configurar detalles del diagnóstico
        this.setupDiagnosisDetails(correct, diagnosis, case_);
        
        // Configurar acciones
        this.setupResultsActions();
    }

    static setupResultsFeedback(correct, diagnosis, case_) {
        const feedbackSection = document.getElementById('feedbackSection');
        feedbackSection.innerHTML = '';

        const disorder = dsmData.disorders[case_.patient.disorder];
        
        if (correct) {
            const feedbackItems = [
                'Análisis exhaustivo de síntomas',
                'Uso apropiado de la herramienta diagnóstica',
                'Aplicación correcta de criterios DSM-5-TR'
            ];

            if (case_.batteryApplied) {
                feedbackItems.push('Uso efectivo de baterías de tests');
            }

            if (case_.sessions >= 2) {
                feedbackItems.push('Exploración profunda del caso');
            }

            feedbackItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'feedback-item';
                div.innerHTML = `<i class="fas fa-star"></i><span>${item}</span>`;
                feedbackSection.appendChild(div);
            });
        } else {
            const feedbackItems = [
                `El diagnóstico correcto era: ${disorder.name}`,
                'Revisa los criterios DSM-5-TR para este trastorno',
                'Considera aplicar más baterías de tests en futuros casos'
            ];

            if (case_.selectedSymptoms && case_.selectedSymptoms.length < 3) {
                feedbackItems.push('Explora más síntomas antes de diagnosticar');
            }

            feedbackItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'feedback-item';
                div.style.color = '#f44336';
                div.innerHTML = `<i class="fas fa-lightbulb"></i><span>${item}</span>`;
                feedbackSection.appendChild(div);
            });
        }
    }

    static setupDiagnosisDetails(correct, diagnosis, case_) {
        const detailsDiv = document.getElementById('diagnosisDetails');
        
        const disorder = dsmData.disorders[diagnosis];
        const correctDisorder = dsmData.disorders[case_.patient.disorder];
        
        detailsDiv.innerHTML = `
            <div class="diagnosis-details-content">
                <h4>Detalles del caso:</h4>
                <p><strong>Paciente:</strong> ${case_.patient.name}, ${case_.patient.age} años</p>
                <p><strong>Sesiones realizadas:</strong> ${case_.sessions}</p>
                <p><strong>Preguntas realizadas:</strong> ${case_.messages.filter(m => m.sender === 'user').length}</p>
                ${case_.batteryApplied ? `<p><strong>Batería aplicada:</strong> ${testBatteries.find(b => b.id === case_.batteryApplied)?.name}</p>` : ''}
                
                <h4>Tu diagnóstico:</h4>
                <p><strong>${disorder?.name || diagnosis}</strong></p>
                <p>${disorder?.description || 'Descripción no disponible'}</p>
                
                ${!correct ? `
                    <h4>Diagnóstico correcto:</h4>
                    <p><strong>${correctDisorder.name}</strong></p>
                    <p>${correctDisorder.description}</p>
                ` : ''}
                
                <div class="accuracy-stats">
                    <p><strong>Precisión:</strong> ${AppState.user.correctDiagnoses}/${AppState.user.casesCompleted} casos (${Math.round((AppState.user.correctDiagnoses/AppState.user.casesCompleted)*100)}%)</p>
                </div>
            </div>
        `;
    }

    static setupResultsActions() {
        document.getElementById('viewCaseFile').onclick = () => {
            // Mostrar información detallada del caso
            alert('Función de ficha completa disponible en versión premium');
        };

        document.getElementById('shareResult').onclick = () => {
            // Compartir resultado
            if (navigator.share) {
                navigator.share({
                    title: 'PSYKAT - Resultado de Caso',
                    text: `He completado un caso en PSYKAT. ¡Mi nivel es ${AppState.user.level}!`,
                    url: window.location.href
                });
            } else {
                MailApp.showNotification('¡Resultado copiado para compartir!');
            }
        };

        document.getElementById('backToDesktop').onclick = () => {
            Navigation.navigateTo('desktop');
        };
    }
}

// App de PsykTok mejorada
class PsykTokApp {
    static init() {
        this.currentVideoIndex = 0;
        this.renderVideo();
        this.setupControls();
        this.showAds();
    }

    static renderVideo() {
        const container = document.getElementById('videoContainer');
        const video = psykTokVideos[this.currentVideoIndex];
        
        container.innerHTML = `
            <div class="video-item" style="background: linear-gradient(45deg, #667eea, #764ba2);">
                <div class="video-content">
                    <div class="video-placeholder">
                        <i class="fas fa-play-circle"></i>
                        <h3>${video.title}</h3>
                        <p>${video.description}</p>
                        <div class="video-stats">
                            <span><i class="fas fa-heart"></i> ${this.formatNumber(video.likes)}</span>
                            <span><i class="fas fa-clock"></i> ${video.duration}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Actualizar información lateral
        document.getElementById('videoTitle').textContent = video.title;
        document.getElementById('videoAuthor').textContent = video.author;
        document.getElementById('videoDescription').textContent = video.description;
    }

    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    static setupControls() {
        document.getElementById('likeBtn').addEventListener('click', () => {
            anime({
                targets: '#likeBtn',
                scale: [1, 1.3, 1],
                duration: 300,
                easing: 'easeOutElastic(1, .8)'
            });
            
            // Añadir XP por interactuar
            AppState.user.xp += 5;
            saveState();
            
            // Cambiar color del botón
            document.getElementById('likeBtn').style.color = '#ff0066';
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            MailApp.showNotification('Video guardado para más tarde');
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            MailApp.showNotification('Video añadido a guardados');
        });

        // Navegación entre videos (swipe up/down simulado)
        let startY = 0;
        const container = document.getElementById('videoContainer');
        
        container.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        container.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const diff = startY - endY;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    // Swipe up - siguiente video
                    this.nextVideo();
                } else {
                    // Swipe down - video anterior
                    this.prevVideo();
                }
            }
        });

        // También con scroll del mouse
        container.addEventListener('wheel', (e) => {
            if (e.deltaY > 50) {
                this.nextVideo();
            } else if (e.deltaY < -50) {
                this.prevVideo();
            }
        });
    }

    static nextVideo() {
        this.currentVideoIndex = (this.currentVideoIndex + 1) % psykTokVideos.length;
        this.renderVideo();
        
        // Animación de transición
        anime({
            targets: '#videoContainer .video-item',
            translateY: [100, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }

    static prevVideo() {
        this.currentVideoIndex = this.currentVideoIndex === 0 ? 
            psykTokVideos.length - 1 : this.currentVideoIndex - 1;
        this.renderVideo();
        
        // Animación de transición
        anime({
            targets: '#videoContainer .video-item',
            translateY: [-100, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }

    static showAds() {
        const adsBanner = document.getElementById('adsBanner');
        
        // Rotar anuncios cada 10 segundos
        const ads = [
            {
                title: 'PSYKAT Premium',
                description: 'Sin anuncios • Casos ilimitados • Contenido exclusivo',
                cta: 'Mejora ahora'
            },
            {
                title: 'Curso de Psicología Clínica',
                description: 'Aprende con expertos • Certificado oficial',
                cta: 'Inscríbete'
            },
            {
                title: 'Baterías de Tests Online',
                description: 'Aplicación profesional • Resultados inmediatos',
                cta: 'Prueba gratis'
            }
        ];

        let currentAd = 0;
        
        const showAd = () => {
            const ad = ads[currentAd];
            adsBanner.innerHTML = `
                <div class="ad-content">
                    <div class="ad-info">
                        <div class="ad-title">${ad.title}</div>
                        <div class="ad-description">${ad.description}</div>
                    </div>
                    <button class="ad-cta">${ad.cta}</button>
                </div>
            `;
            
            currentAd = (currentAd + 1) % ads.length;
        };

        showAd();
        setInterval(showAd, 10000);
    }
}

// App de Diario Clínico mejorada
class DiaryApp {
    static init() {
        this.setupTabs();
        this.renderDSMContent();
    }

    static setupTabs() {
        document.querySelectorAll('.diary-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchDiaryTab(tabName);
            });
        });
    }

    static switchDiaryTab(tabName) {
        // Actualizar botones
        document.querySelectorAll('.diary-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.diary-tabs [data-tab="${tabName}"]`).classList.add('active');

        // Renderizar contenido según la pestaña
        switch(tabName) {
            case 'dsm':
                this.renderDSMContent();
                break;
            case 'batteries':
                this.renderBatteriesContent();
                break;
            case 'practices':
                this.renderPracticesContent();
                break;
            case 'saved':
                this.renderSavedContent();
                break;
        }
    }

    static renderDSMContent() {
        const content = document.querySelector('.diary-content');
        content.innerHTML = '';

        // Crear secciones para cada categoría de trastornos
        const categories = [
            {
                title: 'Trastornos Depresivos',
                disorders: ['depresion_mayor'],
                color: '#4A90E2'
            },
            {
                title: 'Trastornos de Ansiedad',
                disorders: ['trastorno_ansiedad_generalizada', 'trastorno_pánico', 'fobia_social'],
                color: '#7B68EE'
            },
            {
                title: 'Trastornos Relacionados con Trauma',
                disorders: ['tept'],
                color: '#FF6B6B'
            }
        ];

        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'dsm-category';
            categoryDiv.innerHTML = `
                <h3 style="color: ${category.color}; border-left: 4px solid ${category.color}; padding-left: 10px;">
                    ${category.title}
                </h3>
                <div class="disorders-list">
                    ${category.disorders.map(disorderKey => {
                        const disorder = dsmData.disorders[disorderKey];
                        if (!disorder) return '';
                        
                        return `
                            <div class="disorder-item">
                                <h4>${disorder.name}</h4>
                                <p class="disorder-description">${disorder.description}</p>
                                <div class="disorder-criteria">
                                    <span class="criteria-count">${disorder.criteria} criterios mínimos</span>
                                    <span class="duration">Duración: ${disorder.duration}</span>
                                </div>
                                <div class="disorder-symptoms">
                                    <strong>Síntomas clave:</strong> ${disorder.symptoms.join(', ')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            content.appendChild(categoryDiv);
        });
    }

    static renderBatteriesContent() {
        const content = document.querySelector('.diary-content');
        content.innerHTML = '';

        testBatteries.forEach(battery => {
            const batteryDiv = document.createElement('div');
            batteryDiv.className = 'battery-info-item';
            batteryDiv.innerHTML = `
                <h3>${battery.name}</h3>
                <div class="battery-type-badge">${battery.type}</div>
                <p class="battery-description">${battery.description}</p>
                <div class="battery-specs">
                    <div class="spec-item">
                        <i class="fas fa-clock"></i>
                        <span>Duración: ${battery.duration}</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-users"></i>
                        <span>Población: Adultos y adolescentes</span>
                    </div>
                    <div class="spec-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Fiabilidad: Alta</span>
                    </div>
                </div>
                <div class="battery-applications">
                    <h4>Aplicaciones clínicas:</h4>
                    <ul>
                        <li>Evaluación inicial de pacientes</li>
                        <li>Seguimiento del tratamiento</li>
                        <li>Diagnóstico diferencial</li>
                        <li>Investigación clínica</li>
                    </ul>
                </div>
            `;
            content.appendChild(batteryDiv);
        });
    }

    static renderPracticesContent() {
        const content = document.querySelector('.diary-content');
        content.innerHTML = `
            <div class="practices-section">
                <div class="practice-category">
                    <h3><i class="fas fa-microphone"></i> Entrevista Inicial</h3>
                    <div class="practice-items">
                        <div class="practice-item">
                            <h4>Establecer rapport</h4>
                            <p>Crea un ambiente seguro y acogedor desde el primer momento</p>
                        </div>
                        <div class="practice-item">
                            <h4>Preguntas abiertas</h4>
                            <p>Comienza con preguntas que permitan al paciente contar su historia</p>
                        </div>
                        <div class="practice-item">
                            <h4>Evita juicios</h4>
                            <p>Mantén una actitud neutral y no interpretaciones tempranas</p>
                        </div>
                        <div class="practice-item">
                            <h4>Valida emociones</h4>
                            <p>Reconoce y valida las emociones del paciente</p>
                        </div>
                    </div>
                </div>
                
                <div class="practice-category">
                    <h3><i class="fas fa-search"></i> Exploración de Síntomas</h3>
                    <div class="practice-items">
                        <div class="practice-item">
                            <h4>Características</h4>
                            <p>Investiga duración, intensidad y frecuencia de los síntomas</p>
                        </div>
                        <div class="practice-item">
                            <h4>Factores desencadenantes</h4>
                            <p>Identifica eventos o situaciones que provocan los síntomas</p>
                        </div>
                        <div class="practice-item">
                            <h4>Impacto funcional</h4>
                            <p>Evalúa cómo afectan los síntomas la vida diaria del paciente</p>
                        </div>
                        <div class="practice-item">
                            <h4>Comorbilidades</h4>
                            <p>Considera la presencia de otros trastornos simultáneos</p>
                        </div>
                    </div>
                </div>
                
                <div class="practice-category">
                    <h3><i class="fas fa-brain"></i> Formulación Diagnóstica</h3>
                    <div class="practice-items">
                        <div class="practice-item">
                            <h4>Criterios DSM-5-TR</h4>
                            <p>Usa los criterios como guía sistemática para el diagnóstico</p>
                        </div>
                        <div class="practice-item">
                            <h4>Diagnóstico diferencial</h4>
                            <p>Considera alternativas diagnósticas antes de concluir</p>
                        </div>
                        <div class="practice-item">
                            <h4>Evaluación de riesgo</h4>
                            <p>Assess riesgo de autolesión o suicidio cuando corresponda</p>
                        </div>
                        <div class="practice-item">
                            <h4>Planificación tratamiento</h4>
                            <p>Considera opciones de tratamiento apropiadas para el diagnóstico</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static renderSavedContent() {
        const content = document.querySelector('.diary-content');
        content.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-bookmark" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <p>No hay contenido guardado aún</p>
                <p style="font-size: 0.9rem;">Los artículos y videos que guardes aparecerán aquí</p>
                <div class="saved-actions">
                    <button class="action-btn" onclick="Navigation.openApp('tubetok')">
                        <i class="fas fa-play"></i> Ver videos educativos
                    </button>
                </div>
            </div>
        `;
    }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    LockScreen.init();
    Navigation.init();
    
    // Añadir algunos casos iniciales si no existen
    if (AppState.cases.length === 0) {
        mockPatients.slice(0, 3).forEach(patient => {
            const newCase = {
                id: generateId(),
                patient: {...patient},
                messages: [],
                status: 'new',
                lastMessage: '',
                lastMessageTime: '',
                unreadCount: 0,
                sessions: 0,
                backstoryRevealed: false,
                selectedSymptoms: [],
                diagnosis: null,
                batteryApplied: null,
                batteryResults: null,
                sessionId: null
            };
            AppState.cases.push(newCase);
        });
        saveState();
    }
    
    console.log('PSYKAT iniciado correctamente');
    console.log('Modo de IA:', AppState.aiMode);
    console.log('Casos disponibles:', AppState.cases.length);
});