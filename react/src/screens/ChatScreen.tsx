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
import { RootStackParamList } from '../types/navigation';
import { Case, Message, CaseNote } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';
import { patientGreetings } from '../data/mockData';
import { getTestsByDifficulty, generateTestReport, PsychTest } from '../data/clinicalData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.85;

// Saludos profesionales del terapeuta
const therapistGreetings = [
  "Buenos días, soy el/la profesional que le atenderá hoy. ¿Tiene unos minutos para hablar?",
  "Hola, bienvenido/a. Soy su terapeuta asignado/a. ¿Cómo se encuentra hoy?",
  "Buenos días. Me alegra que haya venido. ¿Podemos comenzar la sesión?",
  "Hola, gracias por venir. Estoy aquí para escucharle. ¿Cómo le va?",
  "Bienvenido/a a consulta. Soy quien le acompañará en este proceso. ¿Qué le trae hoy?",
];

// Mensajes automáticos contextuales según el trastorno
const getContextualAutoMessage = (disorder: string, messagesCount: number): string => {
  const disorderMessages: Record<string, string[]> = {
    'depresion_mayor': [
      "A veces me cuesta encontrar las palabras...",
      "Disculpe, estaba pensando en lo que me preguntó...",
      "Es difícil hablar de esto, pero lo intento...",
      "Me quedé pensando... perdón por el silencio.",
    ],
    'trastorno_ansiedad_generalizada': [
      "Perdón, me puse nervioso/a pensando en qué decir...",
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
      "Perdón, me cuesta hablar de mí mismo/a...",
      "Disculpe, me pongo nervioso/a en estas situaciones...",
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
    "Perdón, me quedé pensativo/a...",
  ];

  const messages = disorderMessages[disorder] || genericMessages;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Mensaje de disculpa al cancelar caso
const getCancellationMessage = (patientName: string): string => {
  const messages = [
    `Estimado/a ${patientName}, lamentablemente debo derivar su caso a otro profesional. Le deseo lo mejor en su proceso terapéutico.`,
    `${patientName}, por razones profesionales, su caso será atendido por otro colega. Gracias por su confianza.`,
    `Apreciado/a ${patientName}, le informo que derivaré su caso. Otro profesional continuará su atención.`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

type ChatNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { state, dispatch, addMessage, generateId } = useApp();
  const { generateResponse, detectLifeAspects } = useAI();
  const { caseId } = route.params;

  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [questionsCount, setQuestionsCount] = useState(0);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
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
    // Primero el terapeuta saluda profesionalmente
    const therapistGreeting = therapistGreetings[Math.floor(Math.random() * therapistGreetings.length)];
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

    // Después de 2-4 segundos, el paciente responde
    setTimeout(() => {
      const patientGreeting = patientGreetings[Math.floor(Math.random() * patientGreetings.length)];
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
          case_.messages.length
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

  // Herramientas disponibles
  const tools = [
    {
      id: 'diagnosis',
      title: 'Diagnóstico',
      icon: 'stethoscope',
      color: '#9C27B0',
      onPress: () => {
        setShowToolsMenu(false);
        navigation.navigate('Diagnosis', { caseId: currentCase!.id });
      },
    },
    {
      id: 'tests',
      title: 'Tests',
      icon: 'clipboard',
      color: '#2196F3',
      onPress: () => {
        setShowToolsMenu(false);
        setShowTestsModal(true);
      },
      badge: state.user.coins,
    },
    {
      id: 'notes',
      title: 'Notas',
      icon: 'pencil',
      color: '#FF9800',
      onPress: () => {
        setShowToolsMenu(false);
        setShowNotesModal(true);
      },
      badge: currentCase?.notes?.length || 0,
    },
    {
      id: 'treatment',
      title: 'Tratamiento',
      icon: 'medkit',
      color: '#4CAF50',
      disabled: !currentCase?.diagnosis,
      onPress: () => {
        if (!currentCase?.diagnosis) {
          Alert.alert('Diagnóstico requerido', 'Debes realizar un diagnóstico antes de proponer un tratamiento.');
          return;
        }
        setShowToolsMenu(false);
        navigation.navigate('Treatment', { caseId: currentCase!.id });
      },
    },
  ];

  // Tests disponibles según dificultad del caso
  const getAvailableTests = (): PsychTest[] => {
    if (!currentCase) return [];
    return getTestsByDifficulty(currentCase.difficulty);
  };

  // Verificar si se pueden aplicar tests
  const canApplyTests = (): boolean => {
    if (!currentCase) return false;
    const testsCount = currentCase.testsApplied?.length || 0;
    return questionsCount >= 5 && testsCount < 2;
  };

  const getTestsRemaining = (): number => {
    if (!currentCase) return 0;
    return 2 - (currentCase.testsApplied?.length || 0);
  };

  const applyTest = (test: PsychTest) => {
    // Verificar que se hayan hecho las 5 preguntas
    if (questionsCount < 5) {
      Alert.alert(
        'Sesión incompleta',
        'Debes completar las 5 preguntas de la sesión antes de aplicar tests psicológicos.'
      );
      return;
    }

    // Verificar límite de 2 tests
    const testsCount = currentCase?.testsApplied?.length || 0;
    if (testsCount >= 2) {
      Alert.alert(
        'Límite de tests alcanzado',
        'Solo puedes aplicar un máximo de 2 tests por caso.'
      );
      return;
    }

    // Verificar si el test ya fue aplicado
    if (currentCase?.testsApplied?.includes(test.id)) {
      Alert.alert('Test ya aplicado', `Ya has aplicado ${test.name} a este paciente.`);
      return;
    }

    if (state.user.coins < test.cost) {
      Alert.alert('Monedas insuficientes', `Necesitas ${test.cost} monedas para aplicar ${test.name}`);
      return;
    }

    Alert.alert(
      `Aplicar ${test.name}`,
      `¿Deseas aplicar ${test.fullName} por ${test.cost} monedas?\n\nEvalúa: ${test.evaluates}\nÍtems: ${test.items}\n\nTests restantes: ${2 - testsCount - 1}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => {
            dispatch({ type: 'SPEND_COINS', payload: test.cost });

            // Generar resultado realista según dificultad y trastorno del paciente
            const testResult = generateTestReport(
              test.id,
              currentCase!.difficulty,
              currentCase!.patient.disorder
            );

            const result = {
              testId: test.id,
              testName: test.name,
              score: testResult.score,
              interpretation: testResult.interpretation,
              date: new Date().toISOString(),
            };

            // Actualizar tests aplicados (array)
            const updatedTestsApplied = [...(currentCase!.testsApplied || []), test.id];
            const updatedTestsResults = [...(currentCase!.testsResults || []), result];

            dispatch({
              type: 'UPDATE_CASE',
              payload: {
                id: currentCase!.id,
                updates: {
                  testsApplied: updatedTestsApplied,
                  testsResults: updatedTestsResults,
                },
              },
            });

            // Añadir mensaje de que se envió el test
            const sendTestMessage: Message = {
              id: generateId(),
              text: `📋 He enviado el cuestionario ${test.name} (${test.fullName}) para que lo complete.`,
              sender: 'user',
              timestamp: new Date(),
              type: 'text',
            };
            addMessage(currentCase!.id, sendTestMessage);

            // En modo dev, respuesta rápida (5 segundos), en prod 2 minutos
            const waitTime = DEV_MODE ? 5000 : 120000;

            if (testNotificationTimeoutRef.current) {
              clearTimeout(testNotificationTimeoutRef.current);
            }

            testNotificationTimeoutRef.current = setTimeout(() => {
              // Mensaje con los resultados del test
              const resultMessage: Message = {
                id: generateId(),
                text: `📋 Resultados de ${test.name}:\n\n${testResult.interpretation}`,
                sender: 'patient',
                timestamp: new Date(),
                type: 'results',
                score: testResult.score,
              };
              addMessage(currentCase!.id, resultMessage);

              // Después de 2 segundos, mensaje pidiendo nueva sesión
              setTimeout(() => {
                const sessionRequestMessages = [
                  `Doctor/a, me gustaría hablar más sobre esto en nuestra próxima sesión. ¿Cuándo podemos vernos?`,
                  `Creo que necesito otra cita para hablar de estos resultados. Avíseme cuando pueda atenderme.`,
                  `Terminé el test. Me dejó pensando... ¿Podemos agendar otra sesión pronto?`,
                  `Ya completé todo. Tengo algunas dudas sobre lo que significa. ¿Podemos hablar en otra sesión?`,
                ];
                const sessionRequest = sessionRequestMessages[Math.floor(Math.random() * sessionRequestMessages.length)];

                const requestMessage: Message = {
                  id: generateId(),
                  text: sessionRequest,
                  sender: 'patient',
                  timestamp: new Date(),
                  type: 'text',
                };
                addMessage(currentCase!.id, requestMessage);

                // Actualizar unreadCount para indicar mensaje nuevo
                dispatch({
                  type: 'UPDATE_CASE',
                  payload: {
                    id: currentCase!.id,
                    updates: { unreadCount: 1 },
                  },
                });
              }, 2000);
            }, waitTime);

            setShowTestsModal(false);
          },
        },
      ]
    );
  };

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
        {currentCase?.batteryResults && (
          <View style={styles.panelSection}>
            <Text style={styles.sectionTitle}>
              <Icon name="clipboard" size={14} color="#9C27B0" /> Último test
            </Text>
            <View style={styles.testResult}>
              <Text style={styles.testName}>{currentCase.batteryResults.testName}</Text>
              <Text style={styles.testScore}>
                Puntuación: {currentCase.batteryResults.score}/100
              </Text>
              <Text style={styles.testInterpretation}>
                {currentCase.batteryResults.interpretation}
              </Text>
            </View>
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
                          // Enviar mensaje de disculpa/derivación
                          const cancellationMsg = getCancellationMessage(currentCase.patient.name);
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

                          // Cancelar caso después de un breve delay
                          setTimeout(() => {
                            dispatch({ type: 'CANCEL_CASE', payload: currentCase.id });
                            navigation.goBack();
                          }, 500);
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
                    style={[
                      styles.toolItem,
                      tool.disabled && styles.toolItemDisabled,
                    ]}
                    onPress={tool.onPress}
                    disabled={tool.disabled}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                      <Icon name={tool.icon} size={24} color={tool.color} />
                      {tool.badge !== undefined && tool.badge > 0 && (
                        <View style={[styles.toolBadge, { backgroundColor: tool.color }]}>
                          <Text style={styles.toolBadgeText}>{tool.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.toolTitle, tool.disabled && styles.toolTitleDisabled]}>
                      {tool.title}
                    </Text>
                    {tool.disabled && (
                      <Icon name="lock" size={12} color="#999" style={styles.toolLock} />
                    )}
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

        {/* Modal de notas */}
        <Modal
          transparent
          visible={showNotesModal}
          animationType="slide"
          onRequestClose={() => setShowNotesModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.notesModal}>
              <View style={styles.notesModalHeader}>
                <Text style={styles.notesModalTitle}>Notas del caso</Text>
                <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                  <Icon name="times" size={22} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Selector de tipo */}
              <View style={styles.noteTypeSelector}>
                {(['general', 'symptom', 'observation'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.noteTypeBtn,
                      noteType === type && styles.noteTypeBtnActive,
                    ]}
                    onPress={() => setNoteType(type)}
                  >
                    <Text style={[
                      styles.noteTypeBtnText,
                      noteType === type && styles.noteTypeBtnTextActive,
                    ]}>
                      {type === 'general' ? 'General' :
                       type === 'symptom' ? 'Síntoma' : 'Observación'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Input de nota */}
              <View style={styles.noteInputContainer}>
                <TextInput
                  style={styles.noteInput}
                  value={newNote}
                  onChangeText={setNewNote}
                  placeholder="Escribe tu nota..."
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity
                  style={[styles.addNoteBtn, !newNote.trim() && styles.addNoteBtnDisabled]}
                  onPress={addNote}
                  disabled={!newNote.trim()}
                >
                  <Icon name="plus" size={18} color="white" />
                </TouchableOpacity>
              </View>

              {/* Lista de notas */}
              <ScrollView style={styles.notesList}>
                {currentCase.notes && currentCase.notes.length > 0 ? (
                  [...currentCase.notes].reverse().map((note) => (
                    <View key={note.id} style={styles.noteListItem}>
                      <View style={[styles.noteTypeTag, {
                        backgroundColor: note.type === 'symptom' ? '#FF9800' :
                                        note.type === 'observation' ? '#2196F3' : '#9E9E9E'
                      }]}>
                        <Text style={styles.noteTypeTagText}>
                          {note.type === 'symptom' ? 'S' : note.type === 'observation' ? 'O' : 'G'}
                        </Text>
                      </View>
                      <View style={styles.noteContent}>
                        <Text style={styles.noteItemText}>{note.text}</Text>
                        <Text style={styles.noteTimestamp}>
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
                  <Text style={styles.noNotesText}>No hay notas aún</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de tests */}
        <Modal
          transparent
          visible={showTestsModal}
          animationType="slide"
          onRequestClose={() => setShowTestsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.testsModal}>
              <View style={styles.testsModalHeader}>
                <Text style={styles.testsModalTitle}>Baterías de tests</Text>
                <View style={styles.coinsDisplay}>
                  <Icon name="circle" size={14} color="#FFD700" />
                  <Text style={styles.coinsText}>{state.user.coins}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTestsModal(false)}>
                  <Icon name="times" size={22} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.testsList}>
                <Text style={styles.testCategory}>Screening (5 monedas)</Text>
                {getAvailableTests().filter((t: PsychTest) => t.category === 'screening').map((test: PsychTest) => (
                  <TouchableOpacity
                    key={test.id}
                    style={styles.testItem}
                    onPress={() => applyTest(test)}
                  >
                    <View style={styles.testInfo}>
                      <Text style={styles.testItemName}>{test.name}</Text>
                      <Text style={styles.testDescription}>{test.evaluates}</Text>
                    </View>
                    <View style={styles.testCost}>
                      <Icon name="circle" size={12} color="#FFD700" />
                      <Text style={styles.testCostText}>{test.cost}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <Text style={styles.testCategory}>Diferencial (10-15 monedas)</Text>
                {getAvailableTests().filter((t: PsychTest) => t.category === 'diferencial').map((test: PsychTest) => (
                  <TouchableOpacity
                    key={test.id}
                    style={styles.testItem}
                    onPress={() => applyTest(test)}
                  >
                    <View style={styles.testInfo}>
                      <Text style={styles.testItemName}>{test.name}</Text>
                      <Text style={styles.testDescription}>{test.evaluates}</Text>
                    </View>
                    <View style={styles.testCost}>
                      <Icon name="circle" size={12} color="#FFD700" />
                      <Text style={styles.testCostText}>{test.cost}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {getAvailableTests().filter((t: PsychTest) => t.category === 'personalidad').length > 0 && (
                  <>
                    <Text style={styles.testCategory}>Personalidad (25 monedas)</Text>
                    {getAvailableTests().filter((t: PsychTest) => t.category === 'personalidad').map((test: PsychTest) => (
                      <TouchableOpacity
                        key={test.id}
                        style={styles.testItem}
                        onPress={() => applyTest(test)}
                      >
                        <View style={styles.testInfo}>
                          <Text style={styles.testItemName}>{test.name}</Text>
                          <Text style={styles.testDescription}>{test.evaluates}</Text>
                        </View>
                        <View style={styles.testCost}>
                          <Icon name="circle" size={12} color="#FFD700" />
                          <Text style={styles.testCostText}>{test.cost}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
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
});

export default ChatScreen;
