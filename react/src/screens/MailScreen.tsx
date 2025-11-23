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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { mockPatients } from '../data/mockData';
import { Patient } from '../types';

type MailNavigationProp = StackNavigationProp<RootStackParamList, 'Mail'>;

// Tipos de correo
type MailType = 'case' | 'psykea' | 'system' | 'agency';
type CaseDifficulty = 'entrenamiento' | 'normal' | 'dificil' | 'realista';

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

// Nombres de agencias para modo histórico
const historicalAgencies = [
  { name: 'C.A.T.', fullName: 'Comisión de Atención Temporal' },
  { name: 'C.A.U.P.', fullName: 'Comisión de Ayuda Universal Paralela' },
  { name: 'A.R.C.A.', fullName: 'Agencia de Rescate de Casos Atípicos' },
  { name: 'Portal Psi', fullName: 'Derivaciones Interdimensionales' },
  { name: 'Archivo Omega', fullName: 'Casos Clasificados de Otras Realidades' },
  { name: 'Nexus', fullName: 'Conexión con Líneas Temporales Alternativas' },
];

// Descripciones personalizadas según el trastorno del paciente
const getMotiveByDisorder = (disorder: string, isFromFamily: boolean): string => {
  const familyPrefix = isFromFamily ? 'El familiar comenta que' : 'El paciente refiere que';

  const motives: Record<string, string[]> = {
    // Trastornos depresivos
    'trastorno_depresivo_mayor': [
      `${familyPrefix} últimamente no tiene ganas de hacer nada, ha perdido interés en actividades que antes disfrutaba y se siente triste la mayor parte del día.`,
      `${familyPrefix} lleva semanas sintiéndose vacío/a, con problemas para dormir y sin energía para las tareas cotidianas.`,
      `${familyPrefix} ha notado cambios importantes en el apetito, dificultad para concentrarse y pensamientos negativos recurrentes.`,
    ],
    'distimia': [
      `${familyPrefix} lleva años sintiéndose "gris", sin llegar a estar muy mal pero tampoco bien. Es como una tristeza de fondo constante.`,
      `${familyPrefix} desde que recuerda siempre ha tenido un ánimo bajo, aunque puede funcionar en el día a día.`,
    ],
    // Trastornos de ansiedad
    'trastorno_ansiedad_generalizada': [
      `${familyPrefix} está constantemente preocupado/a por todo, no puede controlar los pensamientos negativos y siente tensión muscular frecuente.`,
      `${familyPrefix} tiene dificultad para relajarse, problemas de sueño por preocupaciones excesivas y sensación de estar siempre "en alerta".`,
    ],
    'trastorno_panico': [
      `${familyPrefix} ha tenido varios episodios de miedo intenso repentino con palpitaciones, sudoración y sensación de ahogo.`,
      `${familyPrefix} vive con miedo a que le vuelva a dar "eso" y evita lugares donde antes le pasó.`,
    ],
    'fobia_social': [
      `${familyPrefix} evita situaciones sociales por miedo a ser juzgado/a, se pone muy nervioso/a al hablar con desconocidos.`,
      `${familyPrefix} tiene mucha ansiedad antes de eventos sociales y a veces se ruboriza o le tiemblan las manos.`,
    ],
    'agorafobia': [
      `${familyPrefix} evita salir de casa, ir a sitios con mucha gente o usar transporte público por miedo a no poder escapar.`,
      `${familyPrefix} necesita estar acompañado/a para salir y siente pánico en espacios abiertos o cerrados.`,
    ],
    // Trauma
    'tept': [
      `${familyPrefix} desde un evento traumático tiene pesadillas recurrentes, flashbacks y evita cualquier cosa que le recuerde a lo ocurrido.`,
      `${familyPrefix} está muy sobresaltado/a, tiene problemas para dormir y reacciona de forma exagerada ante ruidos o situaciones.`,
    ],
    'trastorno_estres_agudo': [
      `${familyPrefix} hace poco pasó algo muy grave y desde entonces no puede dormir, tiene recuerdos intrusivos y se siente "desconectado/a".`,
    ],
    // TOC
    'trastorno_obsesivo_compulsivo': [
      `${familyPrefix} tiene pensamientos repetitivos que le angustian y necesita hacer ciertos rituales para sentirse tranquilo/a.`,
      `${familyPrefix} pasa mucho tiempo lavándose las manos, comprobando cosas o repitiendo acciones y sabe que es excesivo pero no puede parar.`,
    ],
    // Trastornos alimentarios
    'anorexia_nerviosa': [
      `${familyPrefix} ha perdido mucho peso, está muy preocupado/a por engordar y restringe severamente la comida.`,
      `${familyPrefix} se ve gordo/a a pesar de estar muy delgado/a y hace ejercicio excesivo.`,
    ],
    'bulimia_nerviosa': [
      `${familyPrefix} tiene episodios donde come mucho de golpe y después se provoca el vómito o usa laxantes.`,
      `${familyPrefix} está muy preocupado/a por su peso y tiene una relación complicada con la comida.`,
    ],
    'trastorno_atracon': [
      `${familyPrefix} tiene episodios frecuentes de comer grandes cantidades sin control, seguidos de culpa intensa.`,
    ],
    // Trastornos de personalidad
    'trastorno_limite_personalidad': [
      `${familyPrefix} tiene relaciones muy intensas que pasan de la idealización al desprecio, cambios de humor bruscos y miedo al abandono.`,
      `${familyPrefix} a veces se hace daño cuando está muy mal emocionalmente y tiene una imagen de sí mismo/a muy inestable.`,
    ],
    'trastorno_narcisista_personalidad': [
      `${familyPrefix} tiene conflictos frecuentes porque siente que los demás no le valoran como merece y reacciona mal a las críticas.`,
      `${familyPrefix} necesita mucha admiración de los demás y a veces le cuesta empatizar con otros.`,
    ],
    'trastorno_evitativo': [
      `${familyPrefix} evita cualquier situación donde pueda ser rechazado/a, se siente muy inferior a los demás y tiene pocos amigos.`,
    ],
    'trastorno_obsesivo_personalidad': [
      `${familyPrefix} es extremadamente perfeccionista, le cuesta delegar y se enfoca tanto en los detalles que no termina las cosas.`,
    ],
    // Trastornos bipolares
    'trastorno_bipolar_i': [
      `${familyPrefix} ha tenido períodos donde dormía muy poco, gastaba mucho dinero, hablaba rapidísimo y se sentía capaz de todo, seguidos de caídas profundas.`,
      `${familyPrefix} pasa de estar eufórico/a con mucha energía a estar muy deprimido/a sin razón aparente.`,
    ],
    'trastorno_bipolar_ii': [
      `${familyPrefix} tiene depresiones recurrentes y a veces períodos de más energía y menos sueño, aunque no tan extremos.`,
    ],
    'ciclotimia': [
      `${familyPrefix} tiene altibajos emocionales constantes desde hace años, aunque nunca llegan a ser muy graves.`,
    ],
    // Sustancias
    'trastorno_consumo_alcohol': [
      `${familyPrefix} bebe más de lo que quisiera, ha intentado dejarlo sin éxito y el alcohol le está causando problemas.`,
      `${familyPrefix} necesita beber cada vez más para sentir el mismo efecto y tiene síntomas cuando no bebe.`,
    ],
    'trastorno_consumo_sustancias': [
      `${familyPrefix} el consumo de sustancias le está afectando en el trabajo, la familia y la salud pero no puede dejarlo.`,
    ],
    // Psicóticos
    'esquizofrenia': [
      `${familyPrefix} escucha voces que otros no escuchan, tiene ideas muy extrañas y a veces parece desconectado/a de la realidad.`,
      `${familyPrefix} ha dejado de cuidar su higiene, habla solo/a y dice cosas que no tienen sentido.`,
    ],
    'trastorno_esquizoafectivo': [
      `${familyPrefix} además de los cambios de ánimo, a veces tiene experiencias muy extrañas como escuchar voces o creer cosas imposibles.`,
    ],
  };

  const defaultMotives = [
    `${familyPrefix} no se siente bien desde hace tiempo, tiene dificultades para funcionar en su día a día y necesita ayuda profesional.`,
    `${familyPrefix} ha notado cambios importantes en su estado de ánimo y comportamiento que le preocupan.`,
    `${familyPrefix} está pasando por un momento difícil y siente que necesita apoyo psicológico.`,
  ];

  const availableMotives = motives[disorder] || defaultMotives;
  return availableMotives[Math.floor(Math.random() * availableMotives.length)];
};

// Generar correos iniciales
const generateInitialEmails = (patients: Patient[]): Email[] => {
  const emails: Email[] = [];
  const now = new Date();

  // Correo de bienvenida del sistema
  emails.push({
    id: 'welcome',
    from: 'Sistema PSYKAT',
    subject: 'Bienvenido a PSYKAT',
    preview: 'Tu consulta virtual está lista...',
    content: `¡Bienvenido a PSYKAT!

Tu consulta virtual está lista para recibir pacientes. El Dr. PSYKAT te derivará casos según tu nivel de experiencia.

Recuerda:
- Cada sesión tiene 5 preguntas
- Usa las herramientas de diagnóstico sabiamente
- Los tratamientos tardan 2 días en mostrar resultados

¡Buena suerte!`,
    type: 'system',
    isRead: false,
    timestamp: new Date(now.getTime() - 3600000),
  });

  // Correos de casos (3 mínimo: normal, difícil, realista)
  const difficulties: CaseDifficulty[] = ['normal', 'dificil', 'realista'];
  const availablePatients = [...patients].sort(() => Math.random() - 0.5);

  difficulties.forEach((difficulty, index) => {
    if (availablePatients[index]) {
      const patient = availablePatients[index];
      const isFromFamily = Math.random() > 0.7; // 30% de familiares

      const difficultyLabels: Record<CaseDifficulty, string> = {
        entrenamiento: '🟢 Entrenamiento',
        normal: '⚪ Normal',
        dificil: '🟡 Difícil',
        realista: '🔴 Realista',
      };

      const familyIntro = isFromFamily
        ? `Me ha contactado un familiar de ${patient.name.split(' ')[0]} preocupado por su situación.`
        : `Ha llamado ${patient.name} directamente solicitando una cita.`;

      // Obtener motivo personalizado según el trastorno del paciente
      const motivoConsulta = getMotiveByDisorder(patient.disorder, isFromFamily);

      emails.push({
        id: `case_${patient.id}_${difficulty}`,
        from: 'PSYKAT',
        subject: `Nuevo paciente: ${patient.name.split(' ').map(n => n[0]).join('.')}. [${difficultyLabels[difficulty]}]`,
        preview: motivoConsulta.substring(0, 60) + '...',
        content: `Buenos días,

${familyIntro}

Datos del paciente:
- Nombre: ${patient.name}
- Edad: ${patient.age} años
- Ocupación: ${patient.occupation}
- Teléfono: +34 6${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}

Motivo de consulta: ${motivoConsulta}

Le he indicado que le contactarás pronto.

Un saludo,
PSYKAT
Tu asistente de derivaciones`,
        type: 'case',
        difficulty,
        patient,
        isRead: false,
        isFromFamily,
        timestamp: new Date(now.getTime() - (index + 1) * 1800000),
      });
    }
  });

  // Correo de entrenamiento
  if (availablePatients[3]) {
    const trainingPatient = availablePatients[3];
    emails.push({
      id: `training_${trainingPatient.id}`,
      from: 'Dr. Domingo',
      subject: '📚 Caso de entrenamiento disponible',
      preview: 'He preparado un caso de práctica para ti...',
      content: `Hola,

He preparado un caso de práctica para ti. Este paciente es colaborador y te dará pistas durante la sesión.

Paciente de práctica:
- Nombre: ${trainingPatient.name}
- Edad: ${trainingPatient.age} años
- Ocupación: ${trainingPatient.occupation}

Recuerda que en el modo entrenamiento:
- Tienes ayudas activas
- El paciente es más abierto
- Recibirás feedback inmediato

¡Aprovecha para practicar!

Dr. Domingo
(Tu supervisor)`,
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

  // Generar correos al montar
  useEffect(() => {
    const initialEmails = generateInitialEmails(mockPatients);
    setEmails(initialEmails);
  }, []);

  // Abrir correo
  const openEmail = (email: Email) => {
    // Marcar como leído
    setEmails(prev => prev.map(e =>
      e.id === email.id ? { ...e, isRead: true } : e
    ));
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  // Añadir paciente a contactos
  const addToContacts = (email: Email) => {
    if (!email.patient) return;

    // Crear nuevo caso
    const newCase = createNewCase(email.patient);

    // Añadir información adicional
    const caseWithInfo = {
      ...newCase,
      difficulty: email.difficulty,
      isFromFamily: email.isFromFamily,
    };

    dispatch({ type: 'ADD_CASE', payload: caseWithInfo });

    // Eliminar correo de la lista
    setEmails(prev => prev.filter(e => e.id !== email.id));
    setShowEmailModal(false);
    setSelectedEmail(null);

    // Navegar a contactos
    navigation.navigate('Contacts');
  };

  // Color según dificultad
  const getDifficultyColor = (difficulty?: CaseDifficulty): string => {
    switch (difficulty) {
      case 'entrenamiento': return '#4CAF50';
      case 'normal': return '#9E9E9E';
      case 'dificil': return '#FF9800';
      case 'realista': return '#f44336';
      default: return '#4A90E2';
    }
  };

  // Icono según tipo
  const getEmailIcon = (email: Email): { name: string; color: string } => {
    switch (email.type) {
      case 'case':
        return {
          name: 'user-plus',
          color: getDifficultyColor(email.difficulty)
        };
      case 'psykea':
        return { name: 'shopping-cart', color: '#8B5CF6' };
      case 'agency':
        return { name: 'globe', color: '#00BCD4' };
      case 'system':
      default:
        return { name: 'envelope', color: '#4A90E2' };
    }
  };

  // Formatear tiempo
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Hace un momento';
    if (hours < 24) return `Hace ${hours}h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Renderizar item de correo
  const renderEmailItem = ({ item }: { item: Email }) => {
    const icon = getEmailIcon(item);

    return (
      <TouchableOpacity
        style={[styles.emailItem, !item.isRead && styles.emailUnread]}
        onPress={() => openEmail(item)}
        activeOpacity={0.8}
      >
        {/* Indicador de no leído */}
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: icon.color }]} />}

        {/* Icono */}
        <View style={[styles.emailIcon, { backgroundColor: icon.color + '20' }]}>
          <Icon name={icon.name} size={20} color={icon.color} />
        </View>

        {/* Contenido */}
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
          <Text style={styles.emailPreview} numberOfLines={1}>
            {item.preview}
          </Text>
        </View>

        {/* Indicador de dificultad para casos */}
        {item.type === 'case' && item.difficulty && (
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>
              {item.difficulty.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Modal de correo
  const EmailModal = () => {
    if (!selectedEmail) return null;

    return (
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
          <LinearGradient
            colors={['#4A90E2', '#357abd']}
            style={styles.modalGradientHeader}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEmailModal(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Icon name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Correo</Text>
              <View style={styles.placeholder} />
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent} bounces={true}>
            {/* Cabecera del correo */}
            <View style={styles.emailDetailHeader}>
              <Text style={styles.emailDetailFrom}>{selectedEmail.from}</Text>
              <Text style={styles.emailDetailSubject}>{selectedEmail.subject}</Text>
              <Text style={styles.emailDetailTime}>
                {selectedEmail.timestamp.toLocaleString('es-ES')}
              </Text>
            </View>

            {/* Cuerpo del correo */}
            <View style={styles.emailBody}>
              <Text style={styles.emailBodyText}>{selectedEmail.content}</Text>
            </View>

            {/* Botón añadir a contactos (solo para casos) */}
            {selectedEmail.type === 'case' && selectedEmail.patient && (
              <TouchableOpacity
                style={[
                  styles.addContactButton,
                  { backgroundColor: getDifficultyColor(selectedEmail.difficulty) }
                ]}
                onPress={() => addToContacts(selectedEmail)}
              >
                <Icon name="user-plus" size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.addContactText}>Añadir a Contactos</Text>
              </TouchableOpacity>
            )}

            {/* Información del paciente */}
            {selectedEmail.patient && (
              <View style={styles.patientCard}>
                <Text style={styles.patientCardTitle}>Información del paciente</Text>
                <View style={styles.patientInfo}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {selectedEmail.patient.avatar}
                    </Text>
                  </View>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{selectedEmail.patient.name}</Text>
                    <Text style={styles.patientMeta}>
                      {selectedEmail.patient.age} años • {selectedEmail.patient.occupation}
                    </Text>
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

  // Contar no leídos
  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <LinearGradient
      colors={['#4A90E2', '#357abd']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Correo</Text>
            {unreadCount > 0 && (
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

      {/* Lista de correos */}
      <View style={styles.content}>
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
      </View>

      {/* Modal de correo */}
      <EmailModal />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  listContent: {
    paddingVertical: 15,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emailUnread: {
    backgroundColor: '#f0f7ff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -4,
  },
  emailIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emailContent: {
    flex: 1,
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  emailFrom: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  emailTime: {
    fontSize: 12,
    color: '#999',
  },
  emailSubject: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  emailPreview: {
    fontSize: 13,
    color: '#999',
  },
  textBold: {
    fontWeight: '600',
  },
  difficultyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  modalGradientHeader: {
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 50,
  },
  closeButton: {
    padding: 12,
    marginLeft: -8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 42,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emailDetailHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emailDetailFrom: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 5,
  },
  emailDetailSubject: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  emailDetailTime: {
    fontSize: 12,
    color: '#999',
  },
  emailBody: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  emailBodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 10,
  },
  addContactText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  patientCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  patientAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  familyText: {
    fontSize: 12,
    color: '#FF8C42',
    marginLeft: 5,
  },
});

export default MailScreen;
