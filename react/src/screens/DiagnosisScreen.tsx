import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Switch,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../contexts/AppContext';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { symptomCategories, disorders, getDisordersByDifficulty, Disorder } from '../data/clinicalData';

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
import { CaseDifficulty } from '../types';

type DiagnosisNavigationProp = StackNavigationProp<RootStackParamList, 'Diagnosis'>;
type DiagnosisRouteProp = RouteProp<RootStackParamList, 'Diagnosis'>;

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

const DiagnosisScreen: React.FC = () => {
  const route = useRoute<DiagnosisRouteProp>();
  const navigation = useNavigation<DiagnosisNavigationProp>();
  const { state, dispatch } = useApp();
  const { caseId } = route.params;

  const [currentCase, setCurrentCase] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'symptoms' | 'hypothesis' | 'diagnose'>('symptoms');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [hypothesis, setHypothesis] = useState<any[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('');
  const [availableDisorders, setAvailableDisorders] = useState<Disorder[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Cargar caso actual y diagnósticos disponibles según dificultad
  useEffect(() => {
    const case_ = state.cases.find(c => c.id === caseId);
    if (case_) {
      setCurrentCase(case_);
      setSelectedSymptoms(case_.selectedSymptoms || []);

      // Cargar diagnósticos filtrados por dificultad
      let disordersForDifficulty = getDisordersByDifficulty(case_.difficulty);

      // IMPORTANTE: Siempre incluir el trastorno real del paciente
      // para garantizar que el diagnóstico correcto sea posible
      const patientDisorderId = case_.patient?.disorder;
      if (patientDisorderId && disorders[patientDisorderId]) {
        const patientDisorder = disorders[patientDisorderId];
        const alreadyIncluded = disordersForDifficulty.some(d => d.id === patientDisorderId);
        if (!alreadyIncluded) {
          disordersForDifficulty = [...disordersForDifficulty, patientDisorder];
        }
      }

      setAvailableDisorders(disordersForDifficulty);
    }
  }, [caseId, state.cases]);

  // Actualizar hipótesis cuando cambian los síntomas o los diagnósticos disponibles
  useEffect(() => {
    if (availableDisorders.length > 0) {
      updateHypothesis();
    }
  }, [selectedSymptoms, availableDisorders]);

  // Alternar síntoma
  const toggleSymptom = (symptom: string) => {
    const newSymptoms = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter(s => s !== symptom)
      : [...selectedSymptoms, symptom];
    
    setSelectedSymptoms(newSymptoms);
    
    // Actualizar caso
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
    if (selectedSymptoms.length === 0) {
      setHypothesis([]);
      return;
    }

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

  // Confirmar diagnóstico
  const confirmDiagnosis = () => {
    if (!selectedDiagnosis || !currentCase) return;

    const correct = selectedDiagnosis === currentCase.patient.disorder;

    // Actualizar caso - guardar diagnóstico, status 'awaiting_treatment'
    // El resultado del diagnóstico se guarda pero NO se muestra hasta el tratamiento
    dispatch({
      type: 'UPDATE_CASE',
      payload: {
        id: currentCase.id,
        updates: {
          status: 'awaiting_treatment' as const,
          diagnosis: selectedDiagnosis,
          diagnosisCorrect: correct, // Se guarda pero el usuario no ve el resultado aún
        },
      },
    });

    // Navegar a tratamiento - el objetivo del juego es el tratamiento correcto
    navigation.navigate('Treatment', {
      caseId: currentCase.id,
    });
  };

  // Renderizar síntomas
  const renderSymptoms = () => (
    <ScrollView style={styles.tabContent}>
      {Object.entries(symptomCategories).map(([category, symptoms]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          <View style={styles.symptomsGrid}>
            {symptoms.map((symptom: string) => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <TouchableOpacity
                  key={symptom}
                  style={[styles.symptomButton, isSelected && styles.symptomButtonSelected]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <View style={styles.symptomContent}>
                    <Icon
                      name={isSelected ? 'check-circle' : 'circle'}
                      size={20}
                      color={isSelected ? '#4CAF50' : '#ccc'}
                      style={styles.symptomIcon}
                    />
                    <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                      {symptom.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Renderizar hipótesis
  const renderHypothesis = () => (
    <ScrollView style={styles.tabContent}>
      {hypothesis.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="search" size={60} color="#666" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Selecciona síntomas</Text>
          <Text style={styles.emptySubtitle}>
            Selecciona síntomas para ver hipótesis diagnósticas
          </Text>
        </View>
      ) : (
        hypothesis.map((match, index) => {
          const isTopMatch = index === 0 && match.percentage >= 60;
          return (
            <View key={match.id} style={[styles.hypothesisCard, isTopMatch && styles.topMatchCard]}>
              <View style={styles.hypothesisHeader}>
                <View style={styles.hypothesisTitleContainer}>
                  <Text style={styles.hypothesisName}>{match.name}</Text>
                  {isTopMatch && (
                    <View style={styles.topMatchBadge}>
                      <Text style={styles.topMatchText}>🔥 Principal</Text>
                    </View>
                  )}
                </View>
                <View style={styles.matchPercentage}>
                  <View style={styles.percentageBar}>
                    <View
                      style={[styles.percentageFill, { width: `${Math.min(match.percentage, 100)}%` }]}
                    />
                  </View>
                  <Text style={styles.percentageText}>{Math.round(match.percentage)}%</Text>
                </View>
              </View>
              <Text style={styles.hypothesisDescription}>{match.description}</Text>
              <View style={styles.hypothesisCriteria}>
                <Text style={styles.criteriaText}>
                  {match.match}/{match.total} criterios
                </Text>
                <Text style={styles.durationText}>Duración: {match.duration}</Text>
              </View>
              <View style={styles.matchingSymptoms}>
                <Text style={styles.symptomsLabel}>Síntomas coincidentes:</Text>
                <Text style={styles.symptomsList}>{match.symptoms.join(', ')}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  // Alternar categoría expandida
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Agrupar diagnósticos por categoría (mapeando a las claves de categoryConfig)
  const getDisordersByCategory = (): Record<string, Disorder[]> => {
    const grouped: Record<string, Disorder[]> = {};
    availableDisorders.forEach(disorder => {
      // Mapear la categoría del trastorno a la clave de categoryConfig
      const configKey = categoryToConfigKey(disorder.category);
      if (!grouped[configKey]) grouped[configKey] = [];
      grouped[configKey].push(disorder);
    });
    return grouped;
  };

  // Renderizar diagnóstico
  const renderDiagnosis = () => {
    const selectedDisorder = availableDisorders.find(d => d.id === selectedDiagnosis);
    const matchingHypothesis = hypothesis.find(h => h.id === selectedDiagnosis);
    const groupedDisorders = getDisordersByCategory();
    const categories = Object.keys(groupedDisorders);

    return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.diagnosisForm}>
        <Text style={styles.diagnosisLabel}>
          Selecciona un diagnóstico DSM-5-TR ({availableDisorders.length} disponibles):
        </Text>

        {/* Categorías con acordeón */}
        {categories.map(category => {
          const config = categoryConfig[category] || categoryConfig.otros;
          const disordersInCategory = groupedDisorders[category];
          const isExpanded = expandedCategories.includes(category);
          const hasSelectedInCategory = disordersInCategory.some(d => d.id === selectedDiagnosis);

          return (
            <View key={category} style={styles.categoryAccordion}>
              {/* Header de categoría */}
              <TouchableOpacity
                style={[
                  styles.categoryHeader,
                  { borderLeftColor: config.color },
                  hasSelectedInCategory && styles.categoryHeaderSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: config.color + '20' }]}>
                  <Icon name={config.icon} size={18} color={config.color} />
                </View>
                <View style={styles.categoryTitleContainer}>
                  <Text style={styles.categoryHeaderTitle}>{config.label}</Text>
                  <Text style={styles.categoryCount}>{disordersInCategory.length} diagnósticos</Text>
                </View>
                {hasSelectedInCategory && (
                  <View style={[styles.selectedBadge, { backgroundColor: config.color }]}>
                    <Icon name="check" size={10} color="white" />
                  </View>
                )}
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#666"
                  style={styles.chevron}
                />
              </TouchableOpacity>

              {/* Contenido expandido */}
              {isExpanded && (
                <View style={styles.categoryContent}>
                  {disordersInCategory.map(disorder => {
                    const isSelected = selectedDiagnosis === disorder.id;
                    const matchPercentage = hypothesis.find(h => h.id === disorder.id)?.percentage;

                    return (
                      <TouchableOpacity
                        key={disorder.id}
                        style={[
                          styles.diagnosisOption,
                          isSelected && [styles.diagnosisOptionSelected, { borderColor: config.color }],
                        ]}
                        onPress={() => setSelectedDiagnosis(disorder.id)}
                      >
                        <View style={styles.diagnosisOptionContent}>
                          <View style={[
                            styles.diagnosisRadio,
                            isSelected && [styles.diagnosisRadioSelected, { borderColor: config.color }],
                          ]}>
                            {isSelected && (
                              <View style={[styles.diagnosisRadioInner, { backgroundColor: config.color }]} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.diagnosisOptionText, isSelected && { color: config.color, fontWeight: '600' }]}>
                              {disorder.name}
                            </Text>
                            <Text style={styles.diagnosisOptionMeta}>
                              {disorder.criteria} criterios • {disorder.duration}
                            </Text>
                          </View>
                          {matchPercentage !== undefined && matchPercentage > 0 && (
                            <View style={[styles.matchBadge, { backgroundColor: matchPercentage >= 60 ? '#4CAF50' : '#FF9800' }]}>
                              <Text style={styles.matchBadgeText}>{Math.round(matchPercentage)}%</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Resumen del diagnóstico */}
        {selectedDiagnosis && selectedDisorder && (
          <View style={[styles.diagnosisSummary, { borderLeftColor: categoryConfig[categoryToConfigKey(selectedDisorder.category)]?.color || '#4A90E2' }]}>
            <Text style={[styles.summaryTitle, { color: categoryConfig[categoryToConfigKey(selectedDisorder.category)]?.color || '#4A90E2' }]}>
              {selectedDisorder.name}
            </Text>
            <Text style={styles.summaryText}>
              {selectedDisorder.description}
            </Text>
            <Text style={styles.summaryMeta}>
              Criterios requeridos: {selectedDisorder.criteria} • Duración: {selectedDisorder.duration}
            </Text>

            {matchingHypothesis && (
              <View style={styles.hypothesisInfo}>
                <Icon name="lightbulb-o" size={14} color="#4CAF50" />
                <Text style={styles.hypothesisText}>
                  Coincidencia con hipótesis: {Math.round(matchingHypothesis.percentage)}%
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmButton, !selectedDiagnosis && styles.confirmButtonDisabled]}
          onPress={confirmDiagnosis}
          disabled={!selectedDiagnosis}
        >
          <Icon name="check-circle" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.confirmButtonText}>Confirmar Diagnóstico</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    );
  };

  // Tabs (sin baterías - eso está en herramientas del chat)
  const tabs = [
    { id: 'symptoms', title: 'Síntomas', icon: 'stethoscope' },
    { id: 'hypothesis', title: 'Hipótesis', icon: 'search' },
    { id: 'diagnose', title: 'Diagnosticar', icon: 'check-circle' },
  ];

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
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* Header */}
      <SafeAreaViewRN style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Herramienta Diagnóstico</Text>
            <Text style={styles.headerSubtitle}>Caso: {currentCase.patient.name}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="ellipsis-v" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaViewRN>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? 'white' : '#666'}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {activeTab === 'symptoms' && renderSymptoms()}
        {activeTab === 'hypothesis' && renderHypothesis()}
        {activeTab === 'diagnose' && renderDiagnosis()}
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
  },
  headerButton: {
    padding: 8,
  },
  tabsContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#4A90E2',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'System',
  },
  tabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'System',
  },
  symptomsGrid: {
    gap: 10,
  },
  symptomButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  symptomButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  symptomContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomIcon: {
    marginRight: 12,
  },
  symptomText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'System',
  },
  symptomTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'System',
  },
  hypothesisCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topMatchCard: {
    borderLeftColor: '#FF4757',
    shadowColor: '#FF4757',
    shadowOpacity: 0.2,
  },
  hypothesisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  hypothesisTitleContainer: {
    flex: 1,
  },
  hypothesisName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'System',
  },
  topMatchBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  topMatchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  matchPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentageBar: {
    width: 80,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    minWidth: 35,
    fontFamily: 'System',
  },
  hypothesisDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    fontFamily: 'System',
  },
  hypothesisCriteria: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  criteriaText: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
    fontFamily: 'System',
  },
  durationText: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
  },
  matchingSymptoms: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 10,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
    fontFamily: 'System',
  },
  symptomsList: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'System',
  },
  batteryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  batteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  batteryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    fontFamily: 'System',
  },
  appliedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appliedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  batteryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    fontFamily: 'System',
  },
  batteryMeta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  batteryType: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    color: 'white',
    fontFamily: 'System',
  },
  batteryDuration: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
  },
  batteryResults: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
    fontFamily: 'System',
  },
  resultsText: {
    fontSize: 14,
    color: '#2e7d32',
    fontFamily: 'Courier New',
  },
  batteryButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    alignItems: 'center',
  },
  batteryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  batteryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  batteryButtonTextDisabled: {
    color: '#999',
  },
  diagnosisForm: {
    padding: 20,
  },
  diagnosisLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'System',
  },
  diagnosisSelect: {
    gap: 10,
  },
  diagnosisOption: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  diagnosisOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#f8f9ff',
  },
  diagnosisOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagnosisRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagnosisRadioSelected: {
    borderColor: '#4A90E2',
  },
  diagnosisRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
  },
  diagnosisOptionText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'System',
  },
  diagnosisSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 10,
    fontFamily: 'System',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: 'System',
  },
  hypothesisInfo: {
    marginTop: 10,
  },
  hypothesisText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    fontFamily: 'System',
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para acordeón de categorías
  categoryAccordion: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryHeaderSelected: {
    backgroundColor: '#f8f9ff',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 5,
  },
  categoryContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 5,
    padding: 10,
    gap: 8,
  },
  diagnosisOptionMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  matchBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  summaryMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default DiagnosisScreen;