import { Patient, PsykTokVideo, TestBattery, DSMData } from '../types';
import { generateRandomPatient, getDisordersByDifficulty } from './clinicalData';

// ============================================================================
// BACKSTORIES DETALLADOS POR TRASTORNO
// ============================================================================
export const detailedBackstories: Record<string, string[]> = {
  // TRASTORNOS DEPRESIVOS
  'trastorno_depresivo_mayor': [
    'Hace seis meses perdió su empleo de 15 años tras una reestructuración. Desde entonces, pasa la mayor parte del día en cama. Su pareja está preocupada porque ha dejado de ducharse regularmente y ya no cocina como antes le gustaba.',
    'Tras el nacimiento de su segundo hijo, comenzó a sentirse "desconectada" de su familia. Describe que ve la vida "a través de un cristal empañado". Su madre tuvo depresión y ella siempre temió heredarla.',
    'Era el motor de su grupo de amigos, organizaba viajes y quedadas. Después de una ruptura sentimental hace 4 meses, se ha ido aislando progresivamente. Sus amigos dicen que "ya no es el/la mismo/a".',
    'Profesor universitario que siempre fue apasionado de su trabajo. En los últimos meses ha empezado a cancelar clases, dice que "da igual si enseño o no, los estudiantes no aprenden nada útil". Ha perdido 8 kg sin proponérselo.',
  ],
  'distimia': [
    'Desde adolescente recuerda sentirse "diferente", como si llevara un peso invisible. Nunca ha tenido crisis graves, pero tampoco recuerda la última vez que se sintió genuinamente feliz. "Es mi forma de ser", dice resignado/a.',
    'Trabaja, cumple, pero todo le cuesta el doble. Sus compañeros la ven como "seria" o "reservada", pero por dentro siente un vacío constante que ningún logro llena. Lleva así más de 3 años.',
    'Viene porque su nueva pareja le ha dicho que parece "incapaz de disfrutar nada". Reconoce que siempre ha sido pesimista, pero pensaba que era "realismo". Sus padres también eran "personas grises".',
  ],

  // TRASTORNOS DE ANSIEDAD
  'trastorno_ansiedad_generalizada': [
    'Desde que tiene uso de razón, se preocupa "por todo y por nada". De niño/a, sus padres lo/a llamaban "el/la pequeño/a adulto/a" porque siempre anticipaba problemas. Ahora, con 35 años, no puede relajarse ni en vacaciones.',
    'Ejecutiva de éxito que revisa compulsivamente sus correos a las 3am. Tiene insomnio de conciliación porque su mente no para de darle vueltas a posibles escenarios catastróficos laborales y familiares.',
    'Madre de dos niños que siente que "algo malo va a pasar" constantemente. Ha empezado a restringir las actividades de sus hijos por miedo a accidentes. Su marido dice que está "agotando a toda la familia".',
    'Autónomo que ha desarrollado tensión cervical crónica por el estrés. Describe que su cabeza es "como una radio que no se apaga nunca". Toma medicación para dormir pero se despierta igual de tenso.',
  ],
  'trastorno_panico': [
    'El primer ataque ocurrió hace 6 meses en el metro. Pensó que se moría. Desde entonces evita el transporte público, los ascensores y las multitudes. Ha dejado de ir al cine con su pareja.',
    'Médico de urgencias que tuvo su primer ataque de pánico atendiendo una emergencia. Ahora tiene miedo de volver a trabajar porque "no puede perder el control delante de los pacientes".',
    'Antes era "la aventurera" del grupo. Desde el primer ataque en un avión hace un año, ha cancelado tres viajes y rechazado un ascenso que implicaba viajar. Vive con miedo constante a "que vuelva a pasar".',
  ],
  'fobia_social': [
    'Brillante programador que ha rechazado promociones porque implican presentar proyectos. En las reuniones siente que todos le miran y juzgan. A veces se inventa excusas para no asistir.',
    'Estudiante universitaria que ha cambiado de carrera dos veces para evitar las exposiciones orales. Dice que prefiere suspender antes que hablar delante de la clase. Come sola en la biblioteca.',
    'Desde el instituto tiene "fobia a las quedadas grupales". Puede hablar uno a uno, pero en grupo se bloquea, se ruboriza y tartamudea. Ha rechazado ir a la boda de su mejor amigo como padrino.',
  ],
  'agorafobia': [
    'Hace dos años no salía de casa sin su marido. Ahora ni siquiera puede quedarse sola en casa. La última vez que lo intentó, tuvo que llamar a emergencias creyendo que le daba un infarto.',
    'Dejó su trabajo porque el trayecto en autobús se volvió imposible. Ahora pide todo a domicilio y solo sale al jardín. Su madre viene a hacerle la compra cada semana.',
    'Exatleta que tras una lesión empezó a tener ataques de pánico en espacios abiertos. Paradójicamente, ahora los gimnasios cerrados también le dan miedo. "Me he quedado sin sitios seguros".',
  ],

  // TRAUMA
  'tept': [
    'Superviviente de un accidente de tráfico hace 8 meses donde falleció su copiloto. No ha vuelto a conducir, tiene pesadillas cada noche y se sobresalta con cualquier frenazo en la calle.',
    'Exmilitar que participó en misiones en zona de conflicto. Lleva 2 años de vuelta pero sigue "en alerta". Su pareja dice que grita dormido y que a veces "no está presente" aunque esté en la habitación.',
    'Víctima de un atraco violento hace un año. Desde entonces, no sale de noche, ha cambiado de barrio y aun así siente que "le siguen". Tiene flashbacks del cuchillo cada vez que ve uno en la cocina.',
    'Enfermera de UCI durante la pandemia que vio morir a decenas de pacientes. Desarrolló insomnio, irritabilidad y empezó a beber para "desconectar". Ha pedido la baja porque "no puede volver a esa planta".',
  ],
  'trastorno_estres_agudo': [
    'Hace 3 semanas presenció un accidente laboral grave. Desde entonces no duerme, tiene flashbacks constantes y se siente "irreal", como si todo fuera una película.',
    'Le robaron con violencia hace 10 días. No ha podido volver al trabajo, se sobresalta con cualquier ruido y tiene pesadillas cada noche. Su familia dice que "ya no es el/la mismo/a".',
  ],

  // TOC
  'trastorno_obsesivo_compulsivo': [
    'Dedica 3 horas diarias a rituales de lavado de manos. Tiene la piel agrietada y sangrante. Sabe que es irracional pero si no lo hace, la ansiedad es insoportable. Ha dejado de trabajar.',
    'Comprueba que ha cerrado la puerta 37 veces exactas antes de irse a dormir. Si pierde la cuenta, empieza de nuevo. Su pareja duerme en otra habitación porque el ritual les despertaba a ambos.',
    'Profesora que no puede tocar nada que hayan tocado sus alumnos. Usa guantes todo el día y se cambia de ropa al llegar a casa. Sus pensamientos intrusivos son sobre contaminar a su bebé.',
    'Tiene pensamientos terribles sobre hacer daño a sus seres queridos. Sabe que nunca lo haría, pero la culpa y el miedo le consumen. Ha escondido todos los cuchillos de casa "por si acaso".',
  ],

  // TRASTORNOS ALIMENTARIOS
  'anorexia_nerviosa': [
    'Bailarina de 19 años que pesa 42 kg con 1.68m. Dice que "aún le sobra" y hace 4 horas de ejercicio diario. Su madre la ha traído porque se desmayó en clase.',
    'Estudiante de medicina que empezó a restringir "para estar más concentrado/a". Ahora come 500 calorías al día, tiene amenorrea y se marea al levantarse. Cuenta cada caloría obsesivamente.',
    'Tras comentarios sobre su peso en la adolescencia, empezó a hacer dietas. Ahora, con 25 años, pesa lo mismo que a los 12. Su novio amenaza con dejarla si no busca ayuda.',
  ],
  'bulimia_nerviosa': [
    'Por fuera parece "perfecta": delgada, exitosa, sonriente. Por dentro, tiene atracones nocturnos seguidos de vómitos que le han destrozado el esmalte dental. Lleva 5 años ocultándolo.',
    'Modelo que mantiene su peso mediante purgas después de cada sesión de fotos donde "tiene que comer algo". Tiene callos en los nudillos y evita las revisiones dentales.',
    'Chef que prueba todo lo que cocina y después "lo compensa". Sus compañeros no sospechan nada. Pasa hambre todo el día para poder "permitirse" los atracones nocturnos.',
  ],
  'trastorno_atracon': [
    'Come grandes cantidades cuando está solo/a, a escondidas, rápidamente y hasta sentir dolor. Después siente vergüenza y culpa. Ha ganado 30 kg en un año pero no se purga.',
    'Desde la infancia usaba la comida como consuelo. Ahora es su principal forma de gestionar cualquier emoción. Come sin hambre, sin control, y después se odia por ello.',
  ],

  // TRASTORNOS DE PERSONALIDAD
  'trastorno_limite_personalidad': [
    'Sus relaciones son un "todo o nada". Idealiza a sus parejas y después las devalúa. Tiene cicatrices en los brazos de cuando "necesitaba sentir algo". Su expediente incluye 3 ingresos por autolesiones.',
    'Dice que se siente "vacía" constantemente. Cambia de trabajo, de pareja, de ciudad buscando "algo" que llene ese hueco. Tiene miedo intenso al abandono y hace lo imposible por evitarlo.',
    'Identidad difusa: no sabe quién es ni qué quiere. Sus emociones van de 0 a 100 en segundos. Ha tenido gestos suicidas cuando sus parejas han intentado dejarla.',
  ],
  'trastorno_narcisista_personalidad': [
    'Viene porque "su esposa le ha obligado". Dice que ella no le entiende y que es "demasiado sensible". En el trabajo le han despedido por "conflictos con compañeros que le tenían envidia".',
    'Empresario que no entiende por qué su tercer matrimonio ha fracasado. Describe a sus ex como "incapaces de estar a su altura". Interrumpe constantemente y corrige al terapeuta.',
    'Cirujano exitoso que desprecia a los residentes "mediocres". Tiene problemas con el equipo porque "solo él sabe hacer las cosas bien". Viene porque le han obligado tras quejas formales.',
  ],
  'trastorno_evitativo': [
    'A sus 40 años nunca ha tenido pareja. Rechaza invitaciones sociales por miedo al rechazo. En el trabajo es competente pero invisible: nunca pide ascensos ni participa en reuniones.',
    'Quiere tener amigos pero está convencida de que "no le caerá bien a nadie". Ensaya mentalmente cada conversación y después se critica por "haberlo hecho mal". Vive aislada.',
  ],
  'trastorno_obsesivo_personalidad': [
    'Abogado perfeccionista que revisa los contratos 20 veces. Nunca delega porque "nadie lo hace bien". Su vida personal es inexistente porque "el trabajo es lo primero".',
    'Tiene listas para todo: listas de tareas, listas de listas. No puede tirar nada "por si acaso". Su casa está ordenada milimétricamente pero no puede disfrutar de ella por estar siempre limpiando.',
  ],

  // TRASTORNOS BIPOLARES
  'trastorno_bipolar_i': [
    'En su último episodio maníaco gastó 50.000€ en "inversiones seguras", dejó su trabajo para "montar un imperio" y durmió 2 horas diarias durante 3 semanas. Ahora está en depresión profunda y arrepentido.',
    'Artista que en sus fases "altas" produce obras geniales pero también conductas de riesgo: sexo sin protección, conducción temeraria, peleas. Las depresiones le dejan semanas sin poder levantarse.',
    'Empresaria que en manía fundó 3 empresas en un mes, todas fracasadas. Su familia ha tenido que intervenir legalmente para proteger su patrimonio. No tiene conciencia de enfermedad.',
  ],
  'trastorno_bipolar_ii': [
    'Tiene depresiones recurrentes que responden mal a antidepresivos. Mirando atrás, identifica épocas donde dormía poco, trabajaba mucho y "estaba eufórica" sin consecuencias graves.',
    'Escritor que describe épocas donde "las ideas fluyen" y escribe 12 horas seguidas. Después vienen meses donde no puede ni leer. Nunca ha tenido una manía franca.',
  ],
  'ciclotimia': [
    'Desde adolescente tiene "altibajos" constantes. Semanas donde es el alma de la fiesta y semanas donde cancela todos los planes. Sus amigos dicen que "nunca saben qué versión va a aparecer".',
  ],

  // SUSTANCIAS
  'trastorno_consumo_alcohol': [
    'Empezó bebiendo "socialmente" pero ahora necesita alcohol para funcionar. Bebe a escondidas en el trabajo, ha tenido temblores matutinos y su hígado está afectado. Niega tener un problema.',
    'Viudo desde hace 2 años que empezó a beber para dormir. Ahora bebe una botella de vino diaria y no puede pasar un día sin alcohol. Ha perdido la custodia parcial de sus hijos.',
    'Ejecutiva que bebe "para socializar" pero no puede parar una vez empieza. Ha tenido lagunas de memoria y comportamientos que no recuerda. Su familia ha hecho una intervención.',
  ],
  'trastorno_consumo_sustancias': [
    'Empezó con cannabis recreativo, pasó a cocaína "para rendir en el trabajo" y ahora combina varias sustancias. Ha perdido su empleo, su pareja y está endeudado.',
    'Adolescente que empezó con porros y ha probado MDMA, ketamina y alucinógenos. Sus padres le traen porque ha dejado los estudios y pasa las noches fuera.',
  ],

  // TRASTORNOS PSICÓTICOS
  'esquizofrenia': [
    'Primer episodio a los 22 años en la universidad. Empezó a creer que le espiaban a través del móvil y que sus compañeros conspiraban contra él. Ahora, con medicación, vive estable pero aislado.',
    'Escucha voces que le critican y le ordenan hacer cosas. A veces les contesta en voz alta. Ha tenido varios ingresos porque deja la medicación "cuando se siente bien".',
    'Desde hace años vive en un mundo paralelo con creencias muy elaboradas sobre misiones secretas. Su familia se ha adaptado a "seguirle la corriente" pero él/ella vive desconectado de la realidad.',
  ],
  'trastorno_esquizoafectivo': [
    'Tiene episodios donde se mezclan síntomas psicóticos (voces, delirios) con depresiones profundas o fases de euforia. Es difícil distinguir qué síntomas predominan en cada momento.',
  ],
};

// ============================================================================
// SALUDOS CONTEXTUALES POR TRASTORNO
// ============================================================================
export const greetingsByDisorder: Record<string, string[]> = {
  'trastorno_depresivo_mayor': [
    "Hola... perdona, estoy un poco cansado/a. No he dormido bien.",
    "Buenos días, doctor/a. Gracias por verme, aunque no sé si sirve de algo.",
    "Hola. Mi familia me ha obligado a venir, yo creo que no tiene solución.",
    "Gracias por la cita... aunque me ha costado mucho salir de casa hoy.",
  ],
  'distimia': [
    "Hola, doctor/a. Vengo porque me lo han recomendado, aunque siempre he sido así.",
    "Buenos días. No sé muy bien qué esperar, nunca me he sentido diferente.",
    "Hola. Mi pareja dice que debería ser más feliz, pero no sé cómo.",
  ],
  'trastorno_ansiedad_generalizada': [
    "Hola, perdone si llego justo, estaba comprobando que había cerrado bien el coche.",
    "Buenos días, doctor/a. Llevaba toda la semana preocupado/a por esta cita.",
    "Hola. Necesito ayuda, no puedo seguir así de estresado/a todo el tiempo.",
  ],
  'trastorno_panico': [
    "Hola... ¿está bien la ventilación aquí? Perdone, es que los espacios cerrados...",
    "Buenos días. Casi no vengo, me ha dado algo parecido a un ataque en el coche.",
    "Gracias por recibirme. ¿Tiene agua? A veces me mareo cuando estoy nervioso/a.",
  ],
  'fobia_social': [
    "Hola... [voz baja] perdone, me cuesta un poco hablar con gente nueva.",
    "Buenos días. Me ha costado mucho decidirme a venir, la verdad.",
    "[ruborizado/a] Hola, doctor/a. Espero no decir nada raro.",
  ],
  'agorafobia': [
    "Hola, doctor/a. He venido acompañado/a porque solo no/no puedo.",
    "Buenos días. Es la primera vez que salgo de casa en semanas.",
    "Gracias por recibirme. ¿Puedo sentarme cerca de la puerta?",
  ],
  'tept': [
    "Hola. [mirando alrededor] ¿Hay más gente en la consulta?",
    "Buenos días, doctor/a. Perdone si estoy un poco tenso/a.",
    "[sobresaltándose con un ruido] Hola... lo siento, estoy muy nervioso/a últimamente.",
  ],
  'trastorno_obsesivo_compulsivo': [
    "Hola, doctor/a. Perdone, ¿puedo usar gel antes de darle la mano?",
    "Buenos días. Disculpe si tardo, tenía que hacer algo antes de entrar.",
    "Hola. [tocando la puerta varias veces] Ya estoy, perdone.",
  ],
  'anorexia_nerviosa': [
    "Hola. Me han obligado a venir, yo estoy bien.",
    "Buenos días, doctor/a. No sé qué quieren que le diga, como normal.",
    "Hola... [visiblemente delgado/a] Vengo porque mi madre insiste.",
  ],
  'bulimia_nerviosa': [
    "Hola, doctor/a. Nadie sabe que estoy aquí, necesito discreción.",
    "Buenos días. Tengo un problema que me da mucha vergüenza contar.",
    "Hola. He tardado años en decidirme a buscar ayuda.",
  ],
  'trastorno_limite_personalidad': [
    "Hola, doctor/a. Espero que usted sí me entienda, los anteriores no sirvieron de nada.",
    "Buenos días. [emocionalmente intensa] Necesito que me ayude, estoy desesperada.",
    "Hola. No sé por dónde empezar, mi vida es un caos.",
  ],
  'trastorno_narcisista_personalidad': [
    "Hola. Vengo porque mi esposa dice que tengo que cambiar, aunque yo creo que el problema es ella.",
    "Buenos días. He tenido psicólogos antes pero ninguno estaba a mi nivel.",
    "Hola, doctor/a. Espero que esto sea diferente, no me gusta perder el tiempo.",
  ],
  'trastorno_bipolar_i': [
    "[si depresión] Hola... perdone, me cuesta hasta hablar hoy.",
    "[si eutimia] Buenos días, doctor/a. Estoy aquí para el seguimiento.",
    "[si hipomanía] ¡Hola! Tengo muchas cosas que contarle, he tenido ideas geniales.",
  ],
  'trastorno_consumo_alcohol': [
    "Hola, doctor/a. Vengo porque mi familia me ha dado un ultimátum.",
    "Buenos días. Yo controlo, pero dicen que tengo un problema.",
    "Hola. [temblor leve] No he bebido hoy, se lo juro.",
  ],
  'esquizofrenia': [
    "Hola, doctor/a. [mirando alrededor] ¿Podemos hablar en privado?",
    "Buenos días. Las voces me dijeron que viniera.",
    "Hola. Mi familia me ha traído, yo estoy bien.",
  ],
};

// ============================================================================
// FUNCIÓN MEJORADA PARA GENERAR PACIENTES
// ============================================================================
export const generatePatientForDifficulty = (
  difficulty: 'entrenamiento' | 'normal' | 'dificil' | 'realista',
  seed?: number
): Patient => {
  const availableDisorders = getDisordersByDifficulty(difficulty);
  const randomSeed = seed ?? Date.now();
  const randomDisorder = availableDisorders[Math.floor(Math.abs(Math.sin(randomSeed) * availableDisorders.length))];
  const patientInfo = generateRandomPatient(randomSeed);

  // Obtener backstory específico del trastorno
  const backstories = detailedBackstories[randomDisorder.id] || [
    `Paciente que presenta síntomas compatibles con ${randomDisorder.name}. Acude derivado por su médico de atención primaria.`
  ];
  const selectedBackstory = backstories[Math.floor(Math.abs(Math.sin(randomSeed + 5)) * backstories.length)];

  return {
    id: `patient_${randomSeed}`,
    name: patientInfo.name,
    gender: patientInfo.gender,
    age: patientInfo.age,
    occupation: patientInfo.occupation,
    avatar: patientInfo.avatar,
    symptoms: randomDisorder.symptoms.slice(0, Math.min(5, randomDisorder.symptoms.length)),
    disorder: randomDisorder.id,
    personality: ['colaborativo', 'reservado', 'ansioso', 'defensivo', 'emocional'][Math.floor(Math.abs(Math.sin(randomSeed + 10)) * 5)],
    backstory: selectedBackstory,
    rapport: Math.floor(40 + Math.abs(Math.sin(randomSeed + 20)) * 40),
  };
};

// Pacientes predefinidos para compatibilidad (ahora generados dinámicamente)
export const mockPatients: Patient[] = [
  generatePatientForDifficulty('entrenamiento', 1001),
  generatePatientForDifficulty('entrenamiento', 1002),
  generatePatientForDifficulty('normal', 1003),
  generatePatientForDifficulty('normal', 1004),
  generatePatientForDifficulty('dificil', 1005),
  generatePatientForDifficulty('dificil', 1006),
  generatePatientForDifficulty('realista', 1007),
  generatePatientForDifficulty('realista', 1008),
];

// ============================================================================
// GENERACIÓN DE PACIENTES ÚNICOS (SIN REPETICIÓN)
// ============================================================================

// Conjunto de seeds ya usados para evitar repetición
let usedSeeds: Set<number> = new Set();
let usedNames: Set<string> = new Set();

// Resetear el tracking de pacientes (útil al iniciar nueva sesión)
export const resetPatientTracking = () => {
  usedSeeds = new Set();
  usedNames = new Set();
};

// Registrar pacientes existentes (para evitar repetir con casos activos)
export const registerExistingPatients = (patientNames: string[]) => {
  patientNames.forEach(name => usedNames.add(name.toLowerCase()));
};

// Generar un paciente único sin repetir nombres
export const generateUniquePatient = (
  difficulty: 'entrenamiento' | 'normal' | 'dificil' | 'realista',
  existingPatientNames: string[] = []
): Patient => {
  // Registrar nombres existentes
  existingPatientNames.forEach(name => usedNames.add(name.toLowerCase()));

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Generar seed único basado en tiempo + random
    const seed = Date.now() + Math.floor(Math.random() * 1000000) + attempts;

    // Evitar seeds repetidos
    if (usedSeeds.has(seed)) {
      attempts++;
      continue;
    }

    // Generar paciente con este seed
    const patient = generatePatientForDifficulty(difficulty, seed);

    // Verificar que el nombre no esté usado
    if (!usedNames.has(patient.name.toLowerCase())) {
      // Marcar como usado
      usedSeeds.add(seed);
      usedNames.add(patient.name.toLowerCase());
      return patient;
    }

    attempts++;
  }

  // Si fallamos muchas veces, generar con seed muy aleatorio (fallback)
  const fallbackSeed = Date.now() * Math.random() * 1000;
  const patient = generatePatientForDifficulty(difficulty, fallbackSeed);
  usedSeeds.add(fallbackSeed);
  usedNames.add(patient.name.toLowerCase());
  return patient;
};

// Generar múltiples pacientes únicos para emails
export const generateUniquePatientSet = (
  count: number,
  existingPatientNames: string[] = []
): Patient[] => {
  const patients: Patient[] = [];
  const difficulties: Array<'entrenamiento' | 'normal' | 'dificil' | 'realista'> = [
    'normal', 'dificil', 'realista', 'entrenamiento'
  ];

  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[i % difficulties.length];
    const patient = generateUniquePatient(difficulty, [
      ...existingPatientNames,
      ...patients.map(p => p.name)
    ]);
    patients.push(patient);
  }

  return patients;
};

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