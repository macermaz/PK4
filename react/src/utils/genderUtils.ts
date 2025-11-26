import { Gender } from '../types';

// Nombres femeninos comunes en español
const FEMININE_NAMES = [
  'maría', 'ana', 'carmen', 'isabel', 'dolores', 'pilar', 'teresa', 'rosa',
  'josefa', 'antonia', 'francisca', 'laura', 'marta', 'cristina', 'lucía',
  'paula', 'elena', 'raquel', 'sara', 'patricia', 'silvia', 'beatriz',
  'mónica', 'andrea', 'sandra', 'marina', 'natalia', 'claudia', 'julia',
  'alba', 'nuria', 'rocío', 'mercedes', 'angeles', 'montserrat', 'margarita',
  'amparo', 'consuelo', 'remedios', 'victoria', 'gloria', 'esperanza',
  'soledad', 'inmaculada', 'concepción', 'blanca', 'sofía', 'valentina',
  'daniela', 'alejandra', 'carla', 'adriana', 'gabriela', 'carolina',
  'camila', 'isabella', 'martina', 'valeria', 'emma', 'olivia', 'aitana',
  'lola', 'manuela', 'jimena', 'alma', 'eva', 'noa', 'luna', 'vera',
];

// Nombres masculinos comunes en español
const MASCULINE_NAMES = [
  'antonio', 'josé', 'manuel', 'francisco', 'juan', 'david', 'javier',
  'daniel', 'carlos', 'miguel', 'jesús', 'pedro', 'alejandro', 'fernando',
  'pablo', 'rafael', 'ángel', 'sergio', 'luis', 'jorge', 'alberto',
  'roberto', 'enrique', 'eduardo', 'ramón', 'víctor', 'andrés', 'raúl',
  'diego', 'iván', 'rubén', 'óscar', 'santiago', 'adrián', 'mario',
  'álvaro', 'gonzalo', 'marcos', 'martín', 'hugo', 'mateo', 'lucas',
  'nicolás', 'samuel', 'oliver', 'bruno', 'leo', 'izan', 'iker', 'marc',
  'héctor', 'guillermo', 'rodrigo', 'jaime', 'ignacio', 'tomás', 'ricardo',
];

/**
 * Detecta el género de un paciente basándose en su nombre
 */
export const detectPatientGender = (fullName: string): Gender => {
  const firstName = fullName.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (FEMININE_NAMES.includes(firstName)) {
    return 'feminine';
  }

  if (MASCULINE_NAMES.includes(firstName)) {
    return 'masculine';
  }

  // Heurísticas adicionales para nombres no listados
  // Nombres terminados en 'a' suelen ser femeninos (excepto algunos casos)
  const masculineExceptions = ['garcia', 'guzman', 'villa'];
  if (firstName.endsWith('a') && !masculineExceptions.includes(firstName)) {
    return 'feminine';
  }

  // Por defecto, asumimos masculino
  return 'masculine';
};

/**
 * Obtiene el artículo correcto según género
 */
export const getArticle = (gender: Gender, type: 'definite' | 'indefinite' = 'definite'): string => {
  if (type === 'definite') {
    return gender === 'feminine' ? 'la' : 'el';
  }
  return gender === 'feminine' ? 'una' : 'un';
};

/**
 * Obtiene el pronombre correcto según género
 */
export const getPronoun = (gender: Gender, type: 'subject' | 'object' = 'subject'): string => {
  if (type === 'subject') {
    return gender === 'feminine' ? 'ella' : 'él';
  }
  return gender === 'feminine' ? 'la' : 'lo';
};

/**
 * Obtiene el adjetivo en el género correcto
 * Ejemplo: getAdjective('preocupado', 'feminine') => 'preocupada'
 */
export const getAdjective = (adjective: string, gender: Gender): string => {
  if (gender === 'feminine') {
    // Convertir terminaciones masculinas a femeninas
    if (adjective.endsWith('o')) {
      return adjective.slice(0, -1) + 'a';
    }
    if (adjective.endsWith('or')) {
      return adjective + 'a';
    }
  }
  return adjective;
};

/**
 * Obtiene el título profesional según género
 */
export const getProfessionalTitle = (gender: Gender): string => {
  return gender === 'feminine' ? 'doctora' : 'doctor';
};

/**
 * Formatea una frase con el género correcto
 * Usa {el/la}, {un/una}, {o/a}, {él/ella}, {lo/la}
 */
export const formatWithGender = (template: string, gender: Gender): string => {
  return template
    .replace(/\{el\/la\}/g, getArticle(gender, 'definite'))
    .replace(/\{un\/una\}/g, getArticle(gender, 'indefinite'))
    .replace(/\{o\/a\}/g, gender === 'feminine' ? 'a' : 'o')
    .replace(/\{él\/ella\}/g, getPronoun(gender, 'subject'))
    .replace(/\{lo\/la\}/g, getPronoun(gender, 'object'))
    .replace(/\{doctor\/doctora\}/g, getProfessionalTitle(gender));
};

/**
 * Valida que un nombre de terapeuta sea apropiado
 */
export const isValidTherapistName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-záéíóúñü\s]+$/i.test(name.trim());
};
