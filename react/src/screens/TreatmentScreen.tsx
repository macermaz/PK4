import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useApp } from '../contexts/AppContext';
import { Case, Message } from '../types';
import { getTreatmentsByDisorder, getFirstLineTreatments, getAllTreatments, isTreatmentCorrectForDisorder, Treatment } from '../data/clinicalData';
import { IS_DEVELOPMENT } from '../config/environment';
import { getTreatmentWaitTime } from '../config/environment';

type TreatmentNavigationProp = StackNavigationProp<RootStackParamList, 'Treatment'>;
type TreatmentRouteProp = RouteProp<RootStackParamList, 'Treatment'>;

const TreatmentScreen: React.FC = () => {
  const navigation = useNavigation<TreatmentNavigationProp>();
  const route = useRoute<TreatmentRouteProp>();
  const { state, dispatch, calculateFinalScore, addMessage, generateId } = useApp();
  const { caseId } = route.params;

  const [currentCase, setCurrentCase] = useState<any>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [waitingForResult, setWaitingForResult] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Cargar caso
  useEffect(() => {
    const case_ = state.cases.find(c => c.id === caseId);
    if (case_) {
      setCurrentCase(case_);
      // Solo mostrar espera si tiene tratamiento enviado y no está en estado de fallo
      if (case_.treatmentSentDate && case_.status === 'awaiting_result') {
        setWaitingForResult(true);
        updateTimeRemaining(case_.treatmentSentDate);
      } else if (case_.status === 'treatment_failed') {
        // Segunda oportunidad: resetear para permitir nuevo tratamiento
        setWaitingForResult(false);
        setSelectedTreatment(null);
      }
    }
  }, [caseId, state.cases]);

  // Saber si es segundo intento
  const isSecondAttempt = currentCase?.treatmentAttempts === 1 && currentCase?.status === 'treatment_failed';

  // Actualizar tiempo restante
  const updateTimeRemaining = (sentDate: string) => {
    const sent = new Date(sentDate);
    const now = new Date();
    // Tiempo de espera configurado desde environment.ts
    const waitTime = getTreatmentWaitTime();
    const endTime = sent.getTime() + waitTime;
    const remaining = endTime - now.getTime();

    if (remaining <= 0) {
      // Tiempo cumplido, mostrar resultados
      setWaitingForResult(false);
      setTimeRemaining('');
      return;
    }

    const seconds = Math.ceil(remaining / 1000);
    setTimeRemaining(`${seconds}s`);
  };

  // Timer para actualizar tiempo - cada segundo para testing
  useEffect(() => {
    if (waitingForResult && currentCase?.treatmentSentDate) {
      const interval = setInterval(() => {
        updateTimeRemaining(currentCase.treatmentSentDate);
      }, 1000); // Cada segundo para testing

      return () => clearInterval(interval);
    }
  }, [waitingForResult, currentCase]);

  // Obtener tratamientos - en DEV muestra todos, en PROD solo los sugeridos
  const getSuggestedTreatments = (): Treatment[] => {
    if (!currentCase?.diagnosis) return [];

    if (IS_DEVELOPMENT) {
      // En modo desarrollo, mostrar TODOS los tratamientos
      return getAllTreatments();
    }

    // En producción, obtener tratamientos de primera línea para el diagnóstico
    const treatments = getFirstLineTreatments(currentCase.diagnosis);

    // Si no hay tratamientos específicos, buscar por todos los tratamientos del trastorno
    if (treatments.length === 0) {
      return getTreatmentsByDisorder(currentCase.diagnosis);
    }

    return treatments;
  };

  // Verificar si un tratamiento es el correcto (para mostrar etiqueta DEV)
  const isCorrectTreatment = (treatmentId: string): boolean => {
    if (!currentCase?.patient?.disorder) return false;
    return isTreatmentCorrectForDisorder(treatmentId, currentCase.patient.disorder);
  };

  // Respuestas automáticas del paciente según personalidad
  const getPatientAcceptanceResponse = (): string => {
    if (!currentCase?.patient) return 'De acuerdo, lo intentaré.';

    const personality = currentCase.patient.personality?.toLowerCase() || '';
    const name = currentCase.patient.name || 'Paciente';

    const responses: { [key: string]: string[] } = {
      ansioso: [
        'No sé si podré hacerlo bien, pero... vale, lo intentaré. ¿Y si no funciona?',
        'Me da un poco de miedo empezar, pero confío en usted. Lo intentaré.',
        'Espero poder seguir todo esto... Lo voy a intentar, de verdad.',
      ],
      depresivo: [
        'Supongo que puedo intentarlo... aunque no creo que cambie nada.',
        'Vale... lo intentaré, aunque no tengo muchas esperanzas.',
        'De acuerdo. No sé si tengo fuerzas, pero lo intentaré.',
      ],
      irritable: [
        'Vale, vale, lo haré. Pero si no funciona, quiero que lo sepas.',
        'Está bien, supongo que no pierdo nada por intentarlo.',
        'Ok, vamos a probar esto. Espero que funcione.',
      ],
      evitativo: [
        'Mm... de acuerdo. Intentaré seguir las indicaciones.',
        'Bueno, si usted cree que es lo mejor... lo intentaré.',
        'Vale, haré lo que pueda...',
      ],
      perfeccionista: [
        'Entendido. Seguiré las indicaciones al pie de la letra.',
        'De acuerdo, me comprometo a seguir el plan exactamente como indica.',
        'Perfecto, lo haré tal cual me lo plantea.',
      ],
      default: [
        'De acuerdo, doctor/a. Haré todo lo posible por seguir el tratamiento.',
        'Gracias por el plan. Lo intentaré con todas mis fuerzas.',
        'Vale, voy a ponerme con ello. Gracias.',
      ],
    };

    // Buscar respuestas según personalidad
    for (const [trait, resps] of Object.entries(responses)) {
      if (trait !== 'default' && personality.includes(trait)) {
        return resps[Math.floor(Math.random() * resps.length)];
      }
    }

    return responses.default[Math.floor(Math.random() * responses.default.length)];
  };

  // Enviar tratamiento
  const sendTreatment = () => {
    if (!selectedTreatment) {
      Alert.alert('Selecciona un tratamiento', 'Debes seleccionar un enfoque terapéutico.');
      return;
    }

    const treatments = getSuggestedTreatments();
    const treatment = treatments.find((t: Treatment) => t.id === selectedTreatment);

    Alert.alert(
      'Enviar propuesta de tratamiento',
      `¿Confirmas enviar "${treatment?.name}" como propuesta terapéutica?\n\nEl paciente responderá en 48 horas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            const treatmentData = `${treatment?.name}\n\nTécnicas: ${treatment?.techniques.join(', ')}\n\nNotas adicionales: ${customNotes || 'Ninguna'}`;
            const currentAttempts = currentCase?.treatmentAttempts || 0;

            // 1. Añadir mensaje del usuario enviando el plan de tratamiento como "archivo"
            const treatmentMessage: Message = {
              id: generateId(),
              text: `📎 Plan de tratamiento enviado:\n\n🏷️ ${treatment?.name}\n\n📋 Técnicas recomendadas:\n${treatment?.techniques.map((t: string) => `• ${t}`).join('\n')}\n\n📝 Indicaciones: ${customNotes || 'Seguir plan según indicaciones estándar.'}`,
              sender: 'user',
              timestamp: new Date(),
              type: 'text',
            };
            addMessage(caseId, treatmentMessage);

            // 2. Respuesta automática del paciente aceptando intentar el tratamiento
            setTimeout(() => {
              const patientResponse: Message = {
                id: generateId(),
                text: getPatientAcceptanceResponse(),
                sender: 'patient',
                timestamp: new Date(),
                type: 'text',
              };
              addMessage(caseId, patientResponse);
            }, 1500);

            // 3. Actualizar estado del caso
            dispatch({
              type: 'UPDATE_CASE',
              payload: {
                id: caseId,
                updates: {
                  treatment: treatmentData,
                  treatmentSentDate: new Date().toISOString(),
                  treatmentAttempts: currentAttempts + 1,
                  status: 'awaiting_result',
                },
              },
            });

            setWaitingForResult(true);
            updateTimeRemaining(new Date().toISOString());

            // 4. Navegar de vuelta y mostrar notificación
            navigation.goBack();

            // 5. En DEV: tras 10 segundos, simular notificación de chat nuevo con resultado
            const resultWaitTime = IS_DEVELOPMENT ? 10000 : getTreatmentWaitTime();
            setTimeout(() => {
              // Actualizar unreadCount para indicar nuevo mensaje
              dispatch({
                type: 'UPDATE_CASE',
                payload: {
                  id: caseId,
                  updates: { unreadCount: 1 },
                },
              });
            }, resultWaitTime);
          },
        },
      ]
    );
  };

  // Verificar si el tratamiento es correcto basándose en el diagnóstico
  const isTreatmentCorrect = (): boolean => {
    if (!currentCase) return false;

    // Obtener tratamientos de primera línea para el diagnóstico REAL (no el del usuario)
    const correctTreatments = getFirstLineTreatments(currentCase.patient.disorder);
    const allTreatments = getTreatmentsByDisorder(currentCase.patient.disorder);

    // Verificar si el tratamiento seleccionado está en la lista de tratamientos válidos
    const treatmentName = currentCase.treatment?.split('\n')[0] || '';

    // Es correcto si está en primera línea o en tratamientos válidos para el trastorno real
    const isFirstLine = correctTreatments.some(t => t.name === treatmentName);
    const isValid = allTreatments.some(t => t.name === treatmentName);

    // Si el diagnóstico fue correcto, tratamiento de primera línea = éxito seguro
    // Si el diagnóstico fue incorrecto pero el tratamiento sirve = 50% de éxito
    if (currentCase.diagnosisCorrect) {
      return isFirstLine || (isValid && Math.random() > 0.3);
    } else {
      // Diagnóstico incorrecto: el tratamiento puede funcionar por suerte (20%)
      return isValid && Math.random() > 0.8;
    }
  };

  // Procesar resultado del tratamiento (después del tiempo de espera)
  const checkTreatmentResult = () => {
    if (!currentCase) return;

    const isSuccess = isTreatmentCorrect();
    const isFirstAttempt = (currentCase.treatmentAttempts || 1) === 1;
    const diagnosisWasCorrect = currentCase.diagnosisCorrect || false;

    if (isSuccess) {
      // ÉXITO: Tratamiento correcto
      const xpGained = isFirstAttempt ? 60 : 35;
      const coinsGained = isFirstAttempt ? 25 : 12;

      // Crear una copia del caso actualizada para calcular la puntuación final
      const updatedCase: Case = {
        ...currentCase,
        treatmentCorrect: true,
        treatmentAttempts: currentCase.treatmentAttempts || 1,
        status: 'completed',
      };

      // Calcular puntuación final
      const finalScore = calculateFinalScore(updatedCase);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: caseId,
          updates: {
            treatmentCorrect: true,
            status: 'completed',
            finalScore,
          },
        },
      });

      dispatch({
        type: 'COMPLETE_CASE',
        payload: {
          caseId,
          correct: true,
          xpGained,
          coinsGained,
        },
      });

      navigation.navigate('Results', {
        correct: true,
        xpGained,
        coinsGained,
        diagnosis: currentCase.diagnosis || 'No especificado',
        caseId,
      });

    } else if (isFirstAttempt) {
      // FALLO PRIMER INTENTO: Segunda oportunidad
      const rapportLoss = 15;
      const newRapport = Math.max(0, currentCase.rapport - rapportLoss);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: caseId,
          updates: {
            treatmentCorrect: false,
            status: 'treatment_failed',
            rapport: newRapport,
            treatment: null,
            treatmentSentDate: null,
          },
        },
      });

      // Mostrar mensaje del paciente
      Alert.alert(
        'Respuesta del paciente',
        `"No siento que este tratamiento se ajuste a mis necesidades. Me gustaría explorar otras opciones."\n\n📉 Rapport: -${rapportLoss}%\n\nTienes una segunda oportunidad para proponer otro tratamiento.`,
        [
          {
            text: 'Proponer otro tratamiento',
            onPress: () => {
              setWaitingForResult(false);
              setSelectedTreatment(null);
              setCustomNotes('');
            },
          },
        ]
      );

    } else {
      // FALLO SEGUNDO INTENTO: Perder partida
      const rapportLoss = 30;
      const newRapport = Math.max(0, currentCase.rapport - rapportLoss);

      // Crear una copia del caso actualizada para calcular la puntuación final
      const updatedCase: Case = {
        ...currentCase,
        treatmentCorrect: false,
        treatmentAttempts: 2,
        status: 'failed',
        rapport: newRapport,
      };

      // Calcular puntuación final (aunque sea fallo)
      const finalScore = calculateFinalScore(updatedCase);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: caseId,
          updates: {
            treatmentCorrect: false,
            status: 'failed',
            rapport: newRapport,
            finalScore,
          },
        },
      });

      const xpGained = 10; // XP mínimo por intentarlo
      const coinsGained = 0;

      dispatch({
        type: 'COMPLETE_CASE',
        payload: {
          caseId,
          correct: false,
          xpGained,
          coinsGained,
        },
      });

      navigation.navigate('Results', {
        correct: false,
        xpGained,
        coinsGained,
        diagnosis: currentCase.diagnosis || 'No especificado',
        caseId,
      });
    }
  };

  if (!currentCase) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  // Vista de espera
  if (waitingForResult && timeRemaining) {
    return (
      <LinearGradient
        colors={['#FF9800', '#F57C00']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.content}>
          <View style={styles.waitingContainer}>
            <View style={styles.waitingIcon}>
              <Icon name="clock-o" size={60} color="white" />
            </View>
            <Text style={styles.waitingTitle}>Tratamiento en progreso</Text>
            <Text style={styles.waitingSubtitle}>
              El paciente está evaluando tu propuesta terapéutica
            </Text>

            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>Tiempo restante</Text>
              <Text style={styles.timerValue}>{timeRemaining}</Text>
            </View>

            <View style={styles.treatmentSummary}>
              <Text style={styles.summaryTitle}>Propuesta enviada:</Text>
              <Text style={styles.summaryText}>{currentCase.treatment}</Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={16} color="white" />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Si ya pasó el tiempo, mostrar botón para ver resultados
  if (currentCase.treatmentSentDate && !timeRemaining) {
    return (
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.content}>
          <View style={styles.waitingContainer}>
            <View style={styles.waitingIcon}>
              <Icon name="check-circle" size={60} color="white" />
            </View>
            <Text style={styles.waitingTitle}>Resultados disponibles</Text>
            <Text style={styles.waitingSubtitle}>
              El paciente ha respondido a tu propuesta de tratamiento
            </Text>

            <TouchableOpacity
              style={styles.resultsButton}
              onPress={checkTreatmentResult}
            >
              <Icon name="eye" size={18} color="#4CAF50" />
              <Text style={styles.resultsButtonText}>Ver resultados</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const treatments = getSuggestedTreatments();

  return (
    <LinearGradient
      colors={['#4CAF50', '#388E3C']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Propuesta de tratamiento</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info del caso */}
        <View style={styles.caseInfo}>
          <View style={styles.patientAvatar}>
            <Text style={styles.avatarText}>{currentCase.patient.avatar}</Text>
          </View>
          <View style={styles.caseDetails}>
            <Text style={styles.patientName}>{currentCase.patient.name}</Text>
            <Text style={styles.diagnosisLabel}>Diagnóstico:</Text>
            <Text style={styles.diagnosisText}>{currentCase.diagnosis}</Text>
          </View>
        </View>

        {/* Tratamientos sugeridos */}
        <Text style={styles.sectionTitle}>Tratamientos basados en evidencia</Text>

        {treatments.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontStyle: 'italic' }}>
              No hay tratamientos específicos para este diagnóstico
            </Text>
          </View>
        ) : treatments.map((treatment: Treatment) => (
          <TouchableOpacity
            key={treatment.id}
            style={[
              styles.treatmentCard,
              selectedTreatment === treatment.id && styles.treatmentCardSelected,
            ]}
            onPress={() => setSelectedTreatment(treatment.id)}
          >
            <View style={styles.treatmentHeader}>
              <View style={[
                styles.radioButton,
                selectedTreatment === treatment.id && styles.radioButtonSelected,
              ]}>
                {selectedTreatment === treatment.id && (
                  <Icon name="check" size={12} color="white" />
                )}
              </View>
              <View style={styles.treatmentInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={styles.treatmentName}>{treatment.name}</Text>
                  {IS_DEVELOPMENT && isCorrectTreatment(treatment.id) && (
                    <View style={styles.devCorrectTag}>
                      <Text style={styles.devCorrectText}>DEV ✓</Text>
                    </View>
                  )}
                </View>
                <View style={styles.effectivenessTag}>
                  <Text style={styles.effectivenessText}>
                    Eficacia: {treatment.effectiveness}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.treatmentDescription}>{treatment.description}</Text>

            <View style={styles.treatmentMeta}>
              <Icon name="clock-o" size={12} color="#666" />
              <Text style={styles.metaText}>{treatment.duration}</Text>
            </View>

            {selectedTreatment === treatment.id && (
              <View style={styles.techniquesContainer}>
                <Text style={styles.techniquesTitle}>Técnicas principales:</Text>
                <View style={styles.techniquesList}>
                  {treatment.techniques.map((technique: string, index: number) => (
                    <View key={index} style={styles.techniqueTag}>
                      <Text style={styles.techniqueText}>{technique}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Notas adicionales */}
        <Text style={styles.sectionTitle}>Notas adicionales</Text>
        <TextInput
          style={styles.notesInput}
          value={customNotes}
          onChangeText={setCustomNotes}
          placeholder="Añade consideraciones específicas para este caso..."
          placeholderTextColor="#999"
          multiline
          maxLength={300}
        />

        {/* Advertencia */}
        <View style={styles.warningCard}>
          <Icon name="info-circle" size={20} color="#FF9800" />
          <Text style={styles.warningText}>
            Una vez enviada la propuesta, el paciente tardará 48 horas en evaluar
            el tratamiento. Recibirás una valoración basada en la adecuación del enfoque.
          </Text>
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            !selectedTreatment && styles.sendButtonDisabled,
          ]}
          onPress={sendTreatment}
          disabled={!selectedTreatment}
        >
          <Icon name="paper-plane" size={18} color="white" />
          <Text style={styles.sendButtonText}>Enviar propuesta de tratamiento</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  content: {
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerPlaceholder: {
    width: 36,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  caseInfo: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 28,
  },
  caseDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  diagnosisLabel: {
    fontSize: 12,
    color: '#666',
  },
  diagnosisText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  treatmentCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  treatmentCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  effectivenessTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  effectivenessText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  devCorrectTag: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  devCorrectText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
  },
  treatmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  treatmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  techniquesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  techniquesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  techniquesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  techniqueTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  techniqueText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    lineHeight: 20,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 10,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  waitingIcon: {
    marginBottom: 25,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  timerCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
  },
  treatmentSummary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  resultsButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default TreatmentScreen;
