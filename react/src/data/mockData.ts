import { Patient, PsykTokVideo, TestBattery, DSMData } from '../types';

// Pacientes simulados
export const mockPatients: Patient[] = [
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
    sessionId: null,
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
    sessionId: null,
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
    sessionId: null,
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
    sessionId: null,
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
    sessionId: null,
  },
  {
    id: 'patient_6',
    name: 'Roberto Sánchez',
    age: 33,
    occupation: 'Abogado',
    avatar: 'RS',
    symptoms: ['perfeccionismo', 'dudas', 'lavado_manos', 'comprobación'],
    disorder: 'toc',
    personality: 'obsesivo',
    backstory: 'Ambiente familiar exigente, necesidad de control absoluto',
    rapport: 40,
    sessions: 0,
    sessionId: null,
  },
  {
    id: 'patient_7',
    name: 'Elena Vásquez',
    age: 26,
    occupation: 'Diseñadora',
    avatar: 'EV',
    symptoms: ['alta_autoestima', 'fantasías_poder', 'explotación', 'falta_empatía'],
    disorder: 'trastorno_narcisista',
    personality: 'narcisista',
    backstory: 'Sobreccompensación por inseguridades infantiles',
    rapport: 30,
    sessions: 0,
    sessionId: null,
  },
  {
    id: 'patient_8',
    name: 'Miguel Herrera',
    age: 29,
    occupation: 'Artista',
    avatar: 'MH',
    symptoms: ['cambios_estado_animo', 'impulsividad', 'inseguridad', 'ira'],
    disorder: 'trastorno_limite',
    personality: 'emocional',
    backstory: 'Abandono en la infancia, relaciones tóxicas en adolescencia',
    rapport: 35,
    sessions: 0,
    sessionId: null,
  },
];

// Videos de PsykTok
export const psykTokVideos: PsykTokVideo[] = [
  {
    id: 'video_1',
    title: 'Cómo detectar signos de depresión',
    author: '@psicologa_maria',
    duration: '0:45',
    description: 'Aprende a identificar los síntomas principales de la depresión en tus pacientes',
    likes: 12500,
    category: 'educativo',
  },
  {
    id: 'video_2',
    title: 'Técnicas de entrevista clínica',
    author: '@dr_psicologia',
    duration: '1:20',
    description: '5 técnicas esenciales para una entrevista terapéutica efectiva',
    likes: 8900,
    category: 'técnicas',
  },
  {
    id: 'video_3',
    title: 'DSM-5-TR: Novedades importantes',
    author: '@psiquiatra_carlos',
    duration: '2:15',
    description: 'Las actualizaciones más importantes del DSM-5-TR explicadas',
    likes: 15600,
    category: 'actualización',
  },
  {
    id: 'video_4',
    title: 'Manejo de pacientes difíciles',
    author: '@terapeuta_experto',
    duration: '1:05',
    description: 'Estrategias para trabajar con pacientes resistentes al tratamiento',
    likes: 7200,
    category: 'técnicas',
  },
  {
    id: 'video_5',
    title: 'Autocuidado para psicólogos',
    author: '@psicologa_selfcare',
    duration: '0:55',
    description: 'La importancia del autocuidado en la práctica clínica',
    likes: 9800,
    category: 'bienestar',
  },
  {
    id: 'video_6',
    title: 'Ansiedad: Mitos y realidades',
    author: '@dr_ansiedad',
    duration: '1:30',
    description: 'Desmintiendo los mitos más comunes sobre los trastornos de ansiedad',
    likes: 11200,
    category: 'educativo',
  },
  {
    id: 'video_7',
    title: 'Cómo aplicar baterías de tests',
    author: '@psicometria_expert',
    duration: '2:00',
    description: 'Guía práctica para la aplicación y interpretación de tests psicológicos',
    likes: 6700,
    category: 'técnicas',
  },
  {
    id: 'video_8',
    title: 'Trauma y TEPT: Lo que necesitas saber',
    author: '@trauma_specialist',
    duration: '1:45',
    description: 'Comprensión del trastorno de estrés postraumático y su tratamiento',
    likes: 14300,
    category: 'educativo',
  },
];

// Baterías de tests
export const testBatteries: TestBattery[] = [
  {
    id: 'bdi',
    name: 'BDI-II (Inventario Depresión)',
    type: 'depresion',
    description: 'Evalúa la severidad de síntomas depresivos en adultos y adolescentes',
    duration: '5-10 minutos',
  },
  {
    id: 'bai',
    name: 'BAI (Inventario Ansiedad)',
    type: 'ansiedad',
    description: 'Mide la severidad de síntomas de ansiedad en adultos y adolescentes',
    duration: '5-10 minutos',
  },
  {
    id: 'pcl',
    name: 'PCL-5 (TEPT)',
    type: 'trauma',
    description: 'Evalúa los 20 síntomas del TEPT según el DSM-5',
    duration: '5-8 minutos',
  },
  {
    id: 'audit',
    name: 'AUDIT (Consumo Alcohol)',
    type: 'sustancias',
    description: 'Identifica consumo de alcohol de riesgo y dependencia',
    duration: '2-3 minutos',
  },
  {
    id: 'mcmi',
    name: 'MCMI-IV',
    type: 'personalidad',
    description: 'Evaluación de trastornos de personalidad y síntomas clínicos',
    duration: '25-30 minutos',
  },
  {
    id: 'y-bocs',
    name: 'Y-BOCS (TOC)',
    type: 'obsesivo',
    description: 'Escala de severidad para trastorno obsesivo-compulsivo',
    duration: '10-15 minutos',
  },
];

// Datos DSM-5-TR
export const dsmData: DSMData = {
  categories: {
    afectivos: ['tristeza', 'ansiedad', 'irritabilidad', 'pérdida_interés', 'culpa', 'vacío_emocional'],
    cognitivos: ['concentración', 'memoria', 'decisiones', 'pensamientos_negativos', 'rumiación'],
    somaticos: ['insomnio', 'fatiga', 'cambios_apetito', 'dolores', 'sudoración', 'palpitaciones'],
    conductuales: ['evitación', 'aislamiento', 'agitación', 'lentitud_motora', 'flashbacks'],
    psicoticos: ['alucinaciones', 'delirios', 'desorganización', 'catatonia'],
    sociales: ['miedo_social', 'ruborización', 'temblores', 'miedo_humillación'],
    obsesivos: ['perfeccionismo', 'dudas', 'lavado_manos', 'comprobación'],
  },
  disorders: {
    'depresion_mayor': {
      name: 'Trastorno Depresivo Mayor (F32.x)',
      symptoms: ['tristeza', 'pérdida_interés', 'fatiga', 'insomnio', 'culpa', 'vacío_emocional'],
      criteria: 5,
      duration: '2 semanas',
      description: 'Episodio depresivo caracterizado por tristeza, anhedonia y síntomas somáticos/cognitivos',
    },
    'trastorno_ansiedad_generalizada': {
      name: 'Trastorno de Ansiedad Generalizada (F41.1)',
      symptoms: ['ansiedad', 'preocupación_excesiva', 'irritabilidad', 'concentración'],
      criteria: 3,
      duration: '6 meses',
      description: 'Ansiedad y preocupación excesivas durante al menos 6 meses',
    },
    'trastorno_pánico': {
      name: 'Trastorno de Pánico (F41.0)',
      symptoms: ['ataques_pánico', 'evitación', 'sudoración', 'palpitaciones'],
      criteria: 4,
      duration: '1 mes',
      description: 'Ataques de pánico recurrentes con preocupación por ataques futuros',
    },
    'tept': {
      name: 'Trastorno de Estrés Postraumático (F43.1)',
      symptoms: ['flashbacks', 'pesadillas', 'hipervigilancia', 'evitación'],
      criteria: 6,
      duration: '1 mes',
      description: 'Síntomas tras exposición a evento traumático con intrusión, evitación y hipervigilancia',
    },
    'fobia_social': {
      name: 'Fobia Social (F40.1)',
      symptoms: ['miedo_social', 'evitación', 'ruborización', 'temblores'],
      criteria: 4,
      duration: '6 meses',
      description: 'Miedo marcado a situaciones sociales con temor a ser juzgado negativamente',
    },
    'toc': {
      name: 'Trastorno Obsesivo-Compulsivo (F42.x)',
      symptoms: ['perfeccionismo', 'dudas', 'lavado_manos', 'comprobación'],
      criteria: 4,
      duration: '1 mes',
      description: 'Obsesiones y compulsiones que causan malestar significativo',
    },
    'trastorno_narcisista': {
      name: 'Trastorno Narcisista de la Personalidad (F60.8)',
      symptoms: ['alta_autoestima', 'fantasías_poder', 'explotación', 'falta_empatía'],
      criteria: 5,
      duration: 'Persistent',
      description: 'Patrón de grandiosidad, necesidad de admiración y falta de empatía',
    },
    'trastorno_limite': {
      name: 'Trastorno Límite de la Personalidad (F60.3)',
      symptoms: ['cambios_estado_animo', 'impulsividad', 'inseguridad', 'ira'],
      criteria: 5,
      duration: 'Persistent',
      description: 'Inestabilidad en relaciones, autoimagen, emociones e impulsos',
    },
  },
};

// Frases de saludo para pacientes
export const patientGreetings = [
  "Hola doctor/a, gracias por verme.",
  "Buenos días, necesito hablar con alguien sobre lo que me está pasando.",
  "Hola, no sé por dónde empezar... estoy teniendo problemas.",
  "Gracias por la cita, doctor/a. He estado luchando con algunas cosas.",
  "Hola, espero que pueda ayudarme con lo que me está sucediendo.",
];

// Respuestas contextuales por trastorno
export const contextualResponses = {
  'depresion_mayor': {
    work: [
      "El trabajo se ha vuelto muy pesado últimamente...",
      "Mi jefe no entiende lo que estoy pasando",
      "Me cuesta concentrarme en mis tareas",
      "He perdido el interés en mi trabajo",
    ],
    family: [
      "Siento que no soy el padre/madre que debería ser",
      "Mi hija me preguntó por qué estaba triste",
      "La relación con mi familia se ha vuelto difícil",
      "Me aíslo de mi familia",
    ],
    general: [
      "No encuentro motivación para nada",
      "Me siento vacío/a por dentro",
      "He perdido interés en las cosas que antes me gustaban",
      "No veo futuro, todo parece gris",
      "Me despierto cansado/a incluso después de dormir",
      "Siento una tristeza constante",
    ],
  },
  'trastorno_ansiedad_generalizada': {
    work: [
      "Estoy constantemente preocupado por el trabajo",
      "Me preocupa que no esté haciendo bien mi trabajo",
      "Mi jefe me presiona mucho",
    ],
    general: [
      "Estoy constantemente preocupado por todo",
      "No puedo controlar mis pensamientos negativos",
      "Me angustia pensar en el futuro",
      "Mi cuerpo está siempre tenso",
      "No puedo dormir bien por la ansiedad",
      "Siento que algo malo va a pasar",
    ],
  },
  'trastorno_pánico': {
    general: [
      "Tengo ataques de pánico sin razón aparente",
      "Me da miedo que vuelva a pasar",
      "Evito lugares donde antes tuve un ataque",
      "Mi corazón late muy fuerte a veces",
      "Siento que me voy a morir cuando me da",
      "No puedo respirar durante los ataques",
    ],
  },
  'tept': {
    general: [
      "Tengo pesadillas recurrentes",
      "Vivo el trauma una y otra vez",
      "Evito todo lo que me recuerda al evento",
      "Estoy hipervigilante todo el tiempo",
      "Me sobresalto con cualquier ruido",
      "No puedo dormir por las pesadillas",
    ],
  },
  'fobia_social': {
    general: [
      "Me da miedo hablar en público",
      "Evito reuniones sociales",
      "Me preocupa que me juzguen",
      "Me pongo nervioso/a en situaciones sociales",
      "Me da vergüenza hablar con desconocidos",
      "Me ruborizo cuando me hablan",
    ],
  },
};

// Colores para la aplicación
export const colors = {
  primary: '#4A90E2',
  secondary: '#FF8C42',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  background: '#000000',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
  
  // Colores específicos de la app
  psykat: {
    primary: '#4A90E2',
    secondary: '#FF8C42',
    accent: '#7B68EE',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#FF3B30',
    info: '#2196F3',
  },
  
  // Colores para síntomas y diagnósticos
  clinical: {
    depressivo: '#4A90E2',
    ansioso: '#FF8C42',
    psicotico: '#9C27B0',
    traumático: '#f44336',
    obsesivo: '#FF9800',
    narcisista: '#E91E63',
    limite: '#795548',
  },
};

// Configuración de la app
export const appConfig = {
  maxQuestionsPerSession: 5,
  maxActiveCases: 5,
  
  // Niveles y XP
  levels: [
    { level: 1, name: 'Principiante', xpRequired: 0 },
    { level: 2, name: 'Aprendiz', xpRequired: 100 },
    { level: 3, name: 'Intermedio', xpRequired: 250 },
    { level: 4, name: 'Avanzado', xpRequired: 500 },
    { level: 5, name: 'Experto', xpRequired: 1000 },
    { level: 6, name: 'Maestro', xpRequired: 2000 },
    { level: 7, name: 'Especialista', xpRequired: 4000 },
    { level: 8, name: 'Veterano', xpRequired: 8000 },
    { level: 9, name: 'Leyenda', xpRequired: 16000 },
    { level: 10, name: 'Sabio', xpRequired: 32000 },
  ],
  
  // Recompensas de XP
  xpRewards: {
    correctDiagnosis: 100,
    incorrectDiagnosis: 25,
    sessionCompleted: 50,
    batteryApplied: 30,
    symptomIdentified: 10,
    videoInteraction: 5,
  },
  
  // Modos de juego
  gameModes: [
    { id: 'entrenamiento', name: 'Entrenamiento', unlockLevel: 1, hasHints: true },
    { id: 'dificil', name: 'Difícil', unlockLevel: 5, hasHints: false },
    { id: 'realista', name: 'Realista', unlockLevel: 10, hasHints: false, hasRapport: true },
    { id: 'historico', name: 'Histórico', unlockLevel: 15, hasHints: false, isPremium: true },
  ],
};