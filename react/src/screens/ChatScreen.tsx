import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useApp, DEV_MODE } from '../contexts/AppContext';
import { useAI } from '../contexts/AIContext';
import { useNotifications } from '../contexts/NotificationContext';
import { RootStackParamList } from '../types/navigation';
import { Case, Message, CaseNote, Gender } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';
import { patientGreetings } from '../data/mockData';
import { formatWithGender } from '../utils/genderUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.85;

// Saludos profesionales del terapeuta - Primera sesión (con templates de género)
const therapistFirstGreetings = [
  "Buenos días. Me han comentado que viene por primera vez. Tómese su tiempo, estoy aquí para escuchar{lo/la}.",
  "Hola, bienvenid{o/a}. Sé que dar el primer paso no es fácil. ¿Cómo se encuentra hoy?",
  "Buenos días. He leído un poco sobre su caso. Me gustaría que me contara con sus palabras qué {lo/la} trae aquí.",
  "Hola, gracias por venir. Antes de empezar, ¿hay algo que le gustaría saber sobre cómo trabajaremos?",
  "Bienvenid{o/a}. He visto las notas de recepción. Cuénteme, ¿qué es lo que más le preocupa ahora mismo?",
];

// Saludos para sesiones de seguimiento
const therapistFollowUpGreetings = [
  "Hola de nuevo. ¿Cómo ha estado desde nuestra última sesión?",
  "Buenos días. Me alegra ver{lo/la} de vuelta. ¿Ha pasado algo desde la última vez?",
  "Hola. ¿Cómo se ha sentido estos días? ¿Ha pensado en lo que hablamos?",
  "Bienvenid{o/a} de nuevo. ¿Qué tal han ido las cosas desde que nos vimos?",
  "Hola. Antes de continuar, ¿hay algo urgente que quiera contarme hoy?",
];

// Función para obtener saludo según contexto y género
const getTherapistGreeting = (sessionCount: number, patientGender: Gender): string => {
  const templates = sessionCount === 0 ? therapistFirstGreetings : therapistFollowUpGreetings;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return formatWithGender(template, patientGender);
};

// Mensajes automáticos contextuales según el trastorno (con templates de género)
const getContextualAutoMessage = (disorder: string, messagesCount: number, gender: Gender): string => {
  const disorderMessages: Record<string, string[]> = {
    'depresion_mayor': [
      "A veces me cuesta encontrar las palabras...",
      "Disculpe, estaba pensando en lo que me preguntó...",
      "Es difícil hablar de esto, pero lo intento...",
      "Me quedé pensando... perdón por el silencio.",
    ],
    'trastorno_ansiedad_generalizada': [
      "Perdón, me puse nervios{o/a} pensando en qué decir...",
      "Disculpe, estaba tratando de ordenar mis pensamientos...",
      "Me cuesta concentrarme cuando hablo de esto...",
      "Lo siento, mi mente estaba en otro lado...",
    ],
    'trastorno_panico': [
      "Disculpe, necesitaba un momento para respirar...",
      "Perdón por la pausa, me costó un poco...",
      "Estaba tratando de mantener la calma...",
    ],
    'fobia_social': [
      "Perdón, me cuesta hablar de mí mism{o/a}...",
      "Disculpe, me pongo nervios{o/a} en estas situaciones...",
      "Es incómodo para mí, pero quiero seguir...",
    ],
    'tept': [
      "Necesitaba un momento... los recuerdos son difíciles...",
      "Disculpe, me costó volver al presente...",
      "Perdón por el silencio, estaba procesando...",
    ],
    'toc': [
      "Disculpe, tenía que verificar algo mentalmente...",
      "Perdón, me distraje con un pensamiento...",
      "Estaba tratando de ignorar ciertos pensamientos...",
    ],
  };

  const genericMessages = [
    "Perdón por la demora, estaba pensando...",
    "Disculpe, me costó organizar mis ideas...",
    "Lo siento, necesitaba un momento...",
    "Estaba reflexionando sobre lo que me preguntó...",
    "Perdón, me quedé pensativ{o/a}...",
  ];

  const messages = disorderMessages[disorder] || genericMessages;
  const template = messages[Math.floor(Math.random() * messages.length)];
  return formatWithGender(template, gender);
};

// Mensajes de derivación - más empáticos y profesionales (con templates de género)
const getCancellationMessage = (patientName: string, sessionCount: number, patientGender: Gender, therapistGender: Gender): string => {
  // Si es la primera sesión
  if (sessionCount === 0) {
    const firstSessionMessages = [
      `${patientName}, tras nuestra conversación inicial, creo que {un/una} colega podría ayudar{lo/la} mejor con su situación. No es un reflejo de usted, sino de encontrar el mejor encaje terapéutico. {Lo/La} derivaré con alguien especializad{o/a}.`,
      `Estimad{o/a} ${patientName}, quiero ser honest${therapistGender === 'feminine' ? 'a' : 'o'}: creo que hay {un/una} profesional más adecuad{o/a} para su caso. Esto no significa que su situación no sea importante, al contrario. Merece la mejor atención posible.`,
      `${patientName}, después de escuchar{lo/la}, considero que {un/una} compañer{o/a} tiene más experiencia en este tipo de casos. {Lo/La} contactarán pronto. Gracias por compartir conmigo.`,
    ];
    const template = firstSessionMessages[Math.floor(Math.random() * firstSessionMessages.length)];
    return formatWithGender(template, patientGender);
  }

  // Si ya llevamos varias sesiones
  const ongoingMessages = [
    `${patientName}, hemos trabajado junt${therapistGender === 'feminine' ? 'as' : 'os'} y valoro lo que hemos avanzado. Por circunstancias que no puedo controlar, debo derivar su caso. Otr${therapistGender === 'feminine' ? 'a' : 'o'} profesional continuará desde donde lo dejamos.`,
    `Estimad{o/a} ${patientName}, lamento comunicarle que debo transferir su caso a otr${therapistGender === 'feminine' ? 'a' : 'o'} colega. Todo su progreso quedará documentado. Ha sido un placer trabajar con usted.`,
    `${patientName}, por motivos profesionales no podré continuar como su terapeuta. Quiero que sepa que el trabajo que ha hecho es valioso. Mi colega retomará donde lo dejamos.`,
  ];
  const template = ongoingMessages[Math.floor(Math.random() * ongoingMessages.length)];
  return formatWithGender(template, patientGender);
};

type ChatNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { state, dispatch, addMessage, generateId } = useApp();
  const { generateResponse, detectLifeAspects, generateFarewellMessage } = useAI();
  const { showNotification } = useNotifications();
  const { caseId } = route.params;

  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [questionsCount, setQuestionsCount] = useState(0);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'symptom' | 'observation' | 'general'>('general');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const testNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserMessageTimeRef = useRef<Date>(new Date());

  // Listener del teclado para manejar el padding dinámicamente
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll al último mensaje cuando aparece el teclado
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Panel lateral animación - empieza oculto (fuera de pantalla a la derecha)
  const panelPosition = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  const openPanel = () => {
    setIsPanelVisible(true);
    setIsPanelOpen(true);
    Animated.parallel([
      Animated.spring(panelPosition, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePanel = () => {
    Animated.parallel([
      Animated.spring(panelPosition, {
        toValue: PANEL_WIDTH,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPanelOpen(false);
      setIsPanelVisible(false);
    });
  };

  // Cargar caso actual
  useEffect(() => {
    const case_ = state.cases.find(c => c.id === caseId);
    if (case_) {
      setCurrentCase(case_);
      setQuestionsCount(case_.questionsThisSession || 0);

      // Marcar mensajes como leídos al abrir el chat
      if (case_.unreadCount > 0) {
        dispatch({ type: 'MARK_MESSAGES_READ', payload: caseId });
      }

      // Si no hay mensajes, añadir saludo inicial
      if (case_.messages.length === 0) {
        addInitialMessage(case_);
      }
    }
  }, [caseId, state.cases]);

  // Desplazar al último mensaje
  useEffect(() => {
    if (currentCase && currentCase.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentCase?.messages]);

  // Añadir mensaje inicial - El terapeuta inicia la conversación
  const addInitialMessage = async (case_: Case) => {
    const sessionCount = case_.sessions || 0;

    // Saludo del terapeuta según contexto (primera vez o seguimiento)
    const therapistGreeting = getTherapistGreeting(sessionCount, case_.patient.gender);
    const therapistMessage: Message = {
      id: generateId(),
      text: therapistGreeting,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    addMessage(case_.id, therapistMessage);

    // Marcar como activo
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        id: case_.id,
        updates: { status: 'active' },
      },
    });

    // Después de 2-4 segundos, el paciente responde con saludo contextual
    setTimeout(() => {
      // Generar saludo contextual basado en trastorno y backstory
      const patientGreeting = getContextualPatientGreeting(case_);
      const patientMessage: Message = {
        id: generateId(),
        text: patientGreeting,
        sender: 'patient',
        timestamp: new Date(),
        type: 'text',
      };
      addMessage(case_.id, patientMessage);

      // Iniciar el timer de mensaje automático
      startAutoMessageTimer(case_);
    }, 2000 + Math.random() * 2000);
  };

  // Obtener saludo contextual del paciente basado en su situación (con género)
  const getContextualPatientGreeting = (case_: Case): string => {
    const { patient, sessions = 0 } = case_;
    const disorder = patient.disorder;
    const gender = patient.gender;

    // Primera sesión - referencias al backstory o motivo de consulta
    if (sessions === 0) {
      // Saludos específicos por trastorno que referencian el contexto (con templates de género)
      const contextualGreetings: Record<string, string[]> = {
        'trastorno_depresivo_mayor': [
          "Hola... Perdone, me costó mucho decidirme a venir. No sé si esto pueda ayudarme realmente.",
          "Buenos días, {doctor/doctora}. Mi familia insistió en que viniera... Ya no sé qué más hacer.",
          "Gracias por verme. Me dijeron que podría hablar de lo que me pasa... aunque no sé por dónde empezar.",
        ],
        'trastorno_ansiedad_generalizada': [
          "Hola, perdone si parezco nervios{o/a}, es que... bueno, así soy siempre últimamente.",
          "Buenos días. Llevaba semanas posponiendo esta cita, pero ya no aguanto más así.",
          "Gracias por recibirme. He probado de todo para calmarme, pero nada funciona.",
        ],
        'trastorno_panico': [
          "Hola... ¿Le importa si me siento cerca de la puerta? Es que... tengo una cosa con los espacios.",
          "Buenos días. Casi no vengo, me dio uno de esos... ataques... en el camino.",
          "Gracias por la cita. Necesito ayuda urgente, estos ataques están arruinando mi vida.",
        ],
        'fobia_social': [
          "[en voz baja] Hola... Perdone, me cuesta mucho hablar con gente nueva.",
          "Buenos días, {doctor/doctora}. He tardado meses en atreverme a pedir cita.",
          "Hola... Espero no parecer muy rar{o/a}, es solo que estas situaciones me cuestan mucho.",
        ],
        'tept': [
          "Hola. [mira a su alrededor] ¿Podemos cerrar la puerta? Me siento más segur{o/a} así.",
          "Buenos días. Me recomendaron venir después de... lo que pasó. Aún me cuesta hablarlo.",
          "Gracias por verme. Desde el incidente, no soy {el/la} mism{o/a} persona.",
        ],
        'trastorno_obsesivo_compulsivo': [
          "Hola. Perdone la tardanza, tuve que... verificar algunas cosas antes de salir.",
          "Buenos días. ¿Puedo usar gel desinfectante? Lo siento, es más fuerte que yo.",
          "Gracias por la cita. Sé que lo que me pasa no tiene sentido, pero no puedo controlarlo.",
        ],
        'trastorno_limite_personalidad': [
          "Hola. Espero que usted sí pueda ayudarme, porque los anteriores no sirvieron de nada.",
          "Buenos días. [emocionalmente intens{o/a}] Necesito hablar con alguien que me entienda de verdad.",
          "Gracias por verme. Mi vida es un caos ahora mismo y no sé qué hacer.",
        ],
        'trastorno_bipolar_i': [
          "Hola, {doctor/doctora}. Vengo porque mi familia está preocupada... otra vez.",
          "Buenos días. Me dijeron que tenía que venir después de lo que pasó el mes pasado.",
          "Gracias por la cita. Necesito estabilizarme, no puedo seguir con estos altibajos.",
        ],
        'anorexia_nerviosa': [
          "Hola. Mi madre me obligó a venir, pero yo estoy bien.",
          "Buenos días. Supongo que ya le han dicho por qué estoy aquí... no estoy de acuerdo.",
          "Gracias por verme. Vengo porque mi familia está preocupada, aunque yo me veo normal.",
        ],
        'trastorno_consumo_alcohol': [
          "Hola, {doctor/doctora}. Vengo porque me han dado un ultimátum en casa.",
          "Buenos días. No creo que tenga un problema real, pero todos insisten en que venga.",
          "Gracias por la cita. Quiero demostrar que puedo manejarlo... aunque necesite un poco de ayuda.",
        ],
      };

      const greetings = contextualGreetings[disorder] || [
        "Hola, {doctor/doctora}. Gracias por verme.",
        "Buenos días. No sabía muy bien qué esperar de esto.",
        "Hola. Me costó decidirme a pedir ayuda, pero aquí estoy.",
      ];

      const template = greetings[Math.floor(Math.random() * greetings.length)];
      return formatWithGender(template, gender);
    }

    // Sesiones de seguimiento
    const followUpGreetings = [
      "Hola de nuevo. He estado pensando en lo que hablamos la última vez.",
      "Buenos días. Ha sido una semana interesante... tengo cosas que contarle.",
      "Hola, {doctor/doctora}. Intenté hacer lo que me sugirió, con resultados mixtos.",
      "Gracias por verme de nuevo. Las cosas han cambiado un poco desde la última sesión.",
    ];

    const template = followUpGreetings[Math.floor(Math.random() * followUpGreetings.length)];
    return formatWithGender(template, gender);
  };

  // Timer para mensaje automático si no hay respuesta en 90 segundos
  const startAutoMessageTimer = (case_: Case) => {
    // Limpiar timer anterior si existe
    if (autoMessageTimeoutRef.current) {
      clearTimeout(autoMessageTimeoutRef.current);
    }

    lastUserMessageTimeRef.current = new Date();

    autoMessageTimeoutRef.current = setTimeout(() => {
      // Verificar que el caso siga activo y no se hayan enviado mensajes
      const timeSinceLastMessage = Date.now() - lastUserMessageTimeRef.current.getTime();
      if (timeSinceLastMessage >= 90000 && case_.status === 'active') {
        const autoMessage = getContextualAutoMessage(
          case_.patient.disorder,
          case_.messages.length,
          case_.patient.gender
        );

        const message: Message = {
          id: generateId(),
          text: autoMessage,
          sender: 'patient',
          timestamp: new Date(),
          type: 'text',
        };

        addMessage(case_.id, message);
      }
    }, 90000); // 90 segundos
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (autoMessageTimeoutRef.current) {
        clearTimeout(autoMessageTimeoutRef.current);
      }
      if (testNotificationTimeoutRef.current) {
        clearTimeout(testNotificationTimeoutRef.current);
      }
    };
  }, []);

  // Enviar mensaje
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentCase || questionsCount >= 5 || isLoading) {
      return;
    }

    // Guardar el mensaje antes de limpiar el input
    const userMessageText = messageInput.trim();
    setMessageInput('');
    setIsLoading(true);

    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: generateId(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    addMessage(currentCase.id, userMessage);
    const newCount = questionsCount + 1;
    setQuestionsCount(newCount);

    // Actualizar contador en el caso
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        id: currentCase.id,
        updates: { questionsThisSession: newCount },
      },
    });

    // Crear una copia del caso con el mensaje del usuario incluido para la IA
    const caseWithNewMessage: Case = {
      ...currentCase,
      messages: [...currentCase.messages, userMessage],
    };

    try {
      // Generar respuesta con IA (pasar el caso con el historial completo incluyendo el nuevo mensaje)
      const aiResponse = await generateResponse(userMessageText, caseWithNewMessage);

      const patientMessage: Message = {
        id: generateId(),
        text: aiResponse.response,
        sender: 'patient',
        timestamp: new Date(),
        type: 'text',
        score: aiResponse.score,
        color: aiResponse.color,
      };

      addMessage(currentCase.id, patientMessage);

      // Detectar aspectos de vida explorados en la pregunta del usuario
      const detectedAspects = detectLifeAspects(userMessageText);
      const updatedLifeAspects = {
        ...currentCase.lifeAspectsExplored,
        ...Object.fromEntries(
          Object.entries(detectedAspects).map(([key, value]) => [key, value || currentCase.lifeAspectsExplored[key as keyof typeof currentCase.lifeAspectsExplored]])
        ),
      };

      // Actualizar rapport, sessionId y aspectos de vida
      const rapportChange = aiResponse.score >= 70 ? 2 : aiResponse.score >= 50 ? 0 : -3;
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
          updates: {
            sessionId: aiResponse.sessionId,
            rapport: Math.max(0, Math.min(100, (currentCase.rapport || 70) + rapportChange)),
            lifeAspectsExplored: updatedLifeAspects,
          },
        },
      });

      // Reiniciar el timer de mensaje automático
      startAutoMessageTimer(currentCase);

      // Si fue la 5ta pregunta, enviar mensaje de despedida después de 2 segundos
      if (newCount === 5) {
        setTimeout(async () => {
          try {
            const farewellText = await generateFarewellMessage(currentCase);
            const farewellMessage: Message = {
              id: generateId(),
              text: farewellText,
              sender: 'patient',
              timestamp: new Date(),
              type: 'text',
            };
            addMessage(currentCase.id, farewellMessage);

            // Notificar al usuario que la sesión terminó
            showNotification({
              type: 'message',
              title: currentCase.patient.name,
              body: 'La sesión ha terminado. Revisa la Herramienta Diagnóstica para continuar.',
              data: { caseId: currentCase.id },
            });
          } catch (err) {
            console.error('Error generating farewell:', err);
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Error generando respuesta:', error);

      // Respuesta de fallback
      const fallbackMessage = generateFallbackResponse(messageInput);
      const patientMessage: Message = {
        id: generateId(),
        text: fallbackMessage,
        sender: 'patient',
        timestamp: new Date(),
        type: 'text',
      };

      addMessage(currentCase.id, patientMessage);

      // Reiniciar el timer de mensaje automático
      startAutoMessageTimer(currentCase);
    }

    setIsLoading(false);
  };

  // Respuesta de fallback
  const generateFallbackResponse = (message: string): string => {
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
  };

  // Añadir nota
  const addNote = () => {
    if (!newNote.trim() || !currentCase) return;

    const note: CaseNote = {
      id: generateId(),
      text: newNote,
      type: noteType,
      timestamp: new Date().toISOString(),
    };

    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        id: currentCase.id,
        updates: {
          notes: [...(currentCase.notes || []), note],
        },
      },
    });

    setNewNote('');
    setNoteType('general');
  };

  // Herramientas disponibles - Solo notas (Diagnóstico y Tests están en DiagnosticToolScreen)
  const tools = [
    {
      id: 'notes',
      title: 'Notas Clínicas',
      icon: 'pencil',
      color: '#FF9800',
      onPress: () => {
        setShowToolsMenu(false);
        setShowNotesModal(true);
      },
      badge: currentCase?.notes?.length || 0,
    },
    {
      id: 'expediente',
      title: 'Ver Expediente',
      icon: 'folder-open',
      color: '#4A90E2',
      onPress: () => {
        setShowToolsMenu(false);
        openPanel();
      },
    },
  ];


  // Renderizar mensaje
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.message, isUser ? styles.messageSent : styles.messageReceived]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.bubbleSent : styles.bubbleReceived,
          item.type === 'results' && styles.bubbleResults,
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.textSent : styles.textReceived,
            item.type === 'results' && styles.textResults,
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isUser ? styles.timeSent : styles.timeReceived]}>
              {new Date(item.timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {item.score !== undefined && (
              <View style={[styles.scoreIndicator, { backgroundColor: item.color || getScoreColor(item.score) }]}>
                <Text style={styles.scoreText}>{item.score}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Color según score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    return '#f44336';
  };

  // Nueva sesión
  const startNewSession = () => {
    if (!currentCase) return;

    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        id: currentCase.id,
        updates: {
          sessions: currentCase.sessions + 1,
          questionsThisSession: 0,
        },
      },
    });

    setQuestionsCount(0);

    const responses = [
      "Regular, he estado pensando en lo que hablamos la última vez...",
      "Bien, aunque todavía tengo algunas dudas sobre lo que me dijiste",
      "La semana ha sido difícil, pero quiero seguir trabajando en esto",
      "Mejor, gracias. He estado reflexionando sobre nuestra conversación",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const message: Message = {
      id: generateId(),
      text: response,
      sender: 'patient',
      timestamp: new Date(),
      type: 'text',
    };

    addMessage(currentCase.id, message);
    setShowToolsMenu(false);
  };

  // Panel lateral de información
  const renderInfoPanel = () => (
    <Animated.View
      style={[
        styles.infoPanel,
        {
          transform: [{ translateX: panelPosition }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <TouchableOpacity onPress={closePanel} style={styles.closePanelBtn}>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.panelTitle}>Expediente</Text>
      </View>

      <ScrollView style={styles.panelContent}>
        {/* Info del paciente */}
        <View style={styles.panelSection}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatarLarge}>
              <Text style={styles.patientAvatarText}>
                {currentCase?.patient.avatar || '👤'}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{currentCase?.patient.name}</Text>
              <Text style={styles.patientDetails}>
                {currentCase?.patient.age} años • {currentCase?.patient.occupation}
              </Text>
            </View>
          </View>

          {/* Rapport */}
          <View style={styles.rapportContainer}>
            <Text style={styles.rapportLabel}>Rapport</Text>
            <View style={styles.rapportBar}>
              <View
                style={[
                  styles.rapportFill,
                  {
                    width: `${currentCase?.rapport || 70}%`,
                    backgroundColor: (currentCase?.rapport || 70) > 60 ? '#4CAF50' :
                                   (currentCase?.rapport || 70) > 30 ? '#FF9800' : '#f44336',
                  }
                ]}
              />
            </View>
            <Text style={styles.rapportValue}>{currentCase?.rapport || 70}%</Text>
          </View>
        </View>

        {/* Síntomas identificados */}
        <View style={styles.panelSection}>
          <Text style={styles.sectionTitle}>
            <Icon name="exclamation-triangle" size={14} color="#FF9800" /> Síntomas ({currentCase?.selectedSymptoms?.length || 0})
          </Text>
          {currentCase?.selectedSymptoms && currentCase.selectedSymptoms.length > 0 ? (
            <View style={styles.symptomsList}>
              {currentCase.selectedSymptoms.map((symptom, index) => (
                <View key={index} style={styles.symptomTag}>
                  <Text style={styles.symptomText}>{symptom}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No hay síntomas identificados</Text>
          )}
        </View>

        {/* Notas */}
        <View style={styles.panelSection}>
          <Text style={styles.sectionTitle}>
            <Icon name="pencil" size={14} color="#2196F3" /> Notas ({currentCase?.notes?.length || 0})
          </Text>
          {currentCase?.notes && currentCase.notes.length > 0 ? (
            currentCase.notes.slice(-5).map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <View style={[styles.noteTypeIndicator, {
                  backgroundColor: note.type === 'symptom' ? '#FF9800' :
                                  note.type === 'observation' ? '#2196F3' : '#9E9E9E'
                }]} />
                <Text style={styles.noteText}>{note.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay notas</Text>
          )}
        </View>

        {/* Resultados de tests */}
        {currentCase?.testsResults && currentCase.testsResults.length > 0 && (
          <View style={styles.panelSection}>
            <Text style={styles.sectionTitle}>
              <Icon name="clipboard" size={14} color="#9C27B0" /> Tests aplicados ({currentCase.testsResults.length}/2)
            </Text>
            {currentCase.testsResults.map((result, index) => (
              <View key={index} style={styles.testResult}>
                <Text style={styles.testName}>{result.testName}</Text>
                <Text style={styles.testScore}>
                  Puntuación: {result.score}/100
                </Text>
                <Text style={styles.testInterpretation}>
                  {result.interpretation}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Diagnóstico */}
        {currentCase?.diagnosis && (
          <View style={styles.panelSection}>
            <Text style={styles.sectionTitle}>
              <Icon name="stethoscope" size={14} color="#4CAF50" /> Diagnóstico
            </Text>
            <View style={styles.diagnosisBox}>
              <Text style={styles.diagnosisText}>{currentCase.diagnosis}</Text>
            </View>
          </View>
        )}

        {/* DEV MODE: Mostrar diagnóstico real */}
        {DEV_MODE && (
          <View style={[styles.panelSection, { backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#FF9800', borderStyle: 'dashed' }]}>
            <Text style={[styles.sectionTitle, { color: '#E65100' }]}>
              <Icon name="bug" size={14} color="#E65100" /> DEBUG (Dev Mode)
            </Text>
            <Text style={{ fontSize: 12, color: '#E65100', marginBottom: 5 }}>
              Diagnóstico real del paciente:
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#BF360C' }}>
              {currentCase?.patient.disorder?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
            </Text>
            <Text style={{ fontSize: 11, color: '#E65100', marginTop: 8 }}>
              ID: {currentCase?.patient.disorder}
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );

  if (!currentCase) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#357abd']}
        style={styles.gradient}
      >
        <SafeAreaViewRN style={styles.header}>
          {/* Header */}
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerInfo} onPress={openPanel}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{currentCase.patient.avatar}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>{currentCase.patient.name}</Text>
                <Text style={styles.headerStatus}>
                  Sesión {currentCase.sessions + 1} • {5 - questionsCount} preguntas
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Alert.alert(
                    'Derivar paciente',
                    '¿Deseas derivar este paciente a otro profesional? Se enviará un mensaje de despedida.',
                    [
                      { text: 'No', style: 'cancel' },
                      {
                        text: 'Sí, derivar',
                        style: 'destructive',
                        onPress: () => {
                          // Enviar mensaje de disculpa/derivación con contexto
                          const sessionCount = currentCase.sessions || 0;
                          // Por ahora usamos el perfil del usuario actual (DEV por defecto)
                          const therapistGender = state.user.profile?.gender || 'masculine';
                          const cancellationMsg = getCancellationMessage(currentCase.patient.name, sessionCount, currentCase.patient.gender, therapistGender);
                          const farewell: Message = {
                            id: generateId(),
                            text: cancellationMsg,
                            sender: 'user',
                            timestamp: new Date(),
                            type: 'text',
                          };
                          addMessage(currentCase.id, farewell);

                          // Limpiar timers
                          if (autoMessageTimeoutRef.current) {
                            clearTimeout(autoMessageTimeoutRef.current);
                          }
                          if (testNotificationTimeoutRef.current) {
                            clearTimeout(testNotificationTimeoutRef.current);
                          }

                          // Mostrar confirmación y luego cancelar (tiempo suficiente para leer)
                          Alert.alert(
                            'Caso Derivado',
                            'El mensaje de derivación ha sido enviado al paciente.',
                            [{
                              text: 'Aceptar',
                              onPress: () => {
                                dispatch({ type: 'CANCEL_CASE', payload: currentCase.id });
                                navigation.goBack();
                              }
                            }]
                          );
                        },
                      },
                    ]
                  );
                }}
              >
                <Icon name="times-circle" size={22} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={openPanel}>
                <Icon name="info-circle" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaViewRN>

        <View style={styles.content}>
          {/* Mensajes */}
          <FlatList
            ref={flatListRef}
            data={currentCase.messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesContainer,
              { paddingBottom: keyboardHeight > 0 ? 10 : 15 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          />

          {/* Input container - con padding dinámico según el teclado */}
          <View style={[
            styles.inputContainer,
            { paddingBottom: Platform.OS === 'ios' ? Math.max(keyboardHeight, 12) : 12 }
          ]}>
            {/* Indicador de fin de sesión */}
            {questionsCount >= 5 && (
              <View style={styles.sessionEndBanner}>
                <Icon name="clock-o" size={16} color="#FF9800" />
                <Text style={styles.sessionEndText}>Sesión completada</Text>
                <TouchableOpacity
                  style={styles.newSessionBtn}
                  onPress={startNewSession}
                >
                  <Text style={styles.newSessionBtnText}>Nueva sesión</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              {/* Botón de herramientas */}
              <TouchableOpacity
                style={styles.toolsButton}
                onPress={() => setShowToolsMenu(true)}
              >
                <Icon name="plus" size={20} color="#4A90E2" />
              </TouchableOpacity>

              {/* Input ovalado */}
              <View style={styles.ovalInput}>
                <TextInput
                  style={styles.textInput}
                  value={messageInput}
                  onChangeText={setMessageInput}
                  placeholder={questionsCount >= 5 ? "Inicia nueva sesión..." : "Escribe tu pregunta..."}
                  placeholderTextColor="#999"
                  multiline
                  maxLength={500}
                  editable={!isLoading && questionsCount < 5}
                />

                {/* Contador de preguntas */}
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>{5 - questionsCount}</Text>
                </View>
              </View>

              {/* Botón enviar */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageInput.trim() || isLoading || questionsCount >= 5) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!messageInput.trim() || isLoading || questionsCount >= 5}
              >
                {isLoading ? (
                  <Icon name="spinner" size={18} color="white" />
                ) : (
                  <Icon name="paper-plane" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {/* Indicador de escritura */}
            {isLoading && (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>{currentCase.patient.name} está escribiendo...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Overlay para panel */}
        {isPanelVisible && (
          <Animated.View
            style={[styles.panelOverlay, { opacity: overlayOpacity }]}
          >
            <TouchableOpacity style={styles.overlayTouch} onPress={closePanel} />
          </Animated.View>
        )}

        {/* Panel de información - solo renderizar cuando es visible */}
        {isPanelVisible && renderInfoPanel()}

        {/* Modal de herramientas */}
        <Modal
          transparent
          visible={showToolsMenu}
          animationType="slide"
          onRequestClose={() => setShowToolsMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowToolsMenu(false)}
          >
            <View style={styles.toolsModal}>
              <View style={styles.toolsModalHeader}>
                <Text style={styles.toolsModalTitle}>Herramientas</Text>
                <TouchableOpacity onPress={() => setShowToolsMenu(false)}>
                  <Icon name="times" size={22} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.toolsGrid}>
                {tools.map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.toolItem}
                    onPress={tool.onPress}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                      <Icon name={tool.icon} size={24} color={tool.color} />
                      {tool.badge !== undefined && tool.badge > 0 && (
                        <View style={[styles.toolBadge, { backgroundColor: tool.color }]}>
                          <Text style={styles.toolBadgeText}>{tool.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.toolTitle}>
                      {tool.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nueva sesión */}
              <TouchableOpacity
                style={styles.newSessionButton}
                onPress={startNewSession}
              >
                <Icon name="refresh" size={18} color="#4A90E2" />
                <Text style={styles.newSessionText}>Nueva sesión (+1)</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal de notas - FLOATING con KeyboardAvoidingView */}
        <Modal
          transparent
          visible={showNotesModal}
          animationType="fade"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowNotesModal(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalCenteredContainer}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                setShowNotesModal(false);
              }}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={styles.floatingNotesCard}>
                  {/* Header con Sparkles */}
                  <View style={styles.floatingNotesHeader}>
                    <View style={styles.headerTitleRow}>
                      <Icon name="magic" size={18} color="#667eea" style={{ marginRight: 8 }} />
                      <Text style={styles.floatingNotesTitle}>Notas del caso</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowNotesModal(false);
                      }}
                      style={styles.closeButton}
                    >
                      <Icon name="times" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Selector de tipo con gradient */}
                  <View style={styles.noteTypeSelector}>
                    {(['general', 'symptom', 'observation'] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.floatingNoteTypeBtn,
                          noteType === type && styles.floatingNoteTypeBtnActive,
                        ]}
                        onPress={() => setNoteType(type)}
                      >
                        {noteType === type ? (
                          <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientButton}
                          >
                            <Text style={styles.floatingNoteTypeBtnTextActive}>
                              {type === 'general' ? '📝 General' :
                               type === 'symptom' ? '⚠️ Síntoma' : '👁️ Observación'}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <Text style={styles.floatingNoteTypeBtnText}>
                            {type === 'general' ? '📝 General' :
                             type === 'symptom' ? '⚠️ Síntoma' : '👁️ Observación'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Input de nota con gradient border */}
                  <View style={styles.floatingNoteInputContainer}>
                    <TextInput
                      style={styles.floatingNoteInput}
                      value={newNote}
                      onChangeText={setNewNote}
                      placeholder="Escribe tu nota aquí..."
                      placeholderTextColor="#999"
                      multiline
                      maxLength={200}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Botón agregar con gradient */}
                  <TouchableOpacity
                    style={[
                      styles.floatingAddNoteBtn,
                      !newNote.trim() && styles.floatingAddNoteBtnDisabled,
                    ]}
                    onPress={addNote}
                    disabled={!newNote.trim()}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={!newNote.trim() ? ['#B0BEC5', '#B0BEC5'] : ['#667eea', '#764ba2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientAddButton}
                    >
                      <Icon name="plus" size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.floatingAddNoteBtnText}>Agregar nota</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Lista de notas */}
                  <ScrollView style={styles.floatingNotesList} showsVerticalScrollIndicator={false}>
                    {currentCase.notes && currentCase.notes.length > 0 ? (
                      [...currentCase.notes].reverse().map((note) => (
                        <View key={note.id} style={styles.floatingNoteListItem}>
                          <View style={[styles.floatingNoteTypeTag, {
                            backgroundColor: note.type === 'symptom' ? '#FF9800' :
                                            note.type === 'observation' ? '#2196F3' : '#9E9E9E'
                          }]}>
                            <Text style={styles.floatingNoteTypeTagText}>
                              {note.type === 'symptom' ? '⚠️' : note.type === 'observation' ? '👁️' : '📝'}
                            </Text>
                          </View>
                          <View style={styles.floatingNoteContent}>
                            <Text style={styles.floatingNoteItemText}>{note.text}</Text>
                            <Text style={styles.floatingNoteTimestamp}>
                              {new Date(note.timestamp).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyNotesContainer}>
                        <Icon name="magic" size={20} color="#9C27B0" style={{ marginBottom: 8 }} />
                        <Text style={styles.emptyNotesText}>Aún no tienes notas</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 20,
  },
  headerTextContainer: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  headerStatus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    paddingBottom: 15,
    flexGrow: 1,
  },
  message: {
    marginVertical: 3,
  },
  messageSent: {
    alignItems: 'flex-end',
  },
  messageReceived: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 20,
  },
  bubbleSent: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  bubbleResults: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
  },
  textSent: {
    color: 'white',
  },
  textReceived: {
    color: '#333',
  },
  textResults: {
    color: '#2E7D32',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  timeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeReceived: {
    color: '#999',
  },
  scoreIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  scoreText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  sessionEndBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  sessionEndText: {
    color: '#FF9800',
    marginLeft: 8,
    fontWeight: '500',
  },
  newSessionBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  newSessionBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  toolsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ovalInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 24,
    color: '#333',
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
  },
  questionBadge: {
    backgroundColor: '#4A90E2',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  questionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  typingIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  overlayTouch: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closePanelBtn: {
    padding: 8,
    marginRight: 10,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  panelContent: {
    flex: 1,
    padding: 15,
  },
  panelSection: {
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  patientAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    fontSize: 28,
  },
  patientInfo: {
    marginLeft: 15,
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rapportContainer: {
    marginTop: 10,
  },
  rapportLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  rapportBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rapportFill: {
    height: '100%',
    borderRadius: 4,
  },
  rapportValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  symptomText: {
    fontSize: 12,
    color: '#E65100',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTypeIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 10,
    minHeight: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  testResult: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 10,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B1FA2',
  },
  testScore: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  testInterpretation: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  diagnosisBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  toolsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  toolsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toolsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  toolItemDisabled: {
    opacity: 0.5,
  },
  toolIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  toolBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  toolTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  toolTitleDisabled: {
    color: '#999',
  },
  toolLock: {
    marginTop: 2,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  newSessionText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notesModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingTop: 20,
  },
  notesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  notesModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  noteTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  noteTypeBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  noteTypeBtnActive: {
    backgroundColor: '#4A90E2',
  },
  noteTypeBtnText: {
    fontSize: 14,
    color: '#666',
  },
  noteTypeBtnTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  noteInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 12,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 10,
  },
  addNoteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteBtnDisabled: {
    backgroundColor: '#B0BEC5',
  },
  notesList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  noteListItem: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  noteTypeTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  noteTypeTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  noteContent: {
    flex: 1,
  },
  noteItemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noteTimestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  noNotesText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
  testsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingTop: 20,
  },
  testsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  testsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 15,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F57C00',
    marginLeft: 5,
  },
  testsList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  testCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 10,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  testInfo: {
    flex: 1,
  },
  testItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  testCost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  testCostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginLeft: 4,
  },
  // Floating Notes Modal Styles
  modalCenteredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  floatingNotesCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  floatingNotesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingNotesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  floatingNoteTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  floatingNoteTypeBtnActive: {
    backgroundColor: 'transparent',
  },
  gradientButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingNoteTypeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  floatingNoteTypeBtnTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  floatingNoteInputContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  floatingNoteInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  floatingAddNoteBtn: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  floatingAddNoteBtnDisabled: {
    opacity: 0.5,
  },
  gradientAddButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
  },
  floatingAddNoteBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  floatingNotesList: {
    paddingHorizontal: 20,
    maxHeight: 200,
  },
  floatingNoteListItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  floatingNoteTypeTag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  floatingNoteTypeTagText: {
    fontSize: 16,
  },
  floatingNoteContent: {
    flex: 1,
  },
  floatingNoteItemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  floatingNoteTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  emptyNotesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyNotesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ChatScreen;
