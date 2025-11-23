// ============================================================================
// PSYKAT 4.0 - Base de Datos Clínica Completa
// ============================================================================

import { CaseDifficulty } from '../types';

// ============================================================================
// NOMBRES ALEATORIOS PARA PACIENTES
// ============================================================================

export const patientNames = {
  firstNames: [
    'María', 'Carmen', 'Ana', 'Laura', 'Patricia', 'Lucía', 'Elena', 'Isabel',
    'Cristina', 'Marta', 'Rosa', 'Pilar', 'Teresa', 'Beatriz', 'Silvia', 'Alicia',
    'Carlos', 'Miguel', 'José', 'Antonio', 'Juan', 'Pedro', 'David', 'Francisco',
    'Alberto', 'Javier', 'Sergio', 'Pablo', 'Alejandro', 'Daniel', 'Luis', 'Marcos',
    'Sofía', 'Paula', 'Andrea', 'Sara', 'Nuria', 'Eva', 'Claudia', 'Raquel',
    'Roberto', 'Fernando', 'Adrián', 'Óscar', 'Rubén', 'Iván', 'Diego', 'Álvaro',
  ],
  lastNames: [
    'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez',
    'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes',
    'Moreno', 'Jiménez', 'Ruiz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
    'Navarro', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco',
    'Molina', 'Morales', 'Suárez', 'Ortega', 'Delgado', 'Castro', 'Ortiz',
    'Rubio', 'Marín', 'Sanz', 'Núñez', 'Iglesias', 'Medina', 'Garrido', 'Cortés',
  ],
  occupations: [
    'Estudiante universitario/a', 'Profesor/a', 'Ingeniero/a', 'Abogado/a',
    'Médico/a', 'Enfermero/a', 'Periodista', 'Diseñador/a', 'Arquitecto/a',
    'Comercial', 'Administrativo/a', 'Psicólogo/a', 'Trabajador/a social',
    'Economista', 'Funcionario/a', 'Emprendedor/a', 'Artista', 'Músico/a',
    'Chef', 'Fotógrafo/a', 'Programador/a', 'Científico/a', 'Veterinario/a',
    'Farmacéutico/a', 'Dentista', 'Fisioterapeuta', 'Autónomo/a', 'Jubilado/a',
  ],
};

export const generateRandomPatient = (seed: number) => {
  const rng = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const firstNameIndex = Math.floor(rng(seed) * patientNames.firstNames.length);
  const lastNameIndex = Math.floor(rng(seed + 1) * patientNames.lastNames.length);
  const occupationIndex = Math.floor(rng(seed + 2) * patientNames.occupations.length);
  const age = Math.floor(rng(seed + 3) * 45) + 18; // 18-63 años

  return {
    name: `${patientNames.firstNames[firstNameIndex]} ${patientNames.lastNames[lastNameIndex]}`,
    age,
    occupation: patientNames.occupations[occupationIndex],
    avatar: patientNames.firstNames[firstNameIndex].substring(0, 2).toUpperCase(),
  };
};

// ============================================================================
// CATEGORÍAS DE SÍNTOMAS
// ============================================================================

export const symptomCategories = {
  afecto: [
    'tristeza', 'anhedonia', 'irritabilidad', 'labilidad_emocional', 'apatia',
    'euforia', 'vacío', 'desesperanza', 'culpa_excesiva', 'verguenza',
  ],
  cognicion: [
    'dificultad_concentracion', 'pensamientos_negativos', 'rumiacion', 'indecision',
    'grandiosidad', 'fuga_de_ideas', 'obsesiones', 'duda_patologica',
    'pensamientos_intrusivos', 'ideacion_suicida',
  ],
  conducta: [
    'aislamiento', 'evitacion', 'agitacion', 'enlentecimiento', 'llanto_frecuente',
    'impulsividad', 'conductas_riesgo', 'compulsiones', 'rituales',
    'autolesiones', 'restriccion_alimentaria', 'atracones', 'conductas_compensatorias',
  ],
  somatico: [
    'insomnio', 'hipersomnia', 'fatiga', 'cambios_apetito', 'dolores_fisicos',
    'taquicardia', 'temblor', 'mareo', 'tension_muscular', 'bajo_peso',
  ],
  ansiedad: [
    'preocupacion_excesiva', 'inquietud', 'miedo', 'ataques_panico',
    'hipervigilancia', 'flashbacks', 'pesadillas', 'sensacion_muerte_inminente',
    'miedo_evaluacion', 'ansiedad_anticipatoria',
  ],
  relacional: [
    'inestabilidad_relaciones', 'miedo_abandono', 'dependencia',
    'evitacion_social', 'hipersensibilidad_critica', 'miedo_rechazo',
  ],
  sustancias: [
    'consumo_compulsivo', 'perdida_control', 'tolerancia', 'abstinencia',
    'craving', 'deterioro_funcional',
  ],
  trauma: [
    'evitacion_recuerdos', 'disociacion', 'culpa_traumatica',
    'embotamiento_emocional', 'respuesta_sobresalto',
  ],
};

// ============================================================================
// 20 DIAGNÓSTICOS COMPLETOS
// ============================================================================

export interface Disorder {
  id: string;
  name: string;
  category: 'animo' | 'ansiedad' | 'trauma' | 'alimentacion' | 'sustancias' | 'personalidad';
  symptoms: string[];
  criteria: number;
  duration: string;
  description: string;
  difficulty: ('entrenamiento' | 'normal' | 'dificil' | 'realista')[];
  suggestedTests: string[];
  differentialDiagnosis: string[];
}

export const disorders: Record<string, Disorder> = {
  // ========== ESTADO DE ÁNIMO ==========
  trastorno_depresivo_mayor: {
    id: 'trastorno_depresivo_mayor',
    name: 'Trastorno Depresivo Mayor',
    category: 'animo',
    symptoms: [
      'tristeza', 'anhedonia', 'fatiga', 'insomnio', 'hipersomnia',
      'cambios_apetito', 'culpa_excesiva', 'pensamientos_negativos',
      'ideacion_suicida', 'agitacion', 'enlentecimiento', 'dificultad_concentracion',
    ],
    criteria: 5,
    duration: '2+ semanas',
    description: 'Estado de ánimo deprimido o pérdida de interés, acompañado de síntomas adicionales que afectan significativamente el funcionamiento.',
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
    suggestedTests: ['PHQ-9', 'BDI-II'],
    differentialDiagnosis: ['distimia', 'trastorno_bipolar_ii', 'trastorno_adaptativo'],
  },

  distimia: {
    id: 'distimia',
    name: 'Trastorno Depresivo Persistente (Distimia)',
    category: 'animo',
    symptoms: [
      'tristeza', 'baja_autoestima', 'fatiga', 'desesperanza',
      'dificultad_concentracion', 'insomnio', 'cambios_apetito',
    ],
    criteria: 3,
    duration: '2+ años',
    description: 'Estado de ánimo deprimido crónico durante la mayor parte del día, más días sí que no, durante al menos 2 años.',
    difficulty: ['normal', 'dificil', 'realista'],
    suggestedTests: ['PHQ-9', 'BDI-II'],
    differentialDiagnosis: ['trastorno_depresivo_mayor', 'trastorno_bipolar_ii'],
  },

  trastorno_bipolar_i: {
    id: 'trastorno_bipolar_i',
    name: 'Trastorno Bipolar I',
    category: 'animo',
    symptoms: [
      'euforia', 'grandiosidad', 'hipersomnia', 'verborrea', 'fuga_de_ideas',
      'conductas_riesgo', 'impulsividad', 'irritabilidad', 'agitacion',
    ],
    criteria: 4,
    duration: '1+ semana (manía)',
    description: 'Presencia de al menos un episodio maníaco, puede alternarse con episodios depresivos.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['MDQ', 'HCL-32'],
    differentialDiagnosis: ['trastorno_bipolar_ii', 'ciclotimia', 'trastorno_depresivo_mayor'],
  },

  trastorno_bipolar_ii: {
    id: 'trastorno_bipolar_ii',
    name: 'Trastorno Bipolar II',
    category: 'animo',
    symptoms: [
      'euforia', 'irritabilidad', 'hipersomnia', 'impulsividad',
      'tristeza', 'anhedonia', 'fatiga', 'conductas_riesgo',
    ],
    criteria: 4,
    duration: '4+ días (hipomanía)',
    description: 'Al menos un episodio hipomaníaco y un episodio depresivo mayor. Sin episodios maníacos completos.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['MDQ', 'BDI-II', 'HCL-32'],
    differentialDiagnosis: ['trastorno_bipolar_i', 'trastorno_depresivo_mayor', 'ciclotimia'],
  },

  ciclotimia: {
    id: 'ciclotimia',
    name: 'Ciclotimia',
    category: 'animo',
    symptoms: [
      'labilidad_emocional', 'irritabilidad', 'euforia', 'tristeza',
      'insomnio', 'impulsividad',
    ],
    criteria: 3,
    duration: '2+ años',
    description: 'Oscilaciones crónicas del ánimo con síntomas hipomaníacos y depresivos que no cumplen criterios completos.',
    difficulty: ['realista'],
    suggestedTests: ['MDQ', 'BDI-II'],
    differentialDiagnosis: ['trastorno_bipolar_ii', 'trastorno_limite_personalidad'],
  },

  trastorno_adaptativo: {
    id: 'trastorno_adaptativo',
    name: 'Trastorno Adaptativo',
    category: 'animo',
    symptoms: [
      'tristeza', 'preocupacion_excesiva', 'aislamiento',
      'dificultad_concentracion', 'insomnio', 'irritabilidad',
    ],
    criteria: 3,
    duration: '3+ meses desde estresor',
    description: 'Respuesta emocional o conductual desproporcionada a un estresor identificable.',
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
    suggestedTests: ['PSS-10', 'PHQ-9'],
    differentialDiagnosis: ['trastorno_depresivo_mayor', 'trastorno_ansiedad_generalizada'],
  },

  // ========== ANSIEDAD ==========
  trastorno_ansiedad_generalizada: {
    id: 'trastorno_ansiedad_generalizada',
    name: 'Trastorno de Ansiedad Generalizada',
    category: 'ansiedad',
    symptoms: [
      'preocupacion_excesiva', 'tension_muscular', 'inquietud',
      'fatiga', 'dificultad_concentracion', 'insomnio', 'irritabilidad',
    ],
    criteria: 4,
    duration: '6+ meses',
    description: 'Ansiedad y preocupación excesivas sobre diversos eventos o actividades, difíciles de controlar.',
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
    suggestedTests: ['GAD-7', 'BAI'],
    differentialDiagnosis: ['trastorno_panico', 'trastorno_depresivo_mayor', 'fobia_social'],
  },

  trastorno_panico: {
    id: 'trastorno_panico',
    name: 'Trastorno de Pánico',
    category: 'ansiedad',
    symptoms: [
      'ataques_panico', 'taquicardia', 'sensacion_muerte_inminente',
      'mareo', 'temblor', 'evitacion', 'preocupacion_excesiva',
    ],
    criteria: 3,
    duration: '1+ mes de preocupación',
    description: 'Ataques de pánico recurrentes e inesperados con preocupación persistente por nuevos ataques.',
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
    suggestedTests: ['BAI', 'GAD-7'],
    differentialDiagnosis: ['trastorno_ansiedad_generalizada', 'agorafobia', 'fobia_social'],
  },

  fobia_social: {
    id: 'fobia_social',
    name: 'Trastorno de Ansiedad Social (Fobia Social)',
    category: 'ansiedad',
    symptoms: [
      'miedo_evaluacion', 'evitacion_social', 'temblor', 'ansiedad_anticipatoria',
      'aislamiento', 'baja_autoestima', 'rumiacion',
    ],
    criteria: 4,
    duration: '6+ meses',
    description: 'Miedo o ansiedad intensa en situaciones sociales donde puede ser evaluado por otros.',
    difficulty: ['normal', 'dificil', 'realista'],
    suggestedTests: ['LSAS', 'BAI'],
    differentialDiagnosis: ['trastorno_ansiedad_generalizada', 'trastorno_evitativo', 'agorafobia'],
  },

  agorafobia: {
    id: 'agorafobia',
    name: 'Agorafobia',
    category: 'ansiedad',
    symptoms: [
      'miedo', 'evitacion', 'dependencia', 'ataques_panico',
      'ansiedad_anticipatoria', 'aislamiento',
    ],
    criteria: 3,
    duration: '6+ meses',
    description: 'Miedo o ansiedad intensa a espacios abiertos, transporte, lugares cerrados o multitudes.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['BAI', 'GAD-7'],
    differentialDiagnosis: ['trastorno_panico', 'fobia_social', 'fobia_especifica'],
  },

  trastorno_obsesivo_compulsivo: {
    id: 'trastorno_obsesivo_compulsivo',
    name: 'Trastorno Obsesivo-Compulsivo (TOC)',
    category: 'ansiedad',
    symptoms: [
      'obsesiones', 'compulsiones', 'rituales', 'duda_patologica',
      'preocupacion_excesiva', 'ansiedad_anticipatoria',
    ],
    criteria: 3,
    duration: '1+ hora/día',
    description: 'Presencia de obsesiones, compulsiones o ambas que consumen tiempo significativo.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['Y-BOCS', 'OCI-R'],
    differentialDiagnosis: ['trastorno_ansiedad_generalizada', 'trastorno_obsesivo_personalidad'],
  },

  // ========== TRAUMA ==========
  trastorno_estres_postraumatico: {
    id: 'trastorno_estres_postraumatico',
    name: 'Trastorno de Estrés Postraumático (TEPT)',
    category: 'trauma',
    symptoms: [
      'flashbacks', 'pesadillas', 'hipervigilancia', 'evitacion_recuerdos',
      'apatia', 'culpa_traumatica', 'irritabilidad', 'insomnio',
    ],
    criteria: 4,
    duration: '1+ mes',
    description: 'Desarrollo de síntomas tras exposición a evento traumático: intrusiones, evitación, alteraciones cognitivas y reactividad.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['PC-PTSD-5', 'PCL-5'],
    differentialDiagnosis: ['trastorno_adaptativo', 'trastorno_depresivo_mayor', 'tept_complejo'],
  },

  tept_complejo: {
    id: 'tept_complejo',
    name: 'TEPT Complejo',
    category: 'trauma',
    symptoms: [
      'flashbacks', 'disociacion', 'labilidad_emocional', 'inestabilidad_relaciones',
      'vacío', 'fatiga', 'evitacion_recuerdos', 'baja_autoestima',
    ],
    criteria: 5,
    duration: 'Trauma prolongado',
    description: 'TEPT con alteraciones adicionales en regulación emocional, autoconcepto y relaciones interpersonales.',
    difficulty: ['realista'],
    suggestedTests: ['PCL-5', 'BDI-II'],
    differentialDiagnosis: ['trastorno_estres_postraumatico', 'trastorno_limite_personalidad'],
  },

  // ========== ALIMENTACIÓN ==========
  anorexia_nerviosa: {
    id: 'anorexia_nerviosa',
    name: 'Anorexia Nerviosa',
    category: 'alimentacion',
    symptoms: [
      'restriccion_alimentaria', 'miedo', 'bajo_peso',
      'rituales', 'aislamiento', 'fatiga',
    ],
    criteria: 3,
    duration: 'Persistente',
    description: 'Restricción alimentaria que lleva a bajo peso, miedo intenso a ganar peso y alteración de la imagen corporal.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['EAT-26'],
    differentialDiagnosis: ['bulimia_nerviosa', 'trastorno_atracon'],
  },

  bulimia_nerviosa: {
    id: 'bulimia_nerviosa',
    name: 'Bulimia Nerviosa',
    category: 'alimentacion',
    symptoms: [
      'atracones', 'conductas_compensatorias', 'verguenza',
      'baja_autoestima', 'impulsividad',
    ],
    criteria: 3,
    duration: '1x/semana por 3 meses',
    description: 'Episodios recurrentes de atracones seguidos de conductas compensatorias inapropiadas.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['EAT-26'],
    differentialDiagnosis: ['anorexia_nerviosa', 'trastorno_atracon'],
  },

  trastorno_atracon: {
    id: 'trastorno_atracon',
    name: 'Trastorno por Atracón',
    category: 'alimentacion',
    symptoms: [
      'atracones', 'culpa_excesiva', 'verguenza',
      'aislamiento', 'tristeza',
    ],
    criteria: 3,
    duration: '1x/semana por 3 meses',
    description: 'Episodios recurrentes de atracones sin conductas compensatorias, con malestar significativo.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['EAT-26', 'BDI-II'],
    differentialDiagnosis: ['bulimia_nerviosa', 'trastorno_depresivo_mayor'],
  },

  // ========== SUSTANCIAS ==========
  trastorno_consumo_alcohol: {
    id: 'trastorno_consumo_alcohol',
    name: 'Trastorno por Consumo de Alcohol',
    category: 'sustancias',
    symptoms: [
      'consumo_compulsivo', 'perdida_control', 'tolerancia',
      'abstinencia', 'deterioro_funcional', 'craving',
    ],
    criteria: 3,
    duration: '12 meses',
    description: 'Patrón problemático de consumo de alcohol que causa deterioro clínicamente significativo.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['AUDIT', 'CAGE'],
    differentialDiagnosis: ['trastorno_consumo_sustancias', 'trastorno_depresivo_mayor'],
  },

  trastorno_consumo_sustancias: {
    id: 'trastorno_consumo_sustancias',
    name: 'Trastorno por Consumo de Sustancias',
    category: 'sustancias',
    symptoms: [
      'craving', 'tolerancia', 'abstinencia', 'consumo_compulsivo',
      'deterioro_funcional', 'conductas_riesgo',
    ],
    criteria: 3,
    duration: '12 meses',
    description: 'Patrón problemático de consumo de sustancias que causa deterioro clínicamente significativo.',
    difficulty: ['dificil', 'realista'],
    suggestedTests: ['DAST-10', 'NIDA'],
    differentialDiagnosis: ['trastorno_consumo_alcohol', 'trastorno_bipolar_i'],
  },

  // ========== PERSONALIDAD ==========
  trastorno_limite_personalidad: {
    id: 'trastorno_limite_personalidad',
    name: 'Trastorno Límite de la Personalidad',
    category: 'personalidad',
    symptoms: [
      'inestabilidad_relaciones', 'impulsividad', 'miedo_abandono',
      'vacío', 'ideacion_suicida', 'labilidad_emocional', 'autolesiones',
    ],
    criteria: 5,
    duration: 'Patrón persistente',
    description: 'Patrón de inestabilidad en relaciones, autoimagen, afectos e impulsividad marcada.',
    difficulty: ['realista'],
    suggestedTests: ['PDQ-4', 'BIS-11'],
    differentialDiagnosis: ['trastorno_bipolar_ii', 'tept_complejo'],
  },

  trastorno_evitativo: {
    id: 'trastorno_evitativo',
    name: 'Trastorno de Personalidad Evitativa',
    category: 'personalidad',
    symptoms: [
      'evitacion_social', 'hipersensibilidad_critica', 'baja_autoestima',
      'miedo_rechazo', 'aislamiento',
    ],
    criteria: 4,
    duration: 'Patrón persistente',
    description: 'Patrón de inhibición social, sentimientos de inadecuación e hipersensibilidad a la evaluación negativa.',
    difficulty: ['realista'],
    suggestedTests: ['PDQ-4', 'LSAS'],
    differentialDiagnosis: ['fobia_social', 'trastorno_ansiedad_generalizada'],
  },

  trastorno_obsesivo_personalidad: {
    id: 'trastorno_obsesivo_personalidad',
    name: 'Trastorno Obsesivo-Compulsivo de la Personalidad',
    category: 'personalidad',
    symptoms: [
      'rituales', 'duda_patologica', 'aislamiento',
      'irritabilidad', 'dificultad_concentracion',
    ],
    criteria: 4,
    duration: 'Patrón persistente',
    description: 'Patrón de preocupación por el orden, perfeccionismo y control mental e interpersonal.',
    difficulty: ['realista'],
    suggestedTests: ['PDQ-4', 'Y-BOCS'],
    differentialDiagnosis: ['trastorno_obsesivo_compulsivo', 'trastorno_ansiedad_generalizada'],
  },
};

// Función para obtener diagnósticos según dificultad
export const getDisordersByDifficulty = (difficulty: CaseDifficulty): Disorder[] => {
  return Object.values(disorders).filter(d => d.difficulty.includes(difficulty));
};

// ============================================================================
// TESTS PSICOLÓGICOS COMPLETOS
// ============================================================================

export interface PsychTest {
  id: string;
  name: string;
  fullName: string;
  category: 'screening' | 'diferencial' | 'personalidad';
  items: number;
  cost: number;
  evaluates: string;
  maxScore: number;
  ranges: { min: number; max: number; label: string; severity: string }[];
  interpretation: string;
  targetDisorders: string[];
  difficulty: CaseDifficulty[];
}

export const psychTests: Record<string, PsychTest> = {
  // ========== SCREENING / GRAVEDAD ==========
  'PHQ-9': {
    id: 'PHQ-9',
    name: 'PHQ-9',
    fullName: 'Patient Health Questionnaire-9',
    category: 'screening',
    items: 9,
    cost: 5,
    evaluates: 'Depresión',
    maxScore: 27,
    ranges: [
      { min: 0, max: 4, label: 'Mínima', severity: 'minimal' },
      { min: 5, max: 9, label: 'Leve', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderada', severity: 'moderate' },
      { min: 15, max: 19, label: 'Moderadamente grave', severity: 'moderately_severe' },
      { min: 20, max: 27, label: 'Grave', severity: 'severe' },
    ],
    interpretation: 'Puntuación ≥10 sugiere depresión clínicamente significativa.',
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia', 'trastorno_adaptativo'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'GAD-7': {
    id: 'GAD-7',
    name: 'GAD-7',
    fullName: 'Generalized Anxiety Disorder-7',
    category: 'screening',
    items: 7,
    cost: 5,
    evaluates: 'Ansiedad generalizada',
    maxScore: 21,
    ranges: [
      { min: 0, max: 4, label: 'Mínima', severity: 'minimal' },
      { min: 5, max: 9, label: 'Leve', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderada', severity: 'moderate' },
      { min: 15, max: 21, label: 'Grave', severity: 'severe' },
    ],
    interpretation: 'Puntuación ≥10 sugiere ansiedad clínicamente significativa.',
    targetDisorders: ['trastorno_ansiedad_generalizada', 'trastorno_panico'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'PSS-10': {
    id: 'PSS-10',
    name: 'PSS-10',
    fullName: 'Perceived Stress Scale-10',
    category: 'screening',
    items: 10,
    cost: 5,
    evaluates: 'Estrés percibido',
    maxScore: 40,
    ranges: [
      { min: 0, max: 13, label: 'Bajo', severity: 'low' },
      { min: 14, max: 26, label: 'Moderado', severity: 'moderate' },
      { min: 27, max: 40, label: 'Alto', severity: 'high' },
    ],
    interpretation: 'Evalúa la percepción de estrés en el último mes.',
    targetDisorders: ['trastorno_adaptativo', 'trastorno_ansiedad_generalizada'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'ISI': {
    id: 'ISI',
    name: 'ISI',
    fullName: 'Insomnia Severity Index',
    category: 'screening',
    items: 7,
    cost: 5,
    evaluates: 'Insomnio',
    maxScore: 28,
    ranges: [
      { min: 0, max: 7, label: 'No clínico', severity: 'none' },
      { min: 8, max: 14, label: 'Leve', severity: 'mild' },
      { min: 15, max: 21, label: 'Moderado', severity: 'moderate' },
      { min: 22, max: 28, label: 'Grave', severity: 'severe' },
    ],
    interpretation: 'Evalúa la naturaleza, gravedad e impacto del insomnio.',
    targetDisorders: ['trastorno_depresivo_mayor', 'trastorno_ansiedad_generalizada'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'PC-PTSD-5': {
    id: 'PC-PTSD-5',
    name: 'PC-PTSD-5',
    fullName: 'Primary Care PTSD Screen',
    category: 'screening',
    items: 5,
    cost: 5,
    evaluates: 'Screening TEPT',
    maxScore: 5,
    ranges: [
      { min: 0, max: 2, label: 'Negativo', severity: 'negative' },
      { min: 3, max: 5, label: 'Positivo', severity: 'positive' },
    ],
    interpretation: 'Puntuación ≥3 indica screening positivo para TEPT.',
    targetDisorders: ['trastorno_estres_postraumatico', 'tept_complejo'],
    difficulty: ['normal', 'dificil', 'realista'],
  },

  'MDQ': {
    id: 'MDQ',
    name: 'MDQ',
    fullName: 'Mood Disorder Questionnaire',
    category: 'screening',
    items: 13,
    cost: 10,
    evaluates: 'Screening bipolar',
    maxScore: 13,
    ranges: [
      { min: 0, max: 6, label: 'Negativo', severity: 'negative' },
      { min: 7, max: 13, label: 'Positivo', severity: 'positive' },
    ],
    interpretation: '≥7 síntomas + mismo período + afectación = screening positivo.',
    targetDisorders: ['trastorno_bipolar_i', 'trastorno_bipolar_ii', 'ciclotimia'],
    difficulty: ['dificil', 'realista'],
  },

  // ========== DIAGNÓSTICO DIFERENCIAL ==========
  'BDI-II': {
    id: 'BDI-II',
    name: 'BDI-II',
    fullName: 'Beck Depression Inventory-II',
    category: 'diferencial',
    items: 21,
    cost: 15,
    evaluates: 'Depresión',
    maxScore: 63,
    ranges: [
      { min: 0, max: 13, label: 'Mínima', severity: 'minimal' },
      { min: 14, max: 19, label: 'Leve', severity: 'mild' },
      { min: 20, max: 28, label: 'Moderada', severity: 'moderate' },
      { min: 29, max: 63, label: 'Grave', severity: 'severe' },
    ],
    interpretation: 'Evaluación exhaustiva de síntomas depresivos según DSM.',
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia', 'trastorno_bipolar_ii'],
    difficulty: ['normal', 'dificil', 'realista'],
  },

  'BAI': {
    id: 'BAI',
    name: 'BAI',
    fullName: 'Beck Anxiety Inventory',
    category: 'diferencial',
    items: 21,
    cost: 15,
    evaluates: 'Ansiedad fisiológica',
    maxScore: 63,
    ranges: [
      { min: 0, max: 7, label: 'Mínima', severity: 'minimal' },
      { min: 8, max: 15, label: 'Leve', severity: 'mild' },
      { min: 16, max: 25, label: 'Moderada', severity: 'moderate' },
      { min: 26, max: 63, label: 'Grave', severity: 'severe' },
    ],
    interpretation: 'Enfocado en síntomas somáticos de ansiedad.',
    targetDisorders: ['trastorno_ansiedad_generalizada', 'trastorno_panico', 'agorafobia'],
    difficulty: ['normal', 'dificil', 'realista'],
  },

  'PCL-5': {
    id: 'PCL-5',
    name: 'PCL-5',
    fullName: 'PTSD Checklist for DSM-5',
    category: 'diferencial',
    items: 20,
    cost: 15,
    evaluates: 'TEPT DSM-5',
    maxScore: 80,
    ranges: [
      { min: 0, max: 30, label: 'Subclínico', severity: 'subclinical' },
      { min: 31, max: 80, label: 'Compatible con TEPT', severity: 'clinical' },
    ],
    interpretation: 'Punto de corte 31-33 sugiere TEPT. Evalúa criterios B, C, D, E.',
    targetDisorders: ['trastorno_estres_postraumatico', 'tept_complejo'],
    difficulty: ['dificil', 'realista'],
  },

  'Y-BOCS': {
    id: 'Y-BOCS',
    name: 'Y-BOCS',
    fullName: 'Yale-Brown Obsessive Compulsive Scale',
    category: 'diferencial',
    items: 10,
    cost: 15,
    evaluates: 'TOC',
    maxScore: 40,
    ranges: [
      { min: 0, max: 7, label: 'Subclínico', severity: 'subclinical' },
      { min: 8, max: 15, label: 'Leve', severity: 'mild' },
      { min: 16, max: 23, label: 'Moderado', severity: 'moderate' },
      { min: 24, max: 31, label: 'Severo', severity: 'severe' },
      { min: 32, max: 40, label: 'Extremo', severity: 'extreme' },
    ],
    interpretation: 'Gold standard para evaluar gravedad del TOC.',
    targetDisorders: ['trastorno_obsesivo_compulsivo', 'trastorno_obsesivo_personalidad'],
    difficulty: ['dificil', 'realista'],
  },

  'LSAS': {
    id: 'LSAS',
    name: 'LSAS',
    fullName: 'Liebowitz Social Anxiety Scale',
    category: 'diferencial',
    items: 24,
    cost: 15,
    evaluates: 'Fobia social',
    maxScore: 144,
    ranges: [
      { min: 0, max: 30, label: 'Normal', severity: 'normal' },
      { min: 31, max: 60, label: 'Leve', severity: 'mild' },
      { min: 61, max: 90, label: 'Moderada', severity: 'moderate' },
      { min: 91, max: 144, label: 'Severa', severity: 'severe' },
    ],
    interpretation: 'Evalúa miedo y evitación en situaciones sociales y de rendimiento.',
    targetDisorders: ['fobia_social', 'trastorno_evitativo'],
    difficulty: ['dificil', 'realista'],
  },

  'EAT-26': {
    id: 'EAT-26',
    name: 'EAT-26',
    fullName: 'Eating Attitudes Test-26',
    category: 'diferencial',
    items: 26,
    cost: 10,
    evaluates: 'Trastornos alimentarios',
    maxScore: 78,
    ranges: [
      { min: 0, max: 19, label: 'Normal', severity: 'normal' },
      { min: 20, max: 78, label: 'Screening positivo', severity: 'positive' },
    ],
    interpretation: 'Punto de corte ≥20 indica riesgo de TCA.',
    targetDisorders: ['anorexia_nerviosa', 'bulimia_nerviosa', 'trastorno_atracon'],
    difficulty: ['dificil', 'realista'],
  },

  'AUDIT': {
    id: 'AUDIT',
    name: 'AUDIT',
    fullName: 'Alcohol Use Disorders Identification Test',
    category: 'diferencial',
    items: 10,
    cost: 10,
    evaluates: 'Consumo de alcohol',
    maxScore: 40,
    ranges: [
      { min: 0, max: 7, label: 'Bajo riesgo', severity: 'low' },
      { min: 8, max: 15, label: 'Riesgo', severity: 'risky' },
      { min: 16, max: 19, label: 'Perjudicial', severity: 'harmful' },
      { min: 20, max: 40, label: 'Posible dependencia', severity: 'dependent' },
    ],
    interpretation: 'Evalúa consumo, dependencia y problemas relacionados con alcohol.',
    targetDisorders: ['trastorno_consumo_alcohol'],
    difficulty: ['dificil', 'realista'],
  },

  'DAST-10': {
    id: 'DAST-10',
    name: 'DAST-10',
    fullName: 'Drug Abuse Screening Test-10',
    category: 'diferencial',
    items: 10,
    cost: 10,
    evaluates: 'Consumo de drogas',
    maxScore: 10,
    ranges: [
      { min: 0, max: 0, label: 'Sin problema', severity: 'none' },
      { min: 1, max: 2, label: 'Leve', severity: 'mild' },
      { min: 3, max: 5, label: 'Moderado', severity: 'moderate' },
      { min: 6, max: 8, label: 'Sustancial', severity: 'substantial' },
      { min: 9, max: 10, label: 'Severo', severity: 'severe' },
    ],
    interpretation: 'Screening de uso problemático de sustancias.',
    targetDisorders: ['trastorno_consumo_sustancias'],
    difficulty: ['dificil', 'realista'],
  },

  // ========== PERSONALIDAD ==========
  'PDQ-4': {
    id: 'PDQ-4',
    name: 'PDQ-4',
    fullName: 'Personality Diagnostic Questionnaire-4',
    category: 'personalidad',
    items: 99,
    cost: 25,
    evaluates: 'Trastornos de personalidad',
    maxScore: 99,
    ranges: [
      { min: 0, max: 20, label: 'Sin indicadores', severity: 'none' },
      { min: 21, max: 99, label: 'Requiere evaluación', severity: 'elevated' },
    ],
    interpretation: 'Screening de TP. Positivo requiere entrevista estructurada (SCID-II).',
    targetDisorders: ['trastorno_limite_personalidad', 'trastorno_evitativo', 'trastorno_obsesivo_personalidad'],
    difficulty: ['realista'],
  },

  'BIS-11': {
    id: 'BIS-11',
    name: 'BIS-11',
    fullName: 'Barratt Impulsiveness Scale-11',
    category: 'personalidad',
    items: 30,
    cost: 15,
    evaluates: 'Impulsividad',
    maxScore: 120,
    ranges: [
      { min: 0, max: 51, label: 'Baja', severity: 'low' },
      { min: 52, max: 71, label: 'Normal', severity: 'normal' },
      { min: 72, max: 120, label: 'Elevada', severity: 'high' },
    ],
    interpretation: 'Evalúa impulsividad atencional, motora y no planificada.',
    targetDisorders: ['trastorno_limite_personalidad', 'trastorno_bipolar_i'],
    difficulty: ['realista'],
  },

  // ========== SCREENING ADICIONALES ==========
  'PHQ-15': {
    id: 'PHQ-15',
    name: 'PHQ-15',
    fullName: 'Patient Health Questionnaire-15 (Somatización)',
    category: 'screening',
    items: 15,
    cost: 5,
    evaluates: 'Síntomas somáticos',
    maxScore: 30,
    ranges: [
      { min: 0, max: 4, label: 'Mínima', severity: 'minimal' },
      { min: 5, max: 9, label: 'Leve', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderada', severity: 'moderate' },
      { min: 15, max: 30, label: 'Grave', severity: 'severe' },
    ],
    interpretation: 'Evalúa la presencia de síntomas somáticos frecuentes.',
    targetDisorders: ['trastorno_ansiedad_generalizada', 'trastorno_depresivo_mayor'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'SCOFF': {
    id: 'SCOFF',
    name: 'SCOFF',
    fullName: 'SCOFF Questionnaire (TCA Screening)',
    category: 'screening',
    items: 5,
    cost: 5,
    evaluates: 'Screening TCA rápido',
    maxScore: 5,
    ranges: [
      { min: 0, max: 1, label: 'Negativo', severity: 'negative' },
      { min: 2, max: 5, label: 'Positivo', severity: 'positive' },
    ],
    interpretation: '≥2 respuestas afirmativas indica riesgo de TCA.',
    targetDisorders: ['anorexia_nerviosa', 'bulimia_nerviosa', 'trastorno_atracon'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'CAGE': {
    id: 'CAGE',
    name: 'CAGE',
    fullName: 'CAGE Questionnaire (Alcohol)',
    category: 'screening',
    items: 4,
    cost: 5,
    evaluates: 'Screening alcohol rápido',
    maxScore: 4,
    ranges: [
      { min: 0, max: 1, label: 'Negativo', severity: 'negative' },
      { min: 2, max: 4, label: 'Positivo', severity: 'positive' },
    ],
    interpretation: '≥2 respuestas afirmativas indica posible problema con alcohol.',
    targetDisorders: ['trastorno_consumo_alcohol'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  'NIDA': {
    id: 'NIDA',
    name: 'NIDA Quick Screen',
    fullName: 'NIDA Quick Screen (Sustancias)',
    category: 'screening',
    items: 4,
    cost: 5,
    evaluates: 'Screening sustancias rápido',
    maxScore: 4,
    ranges: [
      { min: 0, max: 0, label: 'Negativo', severity: 'negative' },
      { min: 1, max: 4, label: 'Positivo', severity: 'positive' },
    ],
    interpretation: 'Cualquier respuesta positiva requiere evaluación adicional.',
    targetDisorders: ['trastorno_consumo_sustancias', 'trastorno_consumo_alcohol'],
    difficulty: ['normal', 'dificil', 'realista'],
  },

  'K6': {
    id: 'K6',
    name: 'K6',
    fullName: 'Kessler-6 Distress Scale',
    category: 'screening',
    items: 6,
    cost: 5,
    evaluates: 'Distrés psicológico',
    maxScore: 24,
    ranges: [
      { min: 0, max: 4, label: 'Bajo', severity: 'low' },
      { min: 5, max: 12, label: 'Moderado', severity: 'moderate' },
      { min: 13, max: 24, label: 'Alto', severity: 'high' },
    ],
    interpretation: 'Puntuación ≥13 indica alto nivel de distrés psicológico.',
    targetDisorders: ['trastorno_depresivo_mayor', 'trastorno_ansiedad_generalizada'],
    difficulty: ['entrenamiento', 'normal', 'dificil', 'realista'],
  },

  // ========== DIFERENCIAL ADICIONALES ==========
  'OCI-R': {
    id: 'OCI-R',
    name: 'OCI-R',
    fullName: 'Obsessive-Compulsive Inventory-Revised',
    category: 'diferencial',
    items: 18,
    cost: 10,
    evaluates: 'Obsesiones y compulsiones',
    maxScore: 72,
    ranges: [
      { min: 0, max: 20, label: 'No clínico', severity: 'none' },
      { min: 21, max: 72, label: 'Clínicamente significativo', severity: 'clinical' },
    ],
    interpretation: 'Punto de corte ≥21 sugiere TOC clínicamente significativo.',
    targetDisorders: ['trastorno_obsesivo_compulsivo'],
    difficulty: ['dificil', 'realista'],
  },

  'SHAPS': {
    id: 'SHAPS',
    name: 'SHAPS',
    fullName: 'Snaith-Hamilton Pleasure Scale',
    category: 'diferencial',
    items: 14,
    cost: 10,
    evaluates: 'Anhedonia',
    maxScore: 14,
    ranges: [
      { min: 0, max: 2, label: 'Normal', severity: 'normal' },
      { min: 3, max: 14, label: 'Anhedonia presente', severity: 'anhedonic' },
    ],
    interpretation: 'Puntuación ≥3 indica anhedonia clínicamente significativa.',
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia'],
    difficulty: ['dificil', 'realista'],
  },

  'PSQI': {
    id: 'PSQI',
    name: 'PSQI',
    fullName: 'Pittsburgh Sleep Quality Index',
    category: 'diferencial',
    items: 19,
    cost: 10,
    evaluates: 'Calidad del sueño',
    maxScore: 21,
    ranges: [
      { min: 0, max: 5, label: 'Buena calidad', severity: 'good' },
      { min: 6, max: 21, label: 'Mala calidad', severity: 'poor' },
    ],
    interpretation: 'Puntuación >5 indica mala calidad de sueño.',
    targetDisorders: ['trastorno_depresivo_mayor', 'trastorno_ansiedad_generalizada'],
    difficulty: ['dificil', 'realista'],
  },

  'ASRS': {
    id: 'ASRS',
    name: 'ASRS v1.1',
    fullName: 'Adult ADHD Self-Report Scale',
    category: 'diferencial',
    items: 18,
    cost: 10,
    evaluates: 'TDAH en adultos',
    maxScore: 72,
    ranges: [
      { min: 0, max: 16, label: 'Improbable', severity: 'unlikely' },
      { min: 17, max: 23, label: 'Posible', severity: 'possible' },
      { min: 24, max: 72, label: 'Probable', severity: 'likely' },
    ],
    interpretation: 'Screening inicial para TDAH en adultos.',
    targetDisorders: ['trastorno_limite_personalidad', 'trastorno_bipolar_i'],
    difficulty: ['dificil', 'realista'],
  },

  'HCL-32': {
    id: 'HCL-32',
    name: 'HCL-32',
    fullName: 'Hypomania Checklist-32',
    category: 'diferencial',
    items: 32,
    cost: 15,
    evaluates: 'Hipomanía',
    maxScore: 32,
    ranges: [
      { min: 0, max: 13, label: 'Negativo', severity: 'negative' },
      { min: 14, max: 32, label: 'Positivo', severity: 'positive' },
    ],
    interpretation: 'Puntuación ≥14 sugiere historia de episodios hipomaníacos.',
    targetDisorders: ['trastorno_bipolar_ii', 'ciclotimia'],
    difficulty: ['dificil', 'realista'],
  },

  'WSAS': {
    id: 'WSAS',
    name: 'WSAS',
    fullName: 'Work and Social Adjustment Scale',
    category: 'diferencial',
    items: 5,
    cost: 10,
    evaluates: 'Discapacidad funcional',
    maxScore: 40,
    ranges: [
      { min: 0, max: 9, label: 'Bajo impacto', severity: 'low' },
      { min: 10, max: 19, label: 'Moderado', severity: 'moderate' },
      { min: 20, max: 40, label: 'Severo', severity: 'severe' },
    ],
    interpretation: 'Evalúa el impacto funcional en trabajo, vida social y familiar.',
    targetDisorders: ['trastorno_depresivo_mayor', 'trastorno_ansiedad_generalizada', 'fobia_social'],
    difficulty: ['normal', 'dificil', 'realista'],
  },

  'EPDS': {
    id: 'EPDS',
    name: 'EPDS',
    fullName: 'Edinburgh Postnatal Depression Scale',
    category: 'diferencial',
    items: 10,
    cost: 10,
    evaluates: 'Depresión perinatal',
    maxScore: 30,
    ranges: [
      { min: 0, max: 9, label: 'Bajo riesgo', severity: 'low' },
      { min: 10, max: 12, label: 'Posible depresión', severity: 'possible' },
      { min: 13, max: 30, label: 'Probable depresión', severity: 'probable' },
    ],
    interpretation: 'Puntuación ≥10 requiere evaluación clínica.',
    targetDisorders: ['trastorno_depresivo_mayor', 'trastorno_adaptativo'],
    difficulty: ['dificil', 'realista'],
  },

  // ========== PERSONALIDAD ADICIONALES ==========
  'STAI': {
    id: 'STAI',
    name: 'STAI',
    fullName: 'State-Trait Anxiety Inventory',
    category: 'personalidad',
    items: 40,
    cost: 15,
    evaluates: 'Ansiedad estado/rasgo',
    maxScore: 80,
    ranges: [
      { min: 0, max: 30, label: 'Baja', severity: 'low' },
      { min: 31, max: 44, label: 'Moderada', severity: 'moderate' },
      { min: 45, max: 80, label: 'Alta', severity: 'high' },
    ],
    interpretation: 'Diferencia entre ansiedad situacional (estado) y disposicional (rasgo).',
    targetDisorders: ['trastorno_ansiedad_generalizada', 'trastorno_panico', 'fobia_social'],
    difficulty: ['dificil', 'realista'],
  },

  'PID-5-SF': {
    id: 'PID-5-SF',
    name: 'PID-5-SF',
    fullName: 'Personality Inventory for DSM-5 Short Form',
    category: 'personalidad',
    items: 100,
    cost: 25,
    evaluates: 'Rasgos de personalidad DSM-5',
    maxScore: 300,
    ranges: [
      { min: 0, max: 100, label: 'Normal', severity: 'normal' },
      { min: 101, max: 200, label: 'Elevado', severity: 'elevated' },
      { min: 201, max: 300, label: 'Muy elevado', severity: 'very_elevated' },
    ],
    interpretation: 'Evalúa dominios: Afectividad negativa, Desapego, Antagonismo, Desinhibición, Psicoticismo.',
    targetDisorders: ['trastorno_limite_personalidad', 'trastorno_evitativo', 'trastorno_obsesivo_personalidad'],
    difficulty: ['realista'],
  },

  'TCI-R': {
    id: 'TCI-R',
    name: 'TCI-R-140',
    fullName: 'Temperament and Character Inventory-Revised',
    category: 'personalidad',
    items: 140,
    cost: 25,
    evaluates: 'Temperamento y carácter',
    maxScore: 140,
    ranges: [
      { min: 0, max: 50, label: 'Bajo', severity: 'low' },
      { min: 51, max: 90, label: 'Medio', severity: 'medium' },
      { min: 91, max: 140, label: 'Alto', severity: 'high' },
    ],
    interpretation: 'Evalúa 4 dimensiones de temperamento y 3 de carácter.',
    targetDisorders: ['trastorno_limite_personalidad', 'trastorno_evitativo'],
    difficulty: ['realista'],
  },

  'MMPI-2-RF': {
    id: 'MMPI-2-RF',
    name: 'MMPI-2-RF',
    fullName: 'Minnesota Multiphasic Personality Inventory-2-RF (Reducido)',
    category: 'personalidad',
    items: 50,
    cost: 30,
    evaluates: 'Perfil psicopatológico completo',
    maxScore: 100,
    ranges: [
      { min: 0, max: 40, label: 'Normal', severity: 'normal' },
      { min: 41, max: 65, label: 'Moderado', severity: 'moderate' },
      { min: 66, max: 100, label: 'Clínico', severity: 'clinical' },
    ],
    interpretation: 'Perfil comprehensivo de psicopatología. Requiere interpretación especializada.',
    targetDisorders: ['trastorno_limite_personalidad', 'trastorno_depresivo_mayor', 'trastorno_bipolar_i'],
    difficulty: ['realista'],
  },
};

// Función para obtener tests según dificultad
export const getTestsByDifficulty = (difficulty: CaseDifficulty): PsychTest[] => {
  return Object.values(psychTests).filter(t => t.difficulty.includes(difficulty));
};

// ============================================================================
// GENERADOR DE INFORMES DE TESTS
// ============================================================================

export interface TestResult {
  testId: string;
  score: number;
  subscales?: Record<string, number>;
  interpretation: string;
  severity: string;
}

export const generateTestReport = (
  testId: string,
  difficulty: CaseDifficulty,
  patientDisorder: string
): TestResult => {
  const test = psychTests[testId];
  if (!test) throw new Error(`Test ${testId} not found`);

  // Generar puntuación basada en si el test es relevante para el trastorno
  const disorder = disorders[patientDisorder];
  const isRelevant = disorder?.suggestedTests.includes(testId);

  let score: number;
  if (isRelevant) {
    // Puntuación alta si es relevante
    const minClinical = test.ranges.find(r => r.severity !== 'minimal' && r.severity !== 'none' && r.severity !== 'low')?.min || test.maxScore * 0.4;
    score = Math.floor(minClinical + Math.random() * (test.maxScore - minClinical) * 0.7);
  } else {
    // Puntuación baja/normal si no es relevante
    const maxNormal = test.ranges.find(r => r.severity === 'minimal' || r.severity === 'none' || r.severity === 'low')?.max || test.maxScore * 0.3;
    score = Math.floor(Math.random() * maxNormal);
  }

  // Encontrar rango
  const range = test.ranges.find(r => score >= r.min && score <= r.max) || test.ranges[0];

  // Generar interpretación según dificultad
  let interpretation: string;

  if (difficulty === 'entrenamiento' || difficulty === 'normal') {
    // Modo fácil: puntuación simple
    interpretation = `Puntuación: ${score}/${test.maxScore}\nGravedad: ${range.label}`;
  } else {
    // Modo difícil/realista: informe detallado
    interpretation = generateDetailedReport(test, score, range);
  }

  return {
    testId,
    score,
    interpretation,
    severity: range.severity,
  };
};

const generateDetailedReport = (
  test: PsychTest,
  score: number,
  range: { label: string; severity: string }
): string => {
  // Generadores aleatorios para subescalas
  const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  switch (test.id) {
    case 'PHQ-9':
      return `PHQ-9
Puntuación total: ${score}/27
Gravedad estimada: ${range.label}

Distribución de síntomas:
- Ánimo deprimido: ${rnd(0, 3)}
- Anhedonia: ${rnd(0, 3)}
- Sueño: ${rnd(0, 3)}
- Energía: ${rnd(0, 3)}
- Concentración: ${rnd(0, 3)}
- Autoimagen, apetito, agitación, ideación: dentro de rango variable

Interpretación clínica:
${score >= 15 ? 'La puntuación sugiere afectación funcional moderada-grave, especialmente en sueño y energía.' :
  score >= 10 ? 'Depresión clínicamente significativa. Considerar intervención.' :
  'Síntomas dentro del rango normal o leve.'}`;

    case 'GAD-7':
      return `GAD-7
Puntuación total: ${score}/21
Gravedad: ${range.label}

Ítems más elevados: preocupación excesiva y dificultad para controlar la preocupación.

Interpretación:
${score >= 10 ? 'Consistente con síntomas de ansiedad casi diaria.' : 'Ansiedad dentro de parámetros normales.'}`;

    case 'PSS-10':
      return `PSS-10
Puntuación total: ${score}/40
Nivel: Estrés percibido ${range.label.toLowerCase()}

Patrón:
${score >= 27 ? 'El paciente reporta baja capacidad para manejar demandas externas y frecuentes respuestas negativas ("me siento superado/a").' :
  score >= 14 ? 'Capacidad de afrontamiento moderada con episodios de sentirse desbordado.' :
  'Adecuado manejo del estrés percibido.'}`;

    case 'ISI':
      return `ISI
Puntuación total: ${score}/28
Severidad: Insomnio ${range.label.toLowerCase()}

Aspectos afectados:
${score >= 15 ? '- Latencia de sueño prolongada\n- Mantenimiento del sueño con despertares nocturnos\n- Impacto significativo en funcionamiento diurno' :
  score >= 8 ? '- Latencia de sueño moderada\n- Algunos despertares nocturnos' :
  '- Patrón de sueño dentro de límites normales'}`;

    case 'PC-PTSD-5':
      const ptsdItems = rnd(score >= 3 ? 3 : 1, Math.min(5, score + 1));
      return `PC-PTSD-5
Respuestas afirmativas: ${ptsdItems}/5
Resultado: ${score >= 3 ? 'Screening positivo para posible TEPT' : 'Screening negativo'}

${score >= 3 ? 'Áreas activadas: reviviscencias, evitación, hipervigilancia, malestar persistente.\nRequiere confirmación con PCL-5.' : 'No se detectan indicadores significativos de trauma.'}`;

    case 'BDI-II':
      return `BDI-II
Puntuación total: ${score}/63
Gravedad: Depresión ${range.label.toLowerCase()}

Síntomas destacados:
- Pérdida de placer: ${score >= 20 ? 'significativa' : 'leve'}
- Autocrítica: ${score >= 25 ? 'elevada' : 'moderada'}
- Fatiga: ${score >= 20 ? 'significativa' : 'leve'}
- Pensamientos pesimistas: ${score >= 30 ? 'frecuentes' : 'ocasionales'}

${score >= 29 ? 'Coherente con afectación funcional alta.' : score >= 20 ? 'Sintomatología moderada que afecta funcionamiento.' : 'Sintomatología leve.'}`;

    case 'BAI':
      return `BAI
Puntuación total: ${score}/63
Gravedad: Ansiedad ${range.label.toLowerCase()}

Perfil dominado por síntomas fisiológicos: ${score >= 16 ? 'tensión muscular, mareos, inquietud.' : 'síntomas leves de activación.'}

${score >= 26 ? 'Ansiedad severa con componente somático prominente.' : ''}`;

    case 'PCL-5':
      return `PCL-5
Puntuación total: ${score}/80
Resultado: ${score >= 31 ? 'Compatible con TEPT' : 'Subclínico'}

Criterios DSM-5 activados:
B (intrusión): ${rnd(2, 5)}/5
C (evitación): ${rnd(0, 2)}/2
D (alteraciones cognitivo-afectivas): ${rnd(3, 7)}/7
E (reactividad): ${rnd(2, 6)}/6

Interpretación: ${score >= 31 ? 'Cumple umbrales de todos los criterios esenciales.' : 'No alcanza criterios clínicos.'}`;

    case 'AUDIT':
      return `AUDIT
Puntuación total: ${score}/40
Nivel: ${range.label}

Áreas críticas:
${score >= 8 ? '- Episodios de consumo alto\n' : ''}${score >= 16 ? '- Deterioro ocasional del control\n' : ''}${score >= 20 ? '- Signos de dependencia física/psicológica' : '- Control preservado'}`;

    case 'DAST-10':
      return `DAST-10
Puntuación total: ${score}/10
Severidad: ${range.label}

Indicadores: ${score >= 3 ? 'uso recurrente, dificultades interpersonales, impacto en rutina.' : 'sin indicadores significativos de uso problemático.'}`;

    case 'Y-BOCS':
      return `Y-BOCS
Puntuación total: ${score}/40
Gravedad: TOC ${range.label.toLowerCase()}

Predominio: ${Math.random() > 0.5 ? 'rituales de comprobación' : 'rituales de limpieza/contaminación'} y pensamientos intrusivos.

Tiempo dedicado a obsesiones/compulsiones: ${score >= 24 ? '3+ horas/día' : score >= 16 ? '1-3 horas/día' : '<1 hora/día'}`;

    case 'LSAS':
      return `LSAS
Puntuación total: ${score}/144
Severidad: Fobia social ${range.label.toLowerCase()}

Evita: ${score >= 60 ? 'interacción social, situaciones de rendimiento, hablar en público.' : score >= 30 ? 'algunas situaciones sociales específicas.' : 'pocas situaciones sociales.'}`;

    case 'MDQ':
      const mdqSymptoms = rnd(score >= 7 ? 7 : 4, Math.min(13, score + 3));
      return `MDQ
Resultado: ${score >= 7 ? 'Screening positivo' : 'Screening negativo'}

Síntomas activados: ${mdqSymptoms}/13
${score >= 7 ? 'Aumento energía, menor necesidad de sueño, verborrea, impulsividad.\nRecomienda evaluación estructurada para descartar bipolaridad tipo II o ciclotimia.' : 'No se detectan patrones de hipomanía/manía.'}`;

    case 'EAT-26':
      return `EAT-26
Puntuación total: ${score}/78
${score >= 20 ? 'Screening positivo para TCA' : 'Screening negativo'}

${score >= 20 ? 'Dimensiones afectadas: dieta restrictiva, preocupación por peso, control oral.\nRecomendable evaluación clínica detallada.' : 'Sin indicadores significativos de TCA.'}`;

    case 'PDQ-4':
      return `PDQ-4
Resultados generales: ${score >= 21 ? 'screening positivo' : 'sin elevaciones significativas'}

${score >= 21 ? `Posibles áreas a explorar:
- Cluster B: impulsividad, reactividad emocional
- Cluster C: dependencia, temor a separación

No confirma diagnóstico; requiere entrevista estructurada (SCID-II).` : 'Perfil dentro de parámetros normales.'}`;

    case 'BIS-11':
      return `BIS-11
Puntuación total: ${score}/120
Interpretación: Impulsividad ${range.label.toLowerCase()}

Subescalas:
- Atencional: ${score >= 72 ? 'alta' : 'normal'}
- Motora: ${score >= 72 ? 'moderada-alta' : 'normal'}
- No planificación: ${score >= 72 ? 'elevada' : 'normal'}

${score >= 72 ? 'Consistente con dificultades en inhibición, anticipación de consecuencias y control de urgencias.' : 'Niveles de impulsividad dentro de lo esperado.'}`;

    case 'STAI':
      const estadoScore = rnd(Math.floor(score * 0.4), Math.floor(score * 0.6));
      const rasgoScore = score - estadoScore;
      return `STAI
Puntuación total: ${score}/80
Ansiedad-Estado: ${estadoScore}/40
Ansiedad-Rasgo: ${rasgoScore}/40

Interpretación: ${rasgoScore > estadoScore ? 'Predomina ansiedad como rasgo de personalidad (disposicional).' : 'Predomina ansiedad situacional (estado actual).'}`;

    case 'HCL-32':
      return `HCL-32
Puntuación total: ${score}/32
Resultado: ${score >= 14 ? 'Positivo para historia de hipomanía' : 'Negativo'}

${score >= 14 ? 'Sugiere episodios previos de elevación del ánimo. Considerar espectro bipolar.' : 'Sin evidencia de episodios hipomaníacos previos.'}`;

    case 'OCI-R':
      return `OCI-R
Puntuación total: ${score}/72
Resultado: ${score >= 21 ? 'Clínicamente significativo' : 'No clínico'}

${score >= 21 ? 'Subescalas elevadas en lavado, verificación u orden. Consistente con sintomatología TOC.' : 'Sin elevaciones significativas en obsesiones/compulsiones.'}`;

    default:
      return `${test.fullName}
Puntuación total: ${score}/${test.maxScore}
Gravedad: ${range.label}

Interpretación clínica:
${test.interpretation}`;
  }
};

// ============================================================================
// TRATAMIENTOS POR DIAGNÓSTICO
// ============================================================================

export interface Treatment {
  id: string;
  name: string;
  type: 'primera_linea' | 'segunda_linea' | 'adjunto';
  description: string;
  effectiveness: string;
  duration: string;
  techniques: string[];
  targetDisorders: string[];
}

export const treatments: Record<string, Treatment> = {
  // TCC Variantes
  tcc_depresion: {
    id: 'tcc_depresion',
    name: 'TCC para Depresión',
    type: 'primera_linea',
    description: 'Identificación y modificación de pensamientos automáticos negativos y activación conductual.',
    effectiveness: 'Alta (NNT: 4-5)',
    duration: '12-20 sesiones',
    techniques: ['Reestructuración cognitiva', 'Activación conductual', 'Registro de pensamientos', 'Experimentos conductuales'],
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia', 'trastorno_adaptativo'],
  },

  tcc_ansiedad: {
    id: 'tcc_ansiedad',
    name: 'TCC para Trastornos de Ansiedad',
    type: 'primera_linea',
    description: 'Exposición gradual y reestructuración de pensamientos ansiosos.',
    effectiveness: 'Muy alta (NNT: 3)',
    duration: '10-15 sesiones',
    techniques: ['Exposición gradual', 'Desensibilización sistemática', 'Relajación progresiva', 'Reestructuración cognitiva'],
    targetDisorders: ['trastorno_ansiedad_generalizada', 'trastorno_panico', 'fobia_social', 'agorafobia'],
  },

  erp: {
    id: 'erp',
    name: 'Exposición y Prevención de Respuesta (EPR)',
    type: 'primera_linea',
    description: 'Exposición a obsesiones sin realizar compulsiones.',
    effectiveness: 'Muy alta para TOC',
    duration: '12-16 sesiones',
    techniques: ['Jerarquía de exposición', 'Prevención de rituales', 'Habituación', 'Exposición imaginada'],
    targetDisorders: ['trastorno_obsesivo_compulsivo'],
  },

  // Terapias de tercera generación
  act: {
    id: 'act',
    name: 'Terapia de Aceptación y Compromiso (ACT)',
    type: 'primera_linea',
    description: 'Aceptación de experiencias internas y compromiso con valores personales.',
    effectiveness: 'Alta',
    duration: '8-16 sesiones',
    techniques: ['Defusión cognitiva', 'Mindfulness', 'Clarificación de valores', 'Acción comprometida'],
    targetDisorders: ['trastorno_depresivo_mayor', 'trastorno_ansiedad_generalizada', 'trastorno_adaptativo'],
  },

  dbt: {
    id: 'dbt',
    name: 'Terapia Dialéctico-Conductual (DBT)',
    type: 'primera_linea',
    description: 'Regulación emocional y habilidades interpersonales para patrones de inestabilidad.',
    effectiveness: 'Alta para TLP',
    duration: '1 año (programa completo)',
    techniques: ['Mindfulness', 'Tolerancia al malestar', 'Regulación emocional', 'Efectividad interpersonal'],
    targetDisorders: ['trastorno_limite_personalidad', 'tept_complejo'],
  },

  mbct: {
    id: 'mbct',
    name: 'Terapia Cognitiva Basada en Mindfulness',
    type: 'primera_linea',
    description: 'Reducción de la rumiación mediante atención plena.',
    effectiveness: 'Alta (prevención recaídas)',
    duration: '8 sesiones grupales',
    techniques: ['Meditación', 'Body scan', 'Respiración consciente', 'Yoga suave'],
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia', 'trastorno_ansiedad_generalizada'],
  },

  // Trauma
  emdr: {
    id: 'emdr',
    name: 'EMDR',
    type: 'primera_linea',
    description: 'Procesamiento de memorias traumáticas mediante estimulación bilateral.',
    effectiveness: 'Muy alta para TEPT',
    duration: '6-12 sesiones',
    techniques: ['Desensibilización', 'Reprocesamiento', 'Instalación de recursos', 'Escaneo corporal'],
    targetDisorders: ['trastorno_estres_postraumatico', 'tept_complejo'],
  },

  cpt: {
    id: 'cpt',
    name: 'Terapia de Procesamiento Cognitivo',
    type: 'primera_linea',
    description: 'Modificación de cogniciones relacionadas con el trauma.',
    effectiveness: 'Alta',
    duration: '12 sesiones',
    techniques: ['Identificación de puntos atascados', 'Hojas de trabajo cognitivas', 'Reevaluación del trauma'],
    targetDisorders: ['trastorno_estres_postraumatico', 'tept_complejo'],
  },

  // Alimentación
  tcc_tca: {
    id: 'tcc_tca',
    name: 'TCC-E (Enhanced) para TCA',
    type: 'primera_linea',
    description: 'Tratamiento transdiagnóstico para trastornos alimentarios.',
    effectiveness: 'Alta',
    duration: '20 sesiones',
    techniques: ['Alimentación regular', 'Reestructuración imagen corporal', 'Prevención de atracones', 'Manejo emocional'],
    targetDisorders: ['anorexia_nerviosa', 'bulimia_nerviosa', 'trastorno_atracon'],
  },

  // Sustancias
  entrevista_motivacional: {
    id: 'entrevista_motivacional',
    name: 'Entrevista Motivacional',
    type: 'primera_linea',
    description: 'Exploración y resolución de la ambivalencia hacia el cambio.',
    effectiveness: 'Moderada-Alta',
    duration: '4-6 sesiones',
    techniques: ['Preguntas abiertas', 'Afirmaciones', 'Escucha reflexiva', 'Resúmenes'],
    targetDisorders: ['trastorno_consumo_alcohol', 'trastorno_consumo_sustancias'],
  },

  prevencion_recaidas: {
    id: 'prevencion_recaidas',
    name: 'Prevención de Recaídas',
    type: 'primera_linea',
    description: 'Identificación de situaciones de riesgo y estrategias de afrontamiento.',
    effectiveness: 'Alta',
    duration: '8-12 sesiones',
    techniques: ['Identificación de disparadores', 'Habilidades de afrontamiento', 'Plan de emergencia', 'Red de apoyo'],
    targetDisorders: ['trastorno_consumo_alcohol', 'trastorno_consumo_sustancias'],
  },

  // Bipolar
  psicoeducacion_bipolar: {
    id: 'psicoeducacion_bipolar',
    name: 'Psicoeducación para Trastorno Bipolar',
    type: 'primera_linea',
    description: 'Educación sobre la enfermedad, adherencia al tratamiento y detección temprana.',
    effectiveness: 'Alta (reduce recaídas 50%)',
    duration: '12-21 sesiones',
    techniques: ['Conocimiento de la enfermedad', 'Gráficos del ánimo', 'Detección de pródromos', 'Higiene del sueño'],
    targetDisorders: ['trastorno_bipolar_i', 'trastorno_bipolar_ii', 'ciclotimia'],
  },

  // Interpersonal
  terapia_interpersonal: {
    id: 'terapia_interpersonal',
    name: 'Terapia Interpersonal (TIP)',
    type: 'primera_linea',
    description: 'Mejora de relaciones y comunicación interpersonal.',
    effectiveness: 'Alta',
    duration: '12-16 sesiones',
    techniques: ['Análisis de comunicación', 'Role playing', 'Manejo de conflictos', 'Duelo y transiciones'],
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia', 'trastorno_adaptativo'],
  },

  // Relajación y complementarias
  entrenamiento_relajacion: {
    id: 'entrenamiento_relajacion',
    name: 'Entrenamiento en Relajación',
    type: 'adjunto',
    description: 'Técnicas de relajación muscular progresiva y respiración.',
    effectiveness: 'Moderada',
    duration: '4-8 sesiones',
    techniques: ['Relajación muscular progresiva', 'Respiración diafragmática', 'Visualización', 'Autógenos'],
    targetDisorders: ['trastorno_ansiedad_generalizada', 'trastorno_panico', 'insomnio'],
  },

  activacion_conductual: {
    id: 'activacion_conductual',
    name: 'Activación Conductual',
    type: 'primera_linea',
    description: 'Incremento de actividades gratificantes y con sentido.',
    effectiveness: 'Alta (comparable a TCC completa)',
    duration: '8-16 sesiones',
    techniques: ['Monitoreo de actividades', 'Programación de actividades', 'Resolución de problemas', 'Reducción de evitación'],
    targetDisorders: ['trastorno_depresivo_mayor', 'distimia'],
  },
};

// Función para obtener tratamientos por diagnóstico
export const getTreatmentsByDisorder = (disorderId: string): Treatment[] => {
  return Object.values(treatments).filter(t => t.targetDisorders.includes(disorderId));
};

// Función para obtener tratamientos de primera línea
export const getFirstLineTreatments = (disorderId: string): Treatment[] => {
  return getTreatmentsByDisorder(disorderId).filter(t => t.type === 'primera_linea');
};

// Función para obtener TODOS los tratamientos disponibles
export const getAllTreatments = (): Treatment[] => {
  return Object.values(treatments);
};

// Función para verificar si un tratamiento es correcto para un trastorno
export const isTreatmentCorrectForDisorder = (treatmentId: string, disorderId: string): boolean => {
  const treatment = treatments[treatmentId as keyof typeof treatments];
  if (!treatment) return false;
  return treatment.targetDisorders.includes(disorderId) && treatment.type === 'primera_linea';
};
