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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useApp } from '../contexts/AppContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Case, LifeAspects } from '../types';
import SearchBar from '../components/SearchBar';
import CollapsibleCategory from '../components/CollapsibleCategory';
import SelectableCard from '../components/SelectableCard';
import SelectableChip from '../components/SelectableChip';
import {
  symptomCategories,
  disorders,
  getDisordersByDifficulty,
  Disorder,
  psychTests,
  PsychTest,
  getTreatmentsByDisorder,
  getFirstLineTreatments,
  getAllTreatments,
  isTreatmentCorrectForDisorder,
  Treatment,
} from '../data/clinicalData';
import { IS_DEVELOPMENT, getTreatmentWaitTime } from '../config/environment';

type DiagnosticToolNavigationProp = StackNavigationProp<RootStackParamList, 'DiagnosticTool'>;

// Tabs disponibles
type TabType = 'hypothesis' | 'tests' | 'diagnosis' | 'treatment';

// Configuración de categorías de diagnósticos
const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  depresivos: { label: 'Trastornos Depresivos', icon: 'cloud', color: '#5C6BC0' },
  ansiedad: { label: 'Trastornos de Ansiedad', icon: 'bolt', color: '#FF7043' },
  trauma: { label: 'Trauma y Estrés', icon: 'heartbeat', color: '#EF5350' },
  obsesivos: { label: 'TOC y Relacionados', icon: 'refresh', color: '#AB47BC' },
  alimentarios: { label: 'Trastornos Alimentarios', icon: 'cutlery', color: '#26A69A' },
  personalidad: { label: 'Trastornos de Personalidad', icon: 'user', color: '#EC407A' },
  bipolares: { label: 'Trastornos Bipolares', icon: 'exchange', color: '#FFA726' },
  sustancias: { label: 'Trastornos por Sustancias', icon: 'flask', color: '#78909C' },
  psicoticos: { label: 'Trastornos Psicóticos', icon: 'eye', color: '#7E57C2' },
  otros: { label: 'Otros Trastornos', icon: 'question-circle', color: '#90A4AE' },
};

// Mapeo de categoría del trastorno a la clave de categoryConfig
const categoryToConfigKey = (category: string): string => {
  const mapping: Record<string, string> = {
    'animo': 'depresivos',
    'ansiedad': 'ansiedad',
    'trauma': 'trauma',
    'alimentacion': 'alimentarios',
    'sustancias': 'sustancias',
    'personalidad': 'personalidad',
  };
  return mapping[category] || 'otros';
};

// Áreas de vida para explorar
const lifeAreasConfig: { key: keyof LifeAspects; label: string; icon: string; questions: string[] }[] = [
  {
    key: 'laboral',
    label: 'Situación Laboral',
    icon: 'briefcase',
    questions: ['¿Cómo le va en el trabajo?', '¿Ha tenido cambios laborales?', '¿Cómo es su relación con compañeros?']
  },
  {
    key: 'familiar',
    label: 'Situación Familiar',
    icon: 'home',
    questions: ['¿Cómo es su relación familiar?', '¿Vive solo/a?', '¿Hay conflictos familiares?']
  },
  {
    key: 'social',
    label: 'Relaciones Sociales',
    icon: 'users',
    questions: ['¿Tiene amistades cercanas?', '¿Con qué frecuencia socializa?', '¿Se siente solo/a?']
  },
  {
    key: 'ocio',
    label: 'Ocio y Hobbies',
    icon: 'gamepad',
    questions: ['¿Qué hace en su tiempo libre?', '¿Tiene hobbies?', '¿Disfruta de sus actividades?']
  },
  {
    key: 'salud',
    label: 'Salud Física',
    icon: 'heartbeat',
    questions: ['¿Tiene problemas de salud?', '¿Toma medicación?', '¿Hace ejercicio?']
  },
  {
    key: 'metas',
    label: 'Metas y Futuro',
    icon: 'compass',
    questions: ['¿Qué metas tiene?', '¿Cómo ve su futuro?', '¿Tiene planes a corto plazo?']
  },
  {
    key: 'autopercepcion',
    label: 'Autopercepción',
    icon: 'user-circle',
    questions: ['¿Cómo se describiría?', '¿Qué opina de sí mismo/a?', '¿Qué le gustaría cambiar?']
  },
  {
    key: 'trauma',
    label: 'Historia Traumática',
    icon: 'bolt',
    questions: ['¿Ha vivido eventos difíciles?', '¿Hay algo del pasado que le afecte?', '¿Ha tenido pérdidas importantes?']
  },
  {
    key: 'sueno',
    label: 'Patrón de Sueño',
    icon: 'moon-o',
    questions: ['¿Cómo duerme?', '¿Tiene pesadillas?', '¿Cuántas horas descansa?']
  },
  {
    key: 'alimentacion',
    label: 'Hábitos Alimenticios',
    icon: 'cutlery',
    questions: ['¿Cómo es su alimentación?', '¿Ha tenido cambios de peso?', '¿Come regularmente?']
  },
];

const DiagnosticToolScreen: React.FC = () => {
  const navigation = useNavigation<DiagnosticToolNavigationProp>();
  const { state, dispatch, generateId, addMessage, calculateFinalScore } = useApp();
  const { showNotification } = useNotifications();

  // Estado para la vista
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('hypothesis');

  // Estado para diagnóstico
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [hypothesis, setHypothesis] = useState<any[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('');
  const [availableDisorders, setAvailableDisorders] = useState<Disorder[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState<string>('');
  const [expandedSymptomCategories, setExpandedSymptomCategories] = useState<string[]>([]);

  // Estado para tests
  const [appliedTests, setAppliedTests] = useState<string[]>([]);

  // Estado para tratamiento
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canCheckResult, setCanCheckResult] = useState(false);

  // Obtener caso seleccionado
  const currentCase = selectedCaseId
    ? state.cases.find(c => c.id === selectedCaseId)
    : null;

  // Filtrar casos activos y archivados
  const activeCases = state.cases.filter(c =>
    ['active', 'diagnosed', 'awaiting_treatment', 'treatment_failed'].includes(c.status)
  );

  const archivedCases = state.cases.filter(c =>
    ['completed', 'failed', 'cancelled'].includes(c.status)
  );

  // Cargar datos del caso cuando se selecciona
  useEffect(() => {
    if (currentCase) {
      setSelectedSymptoms(currentCase.selectedSymptoms || []);
      setAppliedTests(currentCase.testsApplied || []);

      // Cargar diagnósticos disponibles según dificultad
      let disordersForDifficulty = getDisordersByDifficulty(currentCase.difficulty);

      // Incluir trastorno real del paciente
      const patientDisorderId = currentCase.patient?.disorder;
      if (patientDisorderId && disorders[patientDisorderId]) {
        const patientDisorder = disorders[patientDisorderId];
        if (!disordersForDifficulty.some(d => d.id === patientDisorderId)) {
          disordersForDifficulty = [...disordersForDifficulty, patientDisorder];
        }
      }

      setAvailableDisorders(disordersForDifficulty);

      if (currentCase.diagnosis) {
        setSelectedDiagnosis(currentCase.diagnosis);
      }
    }
  }, [selectedCaseId, state.cases]);

  // Actualizar hipótesis cuando cambian los síntomas
  useEffect(() => {
    if (availableDisorders.length > 0 && selectedSymptoms.length > 0) {
      updateHypothesis();
    } else {
      setHypothesis([]);
    }
  }, [selectedSymptoms, availableDisorders]);

  // Timer para resultado del tratamiento
  useEffect(() => {
    if (currentCase?.status === 'awaiting_result' && currentCase?.treatmentSentDate) {
      const updateTimer = () => {
        const sent = new Date(currentCase.treatmentSentDate!);
        const now = new Date();
        const waitTime = getTreatmentWaitTime();
        const endTime = sent.getTime() + waitTime;
        const remaining = endTime - now.getTime();

        if (remaining <= 0) {
          setCanCheckResult(true);
          setTimeRemaining('¡Listo!');
        } else {
          setCanCheckResult(false);
          const seconds = Math.ceil(remaining / 1000);
          if (seconds >= 60) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            setTimeRemaining(`${mins}m ${secs}s`);
          } else {
            setTimeRemaining(`${seconds}s`);
          }
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [currentCase?.status, currentCase?.treatmentSentDate]);

  // Verificar resultado del tratamiento
  const checkTreatmentResult = () => {
    if (!currentCase) return;

    // Determinar si el tratamiento es correcto
    const patientDisorder = currentCase.patient?.disorder;
    const attemptNumber = currentCase.treatmentAttempts || 1;
    const isFirstAttempt = attemptNumber === 1;

    // Obtener el tratamiento enviado desde el campo treatment
    const treatmentSent = currentCase.treatment?.split('\n')[0] || '';
    const isSuccess = isTreatmentCorrectForDisorder(treatmentSent, patientDisorder || '', attemptNumber);

    if (isSuccess) {
      // ÉXITO
      const xpGained = isFirstAttempt ? 60 : 35;
      const coinsGained = isFirstAttempt ? 25 : 12;

      const updatedCase = {
        ...currentCase,
        treatmentCorrect: true,
        status: 'completed' as const,
      };

      const finalScore = calculateFinalScore(updatedCase);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
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
          caseId: currentCase.id,
          correct: true,
          xpGained,
          coinsGained,
        },
      });

      showNotification({
        type: 'achievement',
        title: '¡Caso Completado!',
        body: `Has completado exitosamente el caso de ${currentCase.patient.name}`,
        icon: 'trophy',
        color: '#FFD700',
      });

      navigation.navigate('Results', {
        correct: true,
        xpGained,
        coinsGained,
        diagnosis: currentCase.diagnosis || 'No especificado',
        caseId: currentCase.id,
      });

    } else if (isFirstAttempt) {
      // FALLO PRIMER INTENTO - Segunda oportunidad
      const newRapport = Math.max(0, currentCase.rapport - 15);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
          updates: {
            treatmentCorrect: false,
            status: 'treatment_failed',
            rapport: newRapport,
            treatment: undefined,
            treatmentSentDate: undefined,
          },
        },
      });

      showNotification({
        type: 'case',
        title: 'Tratamiento No Efectivo',
        body: `${currentCase.patient.name} no ha respondido bien. Tienes una segunda oportunidad.`,
        icon: 'exclamation-triangle',
        color: '#F44336',
      });

      Alert.alert(
        'Tratamiento No Efectivo',
        'El paciente no ha respondido bien al tratamiento propuesto. Tienes una segunda oportunidad para proponer un tratamiento diferente.',
        [{ text: 'Entendido' }]
      );

      setSelectedTreatment(null);
      setCanCheckResult(false);

    } else {
      // FALLO SEGUNDO INTENTO - Caso perdido
      const updatedCase = {
        ...currentCase,
        treatmentCorrect: false,
        status: 'failed' as const,
      };

      const finalScore = calculateFinalScore(updatedCase);

      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
          updates: {
            treatmentCorrect: false,
            status: 'failed',
            finalScore,
          },
        },
      });

      showNotification({
        type: 'system',
        title: 'Caso Fallido',
        body: `El caso de ${currentCase.patient.name} no pudo ser resuelto.`,
        icon: 'times-circle',
        color: '#F44336',
      });

      navigation.navigate('Results', {
        correct: false,
        xpGained: 10,
        coinsGained: 5,
        diagnosis: currentCase.diagnosis || 'No especificado',
        caseId: currentCase.id,
      });
    }
  };

  // Alternar síntoma
  const toggleSymptom = (symptom: string) => {
    const newSymptoms = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter(s => s !== symptom)
      : [...selectedSymptoms, symptom];

    setSelectedSymptoms(newSymptoms);

    if (currentCase) {
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: currentCase.id,
          updates: { selectedSymptoms: newSymptoms },
        },
      });
    }
  };

  // Actualizar hipótesis diagnóstica
  const updateHypothesis = () => {
    const matches: any[] = [];
    availableDisorders.forEach((disorder) => {
      const matchingSymptoms = disorder.symptoms.filter((s: string) =>
        selectedSymptoms.includes(s)
      );

      if (matchingSymptoms.length > 0) {
        const percentage = (matchingSymptoms.length / disorder.criteria) * 100;
        matches.push({
          id: disorder.id,
          name: disorder.name,
          match: matchingSymptoms.length,
          total: disorder.criteria,
          percentage: percentage,
          symptoms: matchingSymptoms,
          description: disorder.description,
          duration: disorder.duration,
          category: disorder.category,
        });
      }
    });

    matches.sort((a, b) => b.percentage - a.percentage);
    setHypothesis(matches);
  };

  // Aplicar test
  const applyTest = (testId: string, cost: number) => {
    if (!currentCase) return;

    // Verificar límite de tests (máx 2)
    if (appliedTests.length >= 2) {
      Alert.alert('Límite alcanzado', 'Solo puedes aplicar 2 tests por caso.');
      return;
    }

    // Verificar monedas
    if (state.user.coins < cost) {
      Alert.alert('Monedas insuficientes', `Necesitas ${cost} monedas para este test.`);
      return;
    }

    Alert.alert(
      'Aplicar Test',
      `¿Aplicar este test por ${cost} monedas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => {
            const test = psychTests[testId];
            if (!test) return;

            // Simular resultado
            const score = Math.floor(Math.random() * test.maxScore);
            const range = test.ranges.find(r => score >= r.min && score <= r.max);

            const newTestResult = {
              testId,
              testName: test.name,
              score,
              interpretation: `${range?.label || 'N/A'} - ${test.interpretation}`,
              date: new Date().toISOString(),
            };

            const updatedTests = [...appliedTests, testId];
            const updatedResults = [...(currentCase.testsResults || []), newTestResult];

            setAppliedTests(updatedTests);

            dispatch({
              type: 'UPDATE_CASE',
              payload: {
                id: currentCase.id,
                updates: {
                  testsApplied: updatedTests,
                  testsResults: updatedResults,
                },
              },
            });

            dispatch({
              type: 'SPEND_COINS',
              payload: cost,
            });

            // Mostrar notificación
            showNotification({
              type: 'result',
              title: 'Test Aplicado',
              body: `${test.name}: ${range?.label || 'Resultado disponible'}`,
              icon: 'flask',
              color: '#9C27B0',
            });

            Alert.alert(
              'Resultado del Test',
              `${test.fullName}\n\nPuntuación: ${score}/${test.maxScore}\nInterpretación: ${range?.label}\n\n${test.interpretation}`
            );
          },
        },
      ]
    );
  };

  // Confirmar diagnóstico
  const confirmDiagnosis = () => {
    if (!selectedDiagnosis || !currentCase) return;

    const correct = selectedDiagnosis === currentCase.patient.disorder;

    Alert.alert(
      'Confirmar Diagnóstico',
      '¿Estás seguro de enviar este diagnóstico? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            dispatch({
              type: 'UPDATE_CASE',
              payload: {
                id: currentCase.id,
                updates: {
                  status: 'awaiting_treatment' as const,
                  diagnosis: selectedDiagnosis,
                  diagnosisCorrect: correct,
                },
              },
            });

            // Añadir mensaje al chat
            const diagnosisMessage = {
              id: generateId(),
              text: `📋 Diagnóstico enviado: ${disorders[selectedDiagnosis]?.name || selectedDiagnosis}`,
              sender: 'user' as const,
              timestamp: new Date(),
              type: 'text' as const,
            };
            addMessage(currentCase.id, diagnosisMessage);

            // Mostrar notificación
            showNotification({
              type: 'case',
              title: 'Diagnóstico Enviado',
              body: `${disorders[selectedDiagnosis]?.name || selectedDiagnosis} registrado para ${currentCase.patient.name}`,
              icon: 'stethoscope',
              color: '#FF9800',
            });

            Alert.alert(
              'Diagnóstico Enviado',
              'El diagnóstico ha sido registrado. Ahora puedes proceder con el tratamiento.',
              [{ text: 'OK', onPress: () => setActiveTab('treatment') }]
            );
          },
        },
      ]
    );
  };

  // Enviar tratamiento
  const sendTreatment = () => {
    if (!selectedTreatment || !currentCase) return;

    const treatments = getAllTreatments();
    const treatment = treatments.find((t: Treatment) => t.id === selectedTreatment);
    if (!treatment) return;

    Alert.alert(
      'Enviar Tratamiento',
      `¿Confirmas enviar "${treatment.name}" como propuesta terapéutica?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            const treatmentData = `${treatment.name}\n\nTécnicas: ${treatment.techniques.join(', ')}\n\nNotas: ${customNotes || 'Ninguna'}`;
            const currentAttempts = currentCase.treatmentAttempts || 0;

            // Mensaje de tratamiento
            const treatmentMessage = {
              id: generateId(),
              text: `📎 Plan de tratamiento enviado:\n\n🏷️ ${treatment.name}\n\n📋 Técnicas:\n${treatment.techniques.map((t: string) => `• ${t}`).join('\n')}\n\n📝 Indicaciones: ${customNotes || 'Seguir plan estándar.'}`,
              sender: 'user' as const,
              timestamp: new Date(),
              type: 'text' as const,
            };
            addMessage(currentCase.id, treatmentMessage);

            dispatch({
              type: 'UPDATE_CASE',
              payload: {
                id: currentCase.id,
                updates: {
                  treatment: treatmentData,
                  treatmentSentDate: new Date().toISOString(),
                  treatmentAttempts: currentAttempts + 1,
                  status: 'awaiting_result' as const,
                },
              },
            });

            // Mostrar notificación
            showNotification({
              type: 'case',
              title: 'Tratamiento Enviado',
              body: `${treatment.name} propuesto para ${currentCase.patient.name}`,
              icon: 'medkit',
              color: '#4CAF50',
            });

            Alert.alert(
              'Tratamiento Enviado',
              'El paciente evaluará tu propuesta. Recibirás una respuesta pronto.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          },
        },
      ]
    );
  };

  // Vista de selección de caso
  const renderCaseSelection = () => {
    const casesToShow = showArchived ? archivedCases : activeCases;

    return (
      <View style={styles.caseSelectionContainer}>
        {/* Tabs archivados/activos */}
        <View style={styles.archiveToggle}>
          <TouchableOpacity
            style={[styles.archiveTab, !showArchived && styles.archiveTabActive]}
            onPress={() => setShowArchived(false)}
          >
            <Icon name="folder-open" size={16} color={!showArchived ? 'white' : '#666'} />
            <Text style={[styles.archiveTabText, !showArchived && styles.archiveTabTextActive]}>
              Casos Activos ({activeCases.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.archiveTab, showArchived && styles.archiveTabActive]}
            onPress={() => setShowArchived(true)}
          >
            <Icon name="archive" size={16} color={showArchived ? 'white' : '#666'} />
            <Text style={[styles.archiveTabText, showArchived && styles.archiveTabTextActive]}>
              Archivados ({archivedCases.length})
            </Text>
          </TouchableOpacity>
        </View>

        {casesToShow.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name={showArchived ? 'archive' : 'folder-open-o'} size={60} color="#666" />
            <Text style={styles.emptyTitle}>
              {showArchived ? 'Sin casos archivados' : 'Sin casos activos'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {showArchived
                ? 'Los casos completados aparecerán aquí'
                : 'Acepta casos desde el correo para empezar'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={casesToShow}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.caseList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.caseCard,
                  item.status === 'completed' && styles.caseCardCompleted,
                  item.status === 'failed' && styles.caseCardFailed,
                ]}
                onPress={() => !showArchived && setSelectedCaseId(item.id)}
                disabled={showArchived}
              >
                <View style={styles.caseAvatar}>
                  <Text style={styles.avatarText}>{item.patient.avatar}</Text>
                </View>
                <View style={styles.caseInfo}>
                  <Text style={styles.caseName}>{item.patient.name}</Text>
                  <Text style={styles.caseOccupation}>{item.patient.occupation}</Text>
                  <View style={styles.caseStatusRow}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                    </View>
                    {item.finalScore && (
                      <View style={styles.scoreBadge}>
                        <Icon name="star" size={12} color="#FFD700" />
                        <Text style={styles.scoreText}>{item.finalScore.stars}/5</Text>
                      </View>
                    )}
                  </View>
                </View>
                {!showArchived && (
                  <Icon name="chevron-right" size={16} color="#999" />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  };

  // Obtener color de estado
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: '#4A90E2',
      diagnosed: '#FF9800',
      awaiting_treatment: '#FF9800',
      treatment_failed: '#F44336',
      awaiting_result: '#9C27B0',
      completed: '#4CAF50',
      failed: '#F44336',
      cancelled: '#9E9E9E',
    };
    return colors[status] || '#9E9E9E';
  };

  // Obtener etiqueta de estado
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: 'En evaluación',
      diagnosed: 'Diagnosticado',
      awaiting_treatment: 'Pendiente tratamiento',
      treatment_failed: 'Tratamiento fallido',
      awaiting_result: 'Esperando resultado',
      completed: 'Completado',
      failed: 'Fallido',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  // Vista de hipótesis con áreas de vida
  const renderHypothesis = () => {
    if (!currentCase) return null;

    const exploredAreas = currentCase.lifeAspectsExplored || {};
    const exploredCount = Object.values(exploredAreas).filter(Boolean).length;

    // Configuración de categorías de síntomas con iconos y colores
    const symptomCategoryConfig: Record<string, { name: string; icon: string; color: string }> = {
      emocional: { name: 'Síntomas Emocionales', icon: 'heart', color: '#FF6B6B' },
      fisico: { name: 'Síntomas Físicos', icon: 'heartbeat', color: '#4ECDC4' },
      cognitivo: { name: 'Síntomas Cognitivos', icon: 'brain', color: '#95E1D3' },
      conductual: { name: 'Síntomas Conductuales', icon: 'users', color: '#FFE66D' },
      social: { name: 'Síntomas Sociales', icon: 'group', color: '#A8E6CF' },
    };

    // Filtrar síntomas por búsqueda
    const getFilteredSymptoms = (symptoms: string[]) => {
      if (!symptomSearch) return symptoms;
      return symptoms.filter(s =>
        s.toLowerCase().includes(symptomSearch.toLowerCase())
      );
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* Áreas de vida para explorar */}
        <Text style={styles.sectionTitle}>
          <Icon name="compass" size={16} color="#4A90E2" /> Áreas de Vida a Explorar
        </Text>
        <Text style={styles.sectionSubtitle}>
          Explora estas áreas durante la entrevista para obtener información relevante
        </Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(exploredCount / 10) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{exploredCount}/10 áreas exploradas</Text>

        <View style={styles.lifeAreasGrid}>
          {lifeAreasConfig.map((area) => {
            const isExplored = exploredAreas[area.key];
            return (
              <View
                key={area.key}
                style={[
                  styles.lifeAreaCard,
                  isExplored && styles.lifeAreaExplored,
                ]}
              >
                <View style={[
                  styles.lifeAreaIcon,
                  { backgroundColor: isExplored ? '#4CAF50' : '#E0E0E0' }
                ]}>
                  <Icon name={area.icon} size={18} color={isExplored ? 'white' : '#666'} />
                </View>
                <Text style={styles.lifeAreaLabel}>{area.label}</Text>
                {isExplored && (
                  <Icon name="check-circle" size={14} color="#4CAF50" style={styles.checkIcon} />
                )}
              </View>
            );
          })}
        </View>

        {/* Síntomas detectados - DISEÑO PROFESIONAL */}
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
          <Icon name="stethoscope" size={16} color="#4A90E2" /> Síntomas Detectados
        </Text>

        {/* SearchBar */}
        <SearchBar
          value={symptomSearch}
          onChangeText={setSymptomSearch}
          placeholder="Buscar síntomas..."
        />

        {/* Contador de síntomas seleccionados */}
        <View style={styles.symptomCounter}>
          <Text style={styles.counterText}>
            {selectedSymptoms.length} síntomas seleccionados
          </Text>
          {selectedSymptoms.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedSymptoms([])}>
              <Text style={styles.clearButton}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categorías colapsables con síntomas */}
        {Object.entries(symptomCategories).map(([category, symptoms]) => {
          const categoryInfo = symptomCategoryConfig[category] || {
            name: category.charAt(0).toUpperCase() + category.slice(1),
            icon: 'circle',
            color: '#9E9E9E',
          };
          const filteredSymptoms = getFilteredSymptoms(symptoms as string[]);
          const selectedCount = filteredSymptoms.filter(s => selectedSymptoms.includes(s)).length;

          // No mostrar categoría si no tiene síntomas tras filtrar
          if (filteredSymptoms.length === 0 && symptomSearch) return null;

          return (
            <CollapsibleCategory
              key={category}
              title={categoryInfo.name}
              icon={categoryInfo.icon}
              color={categoryInfo.color}
              count={`${selectedCount}/${filteredSymptoms.length}`}
              expanded={expandedSymptomCategories.includes(category)}
              onToggle={() => {
                setExpandedSymptomCategories(prev =>
                  prev.includes(category)
                    ? prev.filter(c => c !== category)
                    : [...prev, category]
                );
              }}
            >
              <View style={styles.symptomsChipGrid}>
                {filteredSymptoms.map((symptom: string) => (
                  <SelectableChip
                    key={symptom}
                    label={symptom.replace(/_/g, ' ')}
                    selected={selectedSymptoms.includes(symptom)}
                    onPress={() => toggleSymptom(symptom)}
                    variant="default"
                    size="medium"
                  />
                ))}
              </View>
            </CollapsibleCategory>
          );
        })}

        {/* Hipótesis diagnósticas */}
        {hypothesis.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
              <Icon name="lightbulb-o" size={16} color="#FF9800" /> Hipótesis Diagnósticas
            </Text>
            {hypothesis.slice(0, 5).map((match, index) => (
              <View key={match.id} style={[
                styles.hypothesisCard,
                index === 0 && match.percentage >= 60 && styles.topHypothesis
              ]}>
                <View style={styles.hypothesisHeader}>
                  <Text style={styles.hypothesisName}>{match.name}</Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>{Math.round(match.percentage)}%</Text>
                  </View>
                </View>
                <Text style={styles.hypothesisDesc}>{match.description}</Text>
                <Text style={styles.criteriaText}>
                  {match.match}/{match.total} criterios cumplidos
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  // Vista de tests
  const renderTests = () => {
    if (!currentCase) return null;

    const testsList = Object.values(psychTests) as PsychTest[];
    const appliedTestResults = currentCase.testsResults || [];

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.coinsHeader}>
          <Icon name="certificate" size={20} color="#FFD700" />
          <Text style={styles.coinsText}>{state.user.coins} monedas</Text>
          <Text style={styles.testsLimit}>Tests aplicados: {appliedTests.length}/2</Text>
        </View>

        {/* Tests aplicados */}
        {appliedTestResults.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              <Icon name="check-circle" size={16} color="#4CAF50" /> Tests Aplicados
            </Text>
            {appliedTestResults.map((result, index) => (
              <View key={index} style={styles.appliedTestCard}>
                <View style={styles.appliedTestHeader}>
                  <Text style={styles.appliedTestName}>{result.testName}</Text>
                  <Text style={styles.appliedTestScore}>
                    Puntuación: {result.score}
                  </Text>
                </View>
                <Text style={styles.appliedTestInterpretation}>{result.interpretation}</Text>
              </View>
            ))}
          </>
        )}

        {/* Tests disponibles */}
        <Text style={[styles.sectionTitle, { marginTop: appliedTestResults.length > 0 ? 20 : 0 }]}>
          <Icon name="flask" size={16} color="#4A90E2" /> Tests Disponibles
        </Text>

        {testsList.map((test) => {
          const isApplied = appliedTests.includes(test.id);
          const canApply = !isApplied && appliedTests.length < 2 && state.user.coins >= test.cost;

          return (
            <SelectableCard
              key={test.id}
              title={test.name}
              description={`${test.fullName}\n\nEvalúa: ${test.evaluates}\n${test.items} ítems • Puntuación máx: ${test.maxScore}`}
              badge={`💎 ${test.cost}`}
              badgeColor="#FFD700"
              selected={isApplied}
              onPress={() => canApply && applyTest(test.id, test.cost)}
              disabled={!canApply}
              showCheckmark
            />
          );
        })}
      </ScrollView>
    );
  };

  // Vista de diagnóstico
  const renderDiagnosis = () => {
    if (!currentCase) return null;

    const hasDiagnosis = currentCase.status !== 'active';

    // Agrupar por categoría
    const getDisordersByCategory = (): Record<string, Disorder[]> => {
      const grouped: Record<string, Disorder[]> = {};
      availableDisorders.forEach(disorder => {
        const configKey = categoryToConfigKey(disorder.category);
        if (!grouped[configKey]) grouped[configKey] = [];
        grouped[configKey].push(disorder);
      });
      return grouped;
    };

    const groupedDisorders = getDisordersByCategory();

    return (
      <ScrollView style={styles.tabContent}>
        {hasDiagnosis ? (
          <View style={styles.diagnosisLocked}>
            <Icon name="lock" size={40} color="#FF9800" />
            <Text style={styles.lockedTitle}>Diagnóstico Enviado</Text>
            <Text style={styles.lockedText}>
              {disorders[currentCase.diagnosis!]?.name || currentCase.diagnosis}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Selecciona un diagnóstico ({availableDisorders.length} disponibles)
            </Text>

            {Object.entries(groupedDisorders).map(([category, disordersList]) => {
              const config = categoryConfig[category] || categoryConfig.otros;
              const isExpanded = expandedCategories.includes(category);

              return (
                <View key={category} style={styles.diagnosisCategory}>
                  <TouchableOpacity
                    style={[styles.categoryHeader, { borderLeftColor: config.color }]}
                    onPress={() => setExpandedCategories(prev =>
                      prev.includes(category)
                        ? prev.filter(c => c !== category)
                        : [...prev, category]
                    )}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: config.color + '20' }]}>
                      <Icon name={config.icon} size={18} color={config.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{config.label}</Text>
                      <Text style={styles.categoryCount}>{disordersList.length} diagnósticos</Text>
                    </View>
                    <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.diagnosisList}>
                      {disordersList.map((disorder) => {
                        const isSelected = selectedDiagnosis === disorder.id;
                        const matchPercentage = hypothesis.find(h => h.id === disorder.id)?.percentage;

                        return (
                          <SelectableCard
                            key={disorder.id}
                            title={disorder.name}
                            description={`${disorder.criteria} criterios • ${disorder.duration}`}
                            badge={matchPercentage !== undefined && matchPercentage > 0 ? `${Math.round(matchPercentage)}%` : undefined}
                            badgeColor={matchPercentage && matchPercentage >= 60 ? '#4CAF50' : '#FF9800'}
                            selected={isSelected}
                            onPress={() => setSelectedDiagnosis(disorder.id)}
                            showCheckmark
                          />
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {selectedDiagnosis && (
              <TouchableOpacity
                style={styles.confirmDiagnosisButton}
                onPress={confirmDiagnosis}
              >
                <Icon name="check-circle" size={18} color="white" />
                <Text style={styles.confirmButtonText}>Confirmar Diagnóstico</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  // Vista de tratamiento
  const renderTreatment = () => {
    if (!currentCase) return null;

    const canSendTreatment = ['awaiting_treatment', 'treatment_failed'].includes(currentCase.status);
    const treatments = getAllTreatments();

    // Verificar tratamiento correcto (solo en DEV)
    const isCorrectTreatment = (treatmentId: string): boolean => {
      if (!currentCase?.patient?.disorder) return false;
      const attemptNumber = currentCase.treatmentAttempts || 1;
      return isTreatmentCorrectForDisorder(treatmentId, currentCase.patient.disorder, attemptNumber);
    };

    if (currentCase.status === 'awaiting_result') {
      return (
        <View style={styles.waitingResult}>
          <Icon name={canCheckResult ? 'check-circle' : 'clock-o'} size={60} color={canCheckResult ? '#4CAF50' : '#FF9800'} />
          <Text style={styles.waitingTitle}>
            {canCheckResult ? '¡Resultado Disponible!' : 'Esperando Resultado'}
          </Text>
          <Text style={styles.waitingText}>
            {canCheckResult
              ? 'El paciente ha evaluado tu propuesta. Toca el botón para ver el resultado.'
              : 'El paciente está evaluando tu propuesta de tratamiento.'}
          </Text>
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, canCheckResult && { color: '#4CAF50' }]}>
              {timeRemaining || 'Calculando...'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkResultButton,
              !canCheckResult && styles.checkResultButtonDisabled,
            ]}
            onPress={checkTreatmentResult}
            disabled={!canCheckResult}
          >
            <Icon name="envelope-open" size={18} color="white" />
            <Text style={styles.checkResultButtonText}>
              {canCheckResult ? 'Ver Resultado' : 'Esperando...'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!canSendTreatment && currentCase.status === 'active') {
      return (
        <View style={styles.waitingResult}>
          <Icon name="exclamation-circle" size={60} color="#FF9800" />
          <Text style={styles.waitingTitle}>Diagnóstico Requerido</Text>
          <Text style={styles.waitingText}>
            Debes enviar un diagnóstico antes de proponer un tratamiento.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>
          <Icon name="medkit" size={16} color="#4CAF50" /> Propuesta de Tratamiento
        </Text>

        {currentCase.status === 'treatment_failed' && (
          <View style={styles.warningCard}>
            <Icon name="exclamation-triangle" size={20} color="#F44336" />
            <Text style={styles.warningText}>
              El tratamiento anterior no funcionó. Esta es tu segunda oportunidad.
            </Text>
          </View>
        )}

        {treatments.map((treatment) => (
          <View key={treatment.id}>
            <SelectableCard
              title={treatment.name}
              description={`${treatment.description}\n\nEficacia: ${treatment.effectiveness}`}
              badge={IS_DEVELOPMENT && isCorrectTreatment(treatment.id) ? 'DEV ✓' : undefined}
              badgeColor="#FF5722"
              selected={selectedTreatment === treatment.id}
              onPress={() => setSelectedTreatment(treatment.id)}
              showCheckmark
            />
            {selectedTreatment === treatment.id && (
              <View style={styles.techniquesContainer}>
                <Text style={styles.techniquesLabel}>Técnicas:</Text>
                <View style={styles.techniquesList}>
                  {treatment.techniques.map((tech, i) => (
                    <View key={i} style={styles.techniqueChip}>
                      <Text style={styles.techniqueText}>{tech}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notas Adicionales</Text>
        <TextInput
          style={styles.notesInput}
          value={customNotes}
          onChangeText={setCustomNotes}
          placeholder="Añade consideraciones específicas..."
          placeholderTextColor="#999"
          multiline
          maxLength={300}
        />

        <TouchableOpacity
          style={[styles.sendTreatmentButton, !selectedTreatment && styles.buttonDisabled]}
          onPress={sendTreatment}
          disabled={!selectedTreatment}
        >
          <Icon name="paper-plane" size={18} color="white" />
          <Text style={styles.sendButtonText}>Enviar Propuesta de Tratamiento</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Tabs
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'hypothesis', label: 'Hipótesis', icon: 'search' },
    { id: 'tests', label: 'Tests', icon: 'flask' },
    { id: 'diagnosis', label: 'Diagnóstico', icon: 'stethoscope' },
    { id: 'treatment', label: 'Tratamiento', icon: 'medkit' },
  ];

  return (
    <LinearGradient colors={['#4A90E2', '#357abd']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => selectedCaseId ? setSelectedCaseId(null) : navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Herramienta Diagnóstica</Text>
            {currentCase && (
              <Text style={styles.headerSubtitle}>{currentCase.patient.name}</Text>
            )}
          </View>
          {currentCase && (
            <View style={styles.rapportBadge}>
              <Icon name="heart" size={12} color="#FF4081" />
              <Text style={styles.rapportText}>{currentCase.rapport}%</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {!selectedCaseId ? (
        renderCaseSelection()
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Icon
                    name={tab.icon}
                    size={16}
                    color={activeTab === tab.id ? 'white' : '#666'}
                  />
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'hypothesis' && renderHypothesis()}
            {activeTab === 'tests' && renderTests()}
            {activeTab === 'diagnosis' && renderDiagnosis()}
            {activeTab === 'treatment' && renderTreatment()}
          </View>
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: 'transparent' },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  rapportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rapportText: { color: 'white', fontSize: 12, fontWeight: '600', marginLeft: 4 },

  // Case Selection
  caseSelectionContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  archiveToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 5,
  },
  archiveTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  archiveTabActive: { backgroundColor: '#4A90E2' },
  archiveTabText: { color: '#666', marginLeft: 8, fontWeight: '500' },
  archiveTabTextActive: { color: 'white' },
  caseList: { padding: 15, paddingTop: 0 },
  caseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseCardCompleted: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  caseCardFailed: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  caseAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#4A90E2' },
  caseInfo: { flex: 1 },
  caseName: { fontSize: 16, fontWeight: '600', color: '#333' },
  caseOccupation: { fontSize: 13, color: '#666', marginTop: 2 },
  caseStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: { color: 'white', fontSize: 11, fontWeight: '600' },
  scoreBadge: { flexDirection: 'row', alignItems: 'center' },
  scoreText: { fontSize: 12, color: '#FFD700', fontWeight: '600', marginLeft: 4 },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },

  // Tabs
  tabsContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  tabActive: { backgroundColor: '#4A90E2' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#666', marginLeft: 6 },
  tabTextActive: { color: 'white' },

  // Content
  content: { flex: 1, backgroundColor: '#f8f9fa' },
  tabContent: { flex: 1, padding: 15 },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  sectionSubtitle: { fontSize: 13, color: '#666', marginBottom: 15 },

  // Progress
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#666', marginTop: 5, marginBottom: 15 },

  // Life Areas
  lifeAreasGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  lifeAreaCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifeAreaExplored: { borderColor: '#4CAF50', borderWidth: 1 },
  lifeAreaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  lifeAreaLabel: { flex: 1, fontSize: 12, color: '#333' },
  checkIcon: { marginLeft: 4 },

  // Symptoms - NEW PROFESSIONAL DESIGN
  symptomCategory: { marginBottom: 20 },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#4A90E2', marginBottom: 10 },
  symptomCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 15,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  symptomsChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  symptomChips: { flexDirection: 'row', flexWrap: 'wrap' },
  symptomChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  symptomChipSelected: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  symptomChipText: { fontSize: 12, color: '#666' },
  symptomChipTextSelected: { color: 'white', fontWeight: '500' },

  // Hypothesis
  hypothesisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  topHypothesis: { borderLeftColor: '#FF5722' },
  hypothesisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hypothesisName: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },
  matchBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  matchText: { color: 'white', fontSize: 12, fontWeight: '600' },
  hypothesisDesc: { fontSize: 13, color: '#666', marginTop: 8, lineHeight: 18 },
  criteriaText: { fontSize: 12, color: '#4A90E2', marginTop: 6 },

  // Tests
  coinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  coinsText: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8, flex: 1 },
  testsLimit: { fontSize: 12, color: '#666' },
  appliedTestCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  appliedTestHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  appliedTestName: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  appliedTestScore: { fontSize: 13, color: '#4CAF50' },
  appliedTestInterpretation: { fontSize: 12, color: '#388E3C', marginTop: 6 },
  testCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  testCardApplied: { opacity: 0.6 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  testInfo: { flex: 1 },
  testName: { fontSize: 16, fontWeight: '600', color: '#333' },
  testFullName: { fontSize: 12, color: '#666', marginTop: 2 },
  testCost: { flexDirection: 'row', alignItems: 'center' },
  costText: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 4 },
  testEvaluates: { fontSize: 13, color: '#4A90E2', marginTop: 8 },
  testMeta: { flexDirection: 'row', marginTop: 6 },
  metaItem: { fontSize: 11, color: '#999', marginRight: 12 },
  applyButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonDisabled: { backgroundColor: '#BDBDBD' },
  applyButtonApplied: { backgroundColor: '#4CAF50' },
  applyButtonText: { color: 'white', fontWeight: '600' },
  applyButtonTextApplied: { color: 'white' },

  // Diagnosis
  diagnosisLocked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockedTitle: { fontSize: 18, fontWeight: '600', color: '#FF9800', marginTop: 15 },
  lockedText: { fontSize: 16, color: '#333', marginTop: 10, textAlign: 'center' },
  diagnosisCategory: { marginBottom: 10 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#333' },
  categoryCount: { fontSize: 11, color: '#666' },
  diagnosisList: { backgroundColor: '#f5f5f5', borderRadius: 10, marginTop: 5, padding: 8 },
  diagnosisOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  diagnosisOptionSelected: { borderWidth: 2, borderColor: '#4A90E2' },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: { borderColor: '#4CAF50', backgroundColor: '#4CAF50' },
  diagnosisInfo: { flex: 1 },
  diagnosisName: { fontSize: 14, fontWeight: '500', color: '#333' },
  diagnosisMeta: { fontSize: 11, color: '#666', marginTop: 2 },
  matchIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  matchIndicatorText: { color: 'white', fontSize: 11, fontWeight: '600' },
  confirmDiagnosisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  confirmButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },

  // Treatment
  waitingResult: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  waitingTitle: { fontSize: 20, fontWeight: '600', color: '#FF9800', marginTop: 20 },
  waitingText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 },
  timerContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  timerText: { fontSize: 24, fontWeight: '700', color: '#FF9800' },
  checkResultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 25,
  },
  checkResultButtonDisabled: { backgroundColor: '#BDBDBD' },
  checkResultButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  warningText: { flex: 1, fontSize: 13, color: '#C62828', marginLeft: 10 },
  treatmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  treatmentCardSelected: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  treatmentHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  treatmentInfo: { flex: 1 },
  treatmentNameRow: { flexDirection: 'row', alignItems: 'center' },
  treatmentName: { fontSize: 15, fontWeight: '600', color: '#333' },
  devTag: { backgroundColor: '#FF5722', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  devTagText: { color: 'white', fontSize: 10, fontWeight: '600' },
  treatmentEffectiveness: { fontSize: 12, color: '#4CAF50', marginTop: 4 },
  treatmentDescription: { fontSize: 13, color: '#666', marginTop: 10, lineHeight: 18 },
  techniquesContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  techniquesLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 },
  techniquesList: { flexDirection: 'row', flexWrap: 'wrap' },
  techniqueChip: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 8, marginBottom: 6 },
  techniqueText: { color: 'white', fontSize: 11, fontWeight: '500' },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  sendTreatmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonDisabled: { backgroundColor: '#BDBDBD' },
  sendButtonText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

export default DiagnosticToolScreen;
