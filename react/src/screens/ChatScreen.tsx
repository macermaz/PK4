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
  SafeAreaView,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { useAI } from '../contexts/AIContext';
import { RootStackParamList } from '../types/navigation';
import { Case, Message } from '../types';
import Icon from 'react-native-vector-icons/FontAwesome';
import { patientGreetings, contextualResponses } from '../data/mockData';

type ChatNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { state, dispatch, addMessage } = useApp();
  const { generateResponse } = useAI();
  const { caseId } = route.params;
  
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [questionsCount, setQuestionsCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Cargar caso actual
  useEffect(() => {
    const case_ = state.cases.find(c => c.id === caseId);
    if (case_) {
      setCurrentCase(case_);
      setQuestionsCount(case_.messages.filter(m => m.sender === 'user').length);
      
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

  // Añadir mensaje inicial
  const addInitialMessage = async (case_: Case) => {
    const greeting = patientGreetings[Math.floor(Math.random() * patientGreetings.length)];
    const initialMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text: greeting,
      sender: 'patient',
      timestamp: new Date(),
      type: 'text',
    };
    
    addMessage(case_.id, initialMessage);
  };

  // Enviar mensaje
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentCase || questionsCount >= 5 || isLoading) {
      return;
    }

    setIsLoading(true);
    
    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text: messageInput,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };
    
    addMessage(currentCase.id, userMessage);
    setMessageInput('');
    setQuestionsCount(prev => prev + 1);

    try {
      // Generar respuesta con IA
      const aiResponse = await generateResponse(messageInput, currentCase);
      
      const patientMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: aiResponse.response,
        sender: 'patient',
        timestamp: new Date(),
        type: 'text',
        score: aiResponse.score,
        color: aiResponse.color,
      };
      
      addMessage(currentCase.id, patientMessage);
      
      // Actualizar caso
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
          updates: {
            sessionId: aiResponse.sessionId,
          },
        },
      });

    } catch (error) {
      console.error('Error generando respuesta:', error);
      
      // Respuesta de fallback
      const fallbackMessage = generateFallbackResponse(messageInput, currentCase.patient);
      const patientMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: fallbackMessage,
        sender: 'patient',
        timestamp: new Date(),
        type: 'text',
      };
      
      addMessage(currentCase.id, patientMessage);
    }

    setIsLoading(false);
  };

  // Respuesta de fallback
  const generateFallbackResponse = (message: string, patient: any): string => {
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

  // Renderizar mensaje
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.message, isUser ? styles.messageSent : styles.messageReceived]}>
        <View style={[styles.messageBubble, isUser ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={[styles.messageText, isUser ? styles.textSent : styles.textReceived]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isUser ? styles.timeSent : styles.timeReceived]}>
              {new Date(item.timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {item.score && (
              <Text style={[styles.messageScore, { color: getScoreColor(item.score) }]}>
                {item.score}/100
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Color según score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FFC107';
    return '#f44336';
  };

  // Menú inter-sesiones
  const SessionMenu = () => {
    const slideAnim = useState(new Animated.Value(300))[0];

    useEffect(() => {
      if (showMenu) {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [showMenu]);

    const menuItems = [
      {
        id: 'newSession',
        title: 'Nueva sesión',
        icon: 'plus-circle',
        onPress: () => startNewSession(),
      },
      {
        id: 'diagnosisTool',
        title: 'Herramienta diagnóstico',
        icon: 'stethoscope',
        onPress: () => openDiagnosisTool(),
      },
      {
        id: 'saveExit',
        title: 'Guardar y salir',
        icon: 'save',
        onPress: () => saveAndExit(),
      },
      {
        id: 'cancelCase',
        title: 'Anular caso',
        icon: 'trash',
        onPress: () => cancelCase(),
        destructive: true,
      },
    ];

    const startNewSession = () => {
      if (!currentCase) return;
      
      // Incrementar sesión
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
          updates: { sessions: currentCase.sessions + 1 },
        },
      });
      
      // Reiniciar contador de preguntas
      setQuestionsCount(0);
      
      // Añadir mensaje de inicio
      const responses = [
        "Regular, he estado pensando en lo que hablamos la última vez...",
        "Bien, aunque todavía tengo algunas dudas sobre lo que me dijiste",
        "La semana ha sido difícil, pero quiero seguir trabajando en esto",
        "Mejor, gracias. He estado reflexionando sobre nuestra conversación",
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      const message: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: response,
        sender: 'patient',
        timestamp: new Date(),
        type: 'text',
      };
      
      addMessage(currentCase.id, message);
      setShowMenu(false);
    };

    const openDiagnosisTool = () => {
      setShowMenu(false);
      navigation.navigate('Diagnosis', { caseId: currentCase!.id });
    };

    const saveAndExit = () => {
      setShowMenu(false);
      navigation.goBack();
    };

    const cancelCase = () => {
      // Mostrar confirmación
      Alert.alert(
        'Anular caso',
        '¿Estás seguro de que quieres anular este caso? Se perderá todo el progreso.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Anular',
            style: 'destructive',
            onPress: () => {
              dispatch({
                type: 'UPDATE_CASE',
                payload: {
                  id: currentCase!.id,
                  updates: { status: 'cancelled' as const },
                },
              });
              navigation.goBack();
            },
          },
        ]
      );
      setShowMenu(false);
    };

    return (
      <Modal
        transparent
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <Animated.View
            style={[styles.menuContainer, { transform: [{ translateY: slideAnim }] }]}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, item.destructive && styles.menuItemDestructive]}
                onPress={item.onPress}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  color={item.destructive ? '#FF3B30' : '#4A90E2'}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuText, item.destructive && styles.menuTextDestructive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (!currentCase) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#4A90E2', '#357abd']}
      style={styles.container}
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
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{currentCase.patient.name}</Text>
            <Text style={styles.headerStatus}>En línea</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="phone" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="video-camera" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaViewRN>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Mensajes */}
        <FlatList
          ref={flatListRef}
          data={currentCase.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          {/* Contador de preguntas */}
          <View style={styles.questionCounter}>
            <Text style={styles.counterText}>
              {5 - questionsCount} preguntas restantes
            </Text>
          </View>

          {/* Campo de entrada */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              editable={!isLoading && questionsCount < 5}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={!messageInput.trim() || isLoading || questionsCount >= 5}
              >
                <Icon name="paper-plane" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(true)}
              >
                <Icon name="plus" size={18} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Indicador de carga */}
          {isLoading && (
            <View style={styles.loadingIndicator}>
              <Text style={styles.loadingText}>Escribiendo...</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Menú inter-sesiones */}
      <SessionMenu />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4A90E2',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  headerStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  message: {
    marginVertical: 4,
  },
  messageSent: {
    alignItems: 'flex-end',
  },
  messageReceived: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  bubbleSent: {
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#E5E5EA',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'System',
  },
  textSent: {
    color: 'white',
  },
  textReceived: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'System',
  },
  timeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeReceived: {
    color: '#666',
  },
  messageScore: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'System',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  questionCounter: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
  },
  counterText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'System',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'System',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    alignItems: 'center',
    marginTop: 5,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemDestructive: {
    backgroundColor: '#fff5f5',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'System',
  },
  menuTextDestructive: {
    color: '#FF3B30',
  },
});

// Función auxiliar para Alert (no incluida en React Native)
const Alert = {
  alert: (title: string, message: string, buttons: any[]) => {
    // En producción, usar react-native-alert o similar
    console.log(`Alert: ${title} - ${message}`);
    if (buttons[1]?.onPress) {
      buttons[1].onPress();
    }
  },
};

export default ChatScreen;