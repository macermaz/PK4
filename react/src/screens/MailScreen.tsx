import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { generateUniquePatientSet, registerExistingPatients } from '../data/mockData';
import { Patient, Case } from '../types';
import { Swipeable } from 'react-native-gesture-handler';
import { disorders } from '../data/clinicalData';

type MailNavigationProp = StackNavigationProp<RootStackParamList, 'Mail'>;

// Tipos de correo
type MailType = 'case' | 'psykea' | 'system' | 'agency';
type CaseDifficulty = 'entrenamiento' | 'normal' | 'dificil' | 'realista';
type TabType = 'received' | 'sent';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  content: string;
  type: MailType;
  difficulty?: CaseDifficulty;
  patient?: Patient;
  isRead: boolean;
  timestamp: Date;
  isFromFamily?: boolean;
  agencyName?: string;
}

// Item enviado por caso
interface SentItem {
  id: string;
  type: 'test' | 'diagnosis' | 'treatment';
  name: string;
  details: string;
  timestamp: string;
  result?: string;
}

// Comentarios del secretario PSYKAT según contexto del caso
const getSecretaryComment = (patient: Patient, difficulty: string, isFromFamily: boolean): string => {
  const disorder = patient.disorder;
  const name = patient.name.split(' ')[0];

  // Comentarios específicos por situación
  const generalComments = [
    `PD: He puesto café nuevo en la sala de espera. Algo me dice que lo vas a necesitar.`,
    `PD: Por cierto, tu planta del despacho necesita agua. Las plantas también tienen sentimientos... creo.`,
    `PD: Recuerda que el BDI no es un test de personalidad de BuzzFeed, aunque a veces los pacientes crean que sí.`,
    `PD: Si ves que se complica, recuerda: respiración profunda y cara de póker. Funciona para los dos.`,
    `PD: He reorganizado tu agenda. De nada. Soy prácticamente tu Alfred pero sin el traje.`,
    `PD: El café de hoy está más fuerte. No preguntes, solo agradece.`,
    `PD: Según mi contador interno, llevas 3 días sin decir "transferencia" en voz alta. Estoy impresionado.`,
  ];

  const familyComments = [
    `PD: El familiar parecía genuinamente preocupado. O eso, o necesita terapia también (y no es descartable).`,
    `PD: Cuando llamó el familiar, hablamos 20 minutos. Te he ahorrado el 90% que no era relevante. De nada.`,
    `PD: Dato de color: el familiar mencionó que intentó "Google" primero. Spoiler: no funcionó.`,
    `PD: El familiar preguntó si "hay cura rápida". Le expliqué que esto no es como reiniciar un router.`,
  ];

  const difficultyComments: Record<string, string[]> = {
    'entrenamiento': [
      `PD: Este caso parece sencillo. Perfecto para estirar los músculos diagnósticos.`,
      `PD: Caso de libro de texto. Literalmente, página 47. (Es broma, pero casi.)`,
    ],
    'normal': [
      `PD: Caso estándar. Ni muy fácil ni muy "necesito supervisión urgente".`,
      `PD: Parece un caso normal. Claro que "normal" en psicología es un concepto filosófico.`,
      `PD: Este tiene buena pinta. De los que te hacen sentir competente.`,
    ],
    'dificil': [
      `PD: Este tiene pinta de requerir más de una sesión para orientarse. Prepara café.`,
      `PD: El DSM está en tu escritorio. Por si acaso. Sin presión.`,
      `PD: Caso interesante. Y por "interesante" me refiero a "complicado pero educativo".`,
      `PD: He dejado notas adhesivas extra en tu mesa. Tengo un presentimiento.`,
    ],
    'realista': [
      `PD: Este caso viene sin manual de instrucciones. Como la vida misma.`,
      `PD: He dejado chocolate en tu cajón. Para después. Confía en mí.`,
      `PD: Si Freud viera este caso, probablemente culparía a la madre. Pero nosotros somos más modernos, ¿verdad?`,
      `PD: Nivel de complejidad: "momento de demostrar que la carrera valió la pena".`,
    ],
  };

  const disorderComments: Record<string, string[]> = {
    'trastorno_depresivo_mayor': [
      `PD: Recuerda que la empatía es importante, pero mantén los límites. No podemos deprimirnos todos.`,
      `PD: Ya sabes lo que dicen: "La depresión miente". Y el marketing también, pero ese es otro tema.`,
      `PD: Ten pañuelos cerca. No por el paciente, por ti cuando veas la mejora. Soy optimista.`,
    ],
    'trastorno_ansiedad_generalizada': [
      `PD: Alerta: puede que ${name} llegue 30 minutos antes "por si acaso". Como yo con los vuelos.`,
      `PD: Spoiler: probablemente ya está preocupado por la próxima sesión antes de terminar esta.`,
      `PD: He quitado el reloj de la sala de espera. Contar los segundos no ayuda a nadie.`,
    ],
    'trastorno_panico': [
      `PD: He verificado que las salidas de emergencia estén visibles. Por si pregunta. Que preguntará.`,
      `PD: Tip: evita frases como "relájate". Funciona igual de bien que decirle a alguien enfadado que se calme.`,
      `PD: La puerta de tu despacho abre hacia afuera. Lo arreglé. No me preguntes cómo lo sé.`,
    ],
    'fobia_social': [
      `PD: Dato: ${name} reservó la cita por email. Llamar le daba ansiedad. Relatable, la verdad.`,
      `PD: Viene solo/a. Eso ya es un logro que no aparecerá en su CV pero debería.`,
      `PD: He bajado la intensidad de las luces. Crear ambiente, dicen.`,
    ],
    'trastorno_obsesivo_compulsivo': [
      `PD: Puede que llegue tarde. Tuvo que volver a comprobar que cerró el coche. Tres veces.`,
      `PD: He ordenado tu escritorio simétricamente. Por si acaso. Quién sabe qué nota.`,
      `PD: Los bolígrafos están a 90 grados de los lápices. No es casualidad.`,
    ],
    'trastorno_limite_personalidad': [
      `PD: Cabeza fría y límites claros. Y si idealiza o devalúa, no te lo tomes personal.`,
      `PD: Este caso requiere tu mejor versión de "presente pero neutral". Suerte.`,
      `PD: He guardado las tijeras decorativas. Por protocolo. Y porque eran feas de todos modos.`,
    ],
    'trastorno_bipolar_i': [
      `PD: He anotado en qué fase viene según el familiar. Pero ya sabes que puede cambiar.`,
      `PD: Si viene en fase alta, agarra bien el bolígrafo. Van a salir muchas ideas.`,
      `PD: Nota mental: verificar cumplimiento de medicación. De forma sutil, claro.`,
    ],
    'anorexia_nerviosa': [
      `PD: La báscula del baño "no funciona". Fue un accidente. Un accidente muy intencional.`,
      `PD: Viene porque "la obligaron". Prepárate para el argumento "estoy bien".`,
      `PD: He dejado agua en la sala. Solo agua. Sin comentarios.`,
    ],
    'trastorno_consumo_alcohol': [
      `PD: Dice que viene voluntariamente. Le creo con un asterisco.`,
      `PD: Ha prometido que no ha bebido hoy. Veremos qué dice el olfato.`,
      `PD: El familiar mencionó "solo bebe socialmente". Aparentemente es muy social.`,
    ],
  };

  // Seleccionar comentario apropiado
  const comments: string[] = [];

  // Añadir comentario de trastorno
  if (disorderComments[disorder]) {
    comments.push(...disorderComments[disorder]);
  }

  // Añadir comentario de dificultad
  if (difficultyComments[difficulty]) {
    comments.push(...difficultyComments[difficulty]);
  }

  // Añadir comentario de familia si aplica
  if (isFromFamily) {
    comments.push(...familyComments);
  }

  // Añadir comentarios generales
  comments.push(...generalComments);

  // Seleccionar uno al azar
  return comments[Math.floor(Math.random() * comments.length)];
};

// Saludos del secretario
const getSecretaryGreeting = (): string => {
  const greetings = [
    'Buenos días, doc',
    'Hola de nuevo',
    'Hey',
    'Buenos días',
    'Saludos',
    'Hola',
    'Buenas',
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

// Despedidas del secretario
const getSecretarySignoff = (): string => {
  const signoffs = [
    'PSYKAT (tu secretario virtual que merece un aumento)',
    'PSYKAT (café en la sala de espera)',
    'PSYKAT (aquí estaré, como siempre)',
    'PSYKAT',
    'PSYKAT (la máquina de café ya funciona)',
    'PSYKAT (el que nunca duerme, literalmente)',
    'PSYKAT (organizando tu caos desde 2024)',
  ];
  return signoffs[Math.floor(Math.random() * signoffs.length)];
};

// Descripciones según trastorno
const getMotiveByDisorder = (disorder: string, isFromFamily: boolean, difficulty: CaseDifficulty = 'normal'): string => {
  const familyPrefix = isFromFamily ? 'El familiar comenta que' : 'El paciente refiere que';

  const vagueMotives: string[] = [
    `${familyPrefix} no se encuentra bien últimamente y quiere hablar con un profesional.`,
    `${familyPrefix} ha notado que algo no está bien pero no sabe exactamente qué es.`,
    `${familyPrefix} necesita ayuda porque las cosas no van como deberían.`,
    `${familyPrefix} está pasando por una mala racha y cree que debería hablar con alguien.`,
    `${familyPrefix} siente que necesita orientación profesional.`,
  ];

  if (difficulty === 'dificil' || difficulty === 'realista') {
    return vagueMotives[Math.floor(Math.random() * vagueMotives.length)];
  }

  const motives: Record<string, string[]> = {
    'trastorno_depresivo_mayor': [
      `${familyPrefix} últimamente no tiene ganas de hacer nada, ha perdido interés en actividades que antes disfrutaba.`,
    ],
    'trastorno_ansiedad_generalizada': [
      `${familyPrefix} está constantemente preocupado/a por todo, no puede controlar los pensamientos negativos.`,
    ],
    'trastorno_panico': [
      `${familyPrefix} ha tenido varios episodios de miedo intenso repentino con palpitaciones y sensación de ahogo.`,
    ],
  };

  const defaultMotives = [
    `${familyPrefix} no se siente bien desde hace tiempo y necesita ayuda profesional.`,
  ];

  const availableMotives = motives[disorder] || defaultMotives;
  return availableMotives[Math.floor(Math.random() * availableMotives.length)];
};

// Generar correos iniciales
const generateInitialEmails = (existingPatientNames: string[] = []): Email[] => {
  registerExistingPatients(existingPatientNames);
  const uniquePatients = generateUniquePatientSet(4, existingPatientNames);
  const emails: Email[] = [];
  const now = new Date();

  // Bienvenida
  emails.push({
    id: 'welcome',
    from: 'Sistema PSYKAT',
    subject: 'Bienvenido a PSYKAT',
    preview: 'Tu consulta virtual está lista...',
    content: `¡Bienvenido a PSYKAT!\n\nTu consulta virtual está lista para recibir pacientes.\n\nRecuerda:\n- Cada sesión tiene 5 preguntas\n- Usa la Herramienta Diagnóstica para tests y diagnósticos\n- Los tratamientos tardan 2 días en mostrar resultados\n\n¡Buena suerte!`,
    type: 'system',
    isRead: false,
    timestamp: new Date(now.getTime() - 3600000),
  });

  // Casos
  const difficulties: CaseDifficulty[] = ['normal', 'dificil', 'realista'];
  const difficultyLabels: Record<CaseDifficulty, string> = {
    entrenamiento: '🟢 Entrenamiento',
    normal: '⚪ Normal',
    dificil: '🟡 Difícil',
    realista: '🔴 Realista',
  };

  difficulties.forEach((difficulty, index) => {
    if (uniquePatients[index]) {
      const patient = uniquePatients[index];
      const isFromFamily = Math.random() > 0.7;
      const familyIntro = isFromFamily
        ? `Me ha contactado un familiar de ${patient.name.split(' ')[0]} preocupado por su situación.`
        : `Ha llamado ${patient.name} directamente solicitando una cita.`;
      const motivoConsulta = getMotiveByDisorder(patient.disorder, isFromFamily, difficulty);
      const secretaryComment = getSecretaryComment(patient, difficulty, isFromFamily);

      emails.push({
        id: `case_${patient.id}_${difficulty}`,
        from: 'PSYKAT',
        subject: `Nuevo paciente: ${patient.name.split(' ').map(n => n[0]).join('.')}. [${difficultyLabels[difficulty]}]`,
        preview: motivoConsulta.substring(0, 60) + '...',
        content: `${getSecretaryGreeting()},\n\n${familyIntro}\n\nDatos del paciente:\n- Nombre: ${patient.name}\n- Edad: ${patient.age} años\n- Ocupación: ${patient.occupation}\n\nMotivo de consulta: ${motivoConsulta}\n\n${secretaryComment}\n\n${getSecretarySignoff()}`,
        type: 'case',
        difficulty,
        patient,
        isRead: false,
        isFromFamily,
        timestamp: new Date(now.getTime() - (index + 1) * 1800000),
      });
    }
  });

  // Entrenamiento
  if (uniquePatients[3]) {
    const trainingPatient = uniquePatients[3];
    emails.push({
      id: `training_${trainingPatient.id}`,
      from: 'Dr. Domingo',
      subject: '📚 Caso de entrenamiento disponible',
      preview: 'He preparado un caso de práctica para ti...',
      content: `Hola,\n\nHe preparado un caso de práctica para ti.\n\nPaciente de práctica:\n- Nombre: ${trainingPatient.name}\n- Edad: ${trainingPatient.age} años\n- Ocupación: ${trainingPatient.occupation}\n\nRecuerda que en el modo entrenamiento:\n- Tienes ayudas activas\n- El paciente es más abierto\n\nDr. Domingo`,
      type: 'case',
      difficulty: 'entrenamiento',
      patient: trainingPatient,
      isRead: false,
      timestamp: new Date(now.getTime() - 7200000),
    });
  }

  return emails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const MailScreen: React.FC = () => {
  const { state, dispatch, createNewCase } = useApp();
  const navigation = useNavigation<MailNavigationProp>();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    const existingPatientNames = state.cases.map(c => c.patient.name);
    const initialEmails = generateInitialEmails(existingPatientNames);
    setEmails(initialEmails);
  }, []);

  // Obtener items enviados por caso
  const getSentItemsByCase = (caseData: Case): SentItem[] => {
    const items: SentItem[] = [];

    // Tests aplicados
    caseData.testsResults?.forEach((test) => {
      items.push({
        id: `test_${test.testId}_${test.date}`,
        type: 'test',
        name: test.testName,
        details: `Puntuación: ${test.score}`,
        timestamp: test.date,
        result: test.interpretation,
      });
    });

    // Diagnóstico
    if (caseData.diagnosis) {
      const disorderInfo = disorders[caseData.diagnosis];
      items.push({
        id: `diagnosis_${caseData.id}`,
        type: 'diagnosis',
        name: disorderInfo?.name || caseData.diagnosis,
        details: caseData.diagnosisCorrect !== null
          ? (caseData.diagnosisCorrect ? '✓ Correcto' : '✗ Incorrecto')
          : 'Pendiente de resultado',
        timestamp: caseData.createdAt,
        result: disorderInfo?.description,
      });
    }

    // Tratamiento
    if (caseData.treatment) {
      items.push({
        id: `treatment_${caseData.id}`,
        type: 'treatment',
        name: 'Plan de Tratamiento',
        details: caseData.treatmentCorrect !== null
          ? (caseData.treatmentCorrect ? '✓ Efectivo' : '✗ No efectivo')
          : 'Esperando resultado',
        timestamp: caseData.treatmentSentDate || caseData.createdAt,
        result: caseData.treatment,
      });
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Casos con items enviados
  const casesWithSentItems = state.cases.filter(c =>
    (c.testsResults && c.testsResults.length > 0) || c.diagnosis || c.treatment
  );

  const openEmail = (email: Email) => {
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  const deleteEmail = (emailId: string) => {
    Alert.alert('Eliminar correo', '¿Estás seguro de eliminar este correo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setEmails(prev => prev.filter(e => e.id !== emailId)) },
    ]);
  };

  const addToContacts = (email: Email) => {
    if (!email.patient) return;
    const newCase = createNewCase(email.patient);
    const caseWithInfo = { ...newCase, difficulty: email.difficulty, isFromFamily: email.isFromFamily };
    dispatch({ type: 'ADD_CASE', payload: caseWithInfo });
    setEmails(prev => prev.filter(e => e.id !== email.id));
    setShowEmailModal(false);
    setSelectedEmail(null);
    navigation.navigate('Contacts');
  };

  const getDifficultyColor = (difficulty?: CaseDifficulty): string => {
    switch (difficulty) {
      case 'entrenamiento': return '#4CAF50';
      case 'normal': return '#9E9E9E';
      case 'dificil': return '#FF9800';
      case 'realista': return '#f44336';
      default: return '#4A90E2';
    }
  };

  const getEmailIcon = (email: Email): { name: string; color: string } => {
    switch (email.type) {
      case 'case': return { name: 'user-plus', color: getDifficultyColor(email.difficulty) };
      case 'psykea': return { name: 'shopping-cart', color: '#8B5CF6' };
      case 'agency': return { name: 'globe', color: '#00BCD4' };
      default: return { name: 'envelope', color: '#4A90E2' };
    }
  };

  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Hace un momento';
    if (hours < 24) return `Hace ${hours}h`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Render swipe action
  const renderRightActions = (emailId: string) => (
    <TouchableOpacity style={styles.deleteAction} onPress={() => deleteEmail(emailId)}>
      <Icon name="trash" size={20} color="white" />
      <Text style={styles.deleteText}>Eliminar</Text>
    </TouchableOpacity>
  );

  const renderEmailItem = ({ item }: { item: Email }) => {
    const icon = getEmailIcon(item);
    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity
          style={[styles.emailItem, !item.isRead && styles.emailUnread]}
          onPress={() => openEmail(item)}
        >
          {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: icon.color }]} />}
          <View style={[styles.emailIcon, { backgroundColor: icon.color + '20' }]}>
            <Icon name={icon.name} size={20} color={icon.color} />
          </View>
          <View style={styles.emailContent}>
            <View style={styles.emailHeader}>
              <Text style={[styles.emailFrom, !item.isRead && styles.textBold]} numberOfLines={1}>
                {item.from}
              </Text>
              <Text style={styles.emailTime}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={[styles.emailSubject, !item.isRead && styles.textBold]} numberOfLines={1}>
              {item.subject}
            </Text>
            <Text style={styles.emailPreview} numberOfLines={1}>{item.preview}</Text>
          </View>
          {item.type === 'case' && item.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
              <Text style={styles.difficultyText}>{item.difficulty.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Render case card for sent tab
  const renderCaseCard = ({ item }: { item: Case }) => {
    const sentItems = getSentItemsByCase(item);
    const isExpanded = selectedCaseId === item.id;

    return (
      <View style={styles.caseCard}>
        <TouchableOpacity
          style={styles.caseCardHeader}
          onPress={() => setSelectedCaseId(isExpanded ? null : item.id)}
        >
          <View style={styles.caseAvatar}>
            <Text style={styles.caseAvatarText}>{item.patient.avatar}</Text>
          </View>
          <View style={styles.caseInfo}>
            <Text style={styles.caseName}>{item.patient.name}</Text>
            <Text style={styles.caseStatus}>
              {sentItems.length} item{sentItems.length !== 1 ? 's' : ''} enviado{sentItems.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sentItemsList}>
            {sentItems.map((sentItem) => (
              <View key={sentItem.id} style={styles.sentItem}>
                <View style={[styles.sentItemIcon, {
                  backgroundColor: sentItem.type === 'test' ? '#2196F3' :
                    sentItem.type === 'diagnosis' ? '#9C27B0' : '#4CAF50'
                }]}>
                  <Icon
                    name={sentItem.type === 'test' ? 'clipboard' : sentItem.type === 'diagnosis' ? 'stethoscope' : 'medkit'}
                    size={14}
                    color="white"
                  />
                </View>
                <View style={styles.sentItemContent}>
                  <Text style={styles.sentItemName}>{sentItem.name}</Text>
                  <Text style={styles.sentItemDetails}>{sentItem.details}</Text>
                  <Text style={styles.sentItemTime}>{formatTime(sentItem.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Email Modal
  const EmailModal = () => {
    if (!selectedEmail) return null;
    return (
      <Modal visible={showEmailModal} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowEmailModal(false)}>
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          <LinearGradient colors={['#4A90E2', '#357abd']} style={styles.modalGradientHeader}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowEmailModal(false)}>
                <Icon name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Correo</Text>
              <View style={styles.placeholder} />
            </View>
          </LinearGradient>
          <ScrollView style={styles.modalContent}>
            <View style={styles.emailDetailHeader}>
              <Text style={styles.emailDetailFrom}>{selectedEmail.from}</Text>
              <Text style={styles.emailDetailSubject}>{selectedEmail.subject}</Text>
              <Text style={styles.emailDetailTime}>{selectedEmail.timestamp.toLocaleString('es-ES')}</Text>
            </View>
            <View style={styles.emailBody}>
              <Text style={styles.emailBodyText}>{selectedEmail.content}</Text>
            </View>
            {selectedEmail.type === 'case' && selectedEmail.patient && (
              <TouchableOpacity
                style={[styles.addContactButton, { backgroundColor: getDifficultyColor(selectedEmail.difficulty) }]}
                onPress={() => addToContacts(selectedEmail)}
              >
                <Icon name="user-plus" size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.addContactText}>Añadir a Contactos</Text>
              </TouchableOpacity>
            )}
            {selectedEmail.patient && (
              <View style={styles.patientCard}>
                <Text style={styles.patientCardTitle}>Información del paciente</Text>
                <View style={styles.patientInfo}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>{selectedEmail.patient.avatar}</Text>
                  </View>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{selectedEmail.patient.name}</Text>
                    <Text style={styles.patientMeta}>{selectedEmail.patient.age} años • {selectedEmail.patient.occupation}</Text>
                    {selectedEmail.isFromFamily && (
                      <View style={styles.familyBadge}>
                        <Icon name="users" size={12} color="#FF8C42" />
                        <Text style={styles.familyText}>Derivado por familiar</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <LinearGradient colors={['#4A90E2', '#357abd']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Correo</Text>
            {activeTab === 'received' && unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content */}
      <View style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'received' && styles.tabActive]}
            onPress={() => setActiveTab('received')}
          >
            <Icon name="inbox" size={16} color={activeTab === 'received' ? '#4A90E2' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
              Recibidos ({emails.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
            onPress={() => setActiveTab('sent')}
          >
            <Icon name="send" size={16} color={activeTab === 'sent' ? '#4A90E2' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
              Enviados ({casesWithSentItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on tab */}
        {activeTab === 'received' ? (
          <FlatList
            data={emails}
            keyExtractor={(item) => item.id}
            renderItem={renderEmailItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No hay correos nuevos</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={casesWithSentItems}
            keyExtractor={(item) => item.id}
            renderItem={renderCaseCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="paper-plane-o" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No has enviado nada aún</Text>
                <Text style={styles.emptySubtext}>Los tests, diagnósticos y tratamientos aparecerán aquí</Text>
              </View>
            }
          />
        )}
      </View>

      <EmailModal />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: 'transparent' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { padding: 8 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: 'white' },
  unreadBadge: { backgroundColor: '#FF3B30', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  unreadBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  headerButton: { padding: 8 },
  content: { flex: 1, backgroundColor: '#f8f9fa', borderTopLeftRadius: 25, borderTopRightRadius: 25 },

  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 15, marginTop: 15, borderRadius: 12, padding: 5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  tabActive: { backgroundColor: '#E3F2FD' },
  tabText: { fontSize: 14, color: '#666', marginLeft: 8, fontWeight: '500' },
  tabTextActive: { color: '#4A90E2', fontWeight: '600' },

  listContent: { paddingVertical: 15 },

  // Email Item
  emailItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', marginHorizontal: 15, marginVertical: 5, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  emailUnread: { backgroundColor: '#f0f7ff' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', left: 10, top: '50%' },
  emailIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emailContent: { flex: 1 },
  emailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  emailFrom: { fontSize: 14, color: '#666', flex: 1 },
  emailTime: { fontSize: 12, color: '#999' },
  emailSubject: { fontSize: 15, color: '#333', marginBottom: 2 },
  emailPreview: { fontSize: 13, color: '#999' },
  textBold: { fontWeight: '600' },
  difficultyBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  difficultyText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // Delete action
  deleteAction: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', width: 80, marginVertical: 5, marginRight: 15, borderRadius: 12 },
  deleteText: { color: 'white', fontSize: 12, marginTop: 4 },

  // Case card (sent tab)
  caseCard: { backgroundColor: 'white', marginHorizontal: 15, marginVertical: 5, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  caseCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  caseAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  caseAvatarText: { fontSize: 18 },
  caseInfo: { flex: 1 },
  caseName: { fontSize: 15, fontWeight: '600', color: '#333' },
  caseStatus: { fontSize: 13, color: '#666', marginTop: 2 },
  sentItemsList: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: 15, paddingBottom: 10 },
  sentItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  sentItemIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sentItemContent: { flex: 1 },
  sentItemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  sentItemDetails: { fontSize: 12, color: '#666', marginTop: 2 },
  sentItemTime: { fontSize: 11, color: '#999', marginTop: 4 },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 15 },
  emptySubtext: { fontSize: 13, color: '#bbb', marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },

  // Modal
  modalSafeArea: { flex: 1, backgroundColor: '#4A90E2' },
  modalGradientHeader: { paddingBottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, minHeight: 50 },
  closeButton: { padding: 12, marginLeft: -8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: 'white' },
  placeholder: { width: 42 },
  modalContent: { flex: 1, backgroundColor: '#f8f9fa' },
  emailDetailHeader: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderBottomWidth: 1, borderBottomColor: '#eee' },
  emailDetailFrom: { fontSize: 14, color: '#4A90E2', fontWeight: '600', marginBottom: 5 },
  emailDetailSubject: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 5 },
  emailDetailTime: { fontSize: 12, color: '#999' },
  emailBody: { backgroundColor: 'white', padding: 20, marginTop: 10 },
  emailBodyText: { fontSize: 16, lineHeight: 24, color: '#333' },
  addContactButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, paddingVertical: 15, borderRadius: 12 },
  buttonIcon: { marginRight: 10 },
  addContactText: { color: 'white', fontSize: 16, fontWeight: '600' },
  patientCard: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  patientCardTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 15 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  patientAvatarText: { color: 'white', fontSize: 18, fontWeight: '600' },
  patientDetails: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#333' },
  patientMeta: { fontSize: 14, color: '#666', marginTop: 2 },
  familyBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  familyText: { fontSize: 12, color: '#FF8C42', marginLeft: 5 },
});

export default MailScreen;
