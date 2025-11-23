import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { dsmData, testBatteries } from '../data/mockData';

type DiaryNavigationProp = StackNavigationProp<RootStackParamList, 'Diary'>;

type TabType = 'dsm' | 'tests' | 'treatments' | 'library';

const DiaryScreen: React.FC = () => {
  const navigation = useNavigation<DiaryNavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('dsm');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'dsm', label: 'DSM-5-TR', icon: 'book' },
    { id: 'tests', label: 'Tests', icon: 'file-text' },
    { id: 'treatments', label: 'Tratamientos', icon: 'medkit' },
    { id: 'library', label: 'Biblioteca', icon: 'archive' },
  ];

  // Tratamientos basados en evidencia
  const treatments = [
    {
      id: 'tcc',
      name: 'TCC (Terapia Cognitivo-Conductual)',
      description: 'Tratamiento de primera línea para depresión, ansiedad, TOC y más.',
      disorders: ['Depresión', 'Ansiedad', 'TOC', 'Fobias'],
    },
    {
      id: 'emdr',
      name: 'EMDR',
      description: 'Desensibilización y reprocesamiento por movimientos oculares.',
      disorders: ['TEPT', 'Trauma'],
    },
    {
      id: 'dbt',
      name: 'DBT (Terapia Dialéctica)',
      description: 'Especialmente efectiva para trastorno límite de personalidad.',
      disorders: ['TLP', 'Autolesiones'],
    },
    {
      id: 'exposure',
      name: 'Exposición Gradual',
      description: 'Técnica fundamental para fobias y ansiedad.',
      disorders: ['Fobias', 'Pánico', 'TOC'],
    },
    {
      id: 'mindfulness',
      name: 'Mindfulness / MBSR',
      description: 'Reducción de estrés basada en atención plena.',
      disorders: ['Ansiedad', 'Depresión', 'Estrés'],
      isComplementary: true,
    },
    {
      id: 'act',
      name: 'ACT (Aceptación y Compromiso)',
      description: 'Terapia de tercera generación basada en valores.',
      disorders: ['Depresión', 'Ansiedad', 'Dolor crónico'],
    },
  ];

  // Casos de biblioteca históricos
  const historicalCases = [
    {
      id: 'anna_o',
      name: 'Anna O.',
      therapist: 'Josef Breuer',
      year: 1880,
      disorder: 'Histeria',
      description: 'Caso fundacional del psicoanálisis.',
    },
    {
      id: 'little_hans',
      name: 'Pequeño Hans',
      therapist: 'Sigmund Freud',
      year: 1909,
      disorder: 'Fobia',
      description: 'Primer caso de psicoanálisis infantil.',
    },
    {
      id: 'rat_man',
      name: 'El hombre de las ratas',
      therapist: 'Sigmund Freud',
      year: 1909,
      disorder: 'TOC',
      description: 'Caso clásico de neurosis obsesiva.',
    },
  ];

  // Renderizar contenido según tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dsm':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Trastornos DSM-5-TR</Text>
            {Object.entries(dsmData.disorders).map(([key, disorder]) => (
              <TouchableOpacity key={key} style={styles.disorderCard}>
                <View style={styles.disorderHeader}>
                  <Text style={styles.disorderName}>{disorder.name}</Text>
                  <Icon name="chevron-right" size={14} color="#999" />
                </View>
                <Text style={styles.disorderDescription} numberOfLines={2}>
                  {disorder.description}
                </Text>
                <View style={styles.disorderMeta}>
                  <Text style={styles.disorderCriteria}>
                    Criterios: {disorder.criteria}
                  </Text>
                  <Text style={styles.disorderDuration}>
                    Duración: {disorder.duration}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'tests':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Baterías de Tests</Text>
            {testBatteries.map((test) => (
              <TouchableOpacity key={test.id} style={styles.testCard}>
                <View style={styles.testIcon}>
                  <Icon name="file-text-o" size={24} color="#4A90E2" />
                </View>
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testDescription}>{test.description}</Text>
                  <View style={styles.testMeta}>
                    <Icon name="clock-o" size={12} color="#666" />
                    <Text style={styles.testDuration}>{test.duration}</Text>
                    <View style={styles.testTypeBadge}>
                      <Text style={styles.testTypeText}>{test.type}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'treatments':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Tratamientos Basados en Evidencia</Text>
            {treatments.map((treatment) => (
              <TouchableOpacity key={treatment.id} style={styles.treatmentCard}>
                <View style={styles.treatmentHeader}>
                  <Text style={styles.treatmentName}>{treatment.name}</Text>
                  {treatment.isComplementary && (
                    <View style={styles.complementaryBadge}>
                      <Text style={styles.complementaryText}>Complementario</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.treatmentDescription}>
                  {treatment.description}
                </Text>
                <View style={styles.treatmentDisorders}>
                  {treatment.disorders.map((disorder, i) => (
                    <View key={i} style={styles.disorderTag}>
                      <Text style={styles.disorderTagText}>{disorder}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'library':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Casos Históricos</Text>
            <Text style={styles.sectionSubtitle}>
              Casos clásicos de la literatura psicológica
            </Text>
            {historicalCases.map((case_) => (
              <TouchableOpacity key={case_.id} style={styles.historicalCard}>
                <View style={styles.historicalIcon}>
                  <Icon name="history" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.historicalInfo}>
                  <Text style={styles.historicalName}>{case_.name}</Text>
                  <Text style={styles.historicalTherapist}>
                    {case_.therapist}, {case_.year}
                  </Text>
                  <Text style={styles.historicalDescription}>
                    {case_.description}
                  </Text>
                  <View style={styles.historicalDisorder}>
                    <Text style={styles.historicalDisorderText}>
                      {case_.disorder}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <Icon name="play" size={14} color="white" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={['#8B5CF6', '#7c3aed']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diario Clínico</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? '#8B5CF6' : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerButton: {
    padding: 8,
  },
  tabsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  // DSM Cards
  disorderCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  disorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disorderName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  disorderDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  disorderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  disorderCriteria: {
    fontSize: 12,
    color: '#4A90E2',
  },
  disorderDuration: {
    fontSize: 12,
    color: '#999',
  },
  // Test Cards
  testCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  testIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testDuration: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 10,
  },
  testTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  testTypeText: {
    fontSize: 11,
    color: '#4CAF50',
    textTransform: 'capitalize',
  },
  // Treatment Cards
  treatmentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  treatmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  complementaryBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  complementaryText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '500',
  },
  treatmentDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  treatmentDisorders: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disorderTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  disorderTagText: {
    fontSize: 11,
    color: '#1976D2',
  },
  // Historical Cases
  historicalCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  historicalIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historicalInfo: {
    flex: 1,
  },
  historicalName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  historicalTherapist: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },
  historicalDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  historicalDisorder: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  historicalDisorderText: {
    fontSize: 11,
    color: '#8B5CF6',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});

export default DiaryScreen;
