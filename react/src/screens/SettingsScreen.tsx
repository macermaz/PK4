import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useApp } from '../contexts/AppContext';
import { useAI } from '../contexts/AIContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { state, dispatch } = useApp();
  const { config, setConfig, setApiKey, testConnection } = useAI();

  // Estados de configuración
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Estados de API
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiMode, setAiMode] = useState<'local' | 'groq' | 'n8n'>(config.mode as any);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');

  // Cargar API key guardada
  useEffect(() => {
    const loadApiKey = async () => {
      const savedKey = await AsyncStorage.getItem('@psykat_groq_key');
      if (savedKey) {
        setApiKeyInput(savedKey);
        setApiKey(savedKey);
      }
    };
    loadApiKey();
  }, []);

  // Guardar API key
  const saveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await AsyncStorage.setItem('@psykat_groq_key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setConfig({ mode: 'groq' as any });
      setAiMode('groq');

      // Probar conexión
      setIsTestingConnection(true);
      const success = await testConnection();
      setConnectionStatus(success ? 'success' : 'error');
      setIsTestingConnection(false);

      if (success) {
        Alert.alert('Conexión exitosa', 'La API de Groq está configurada correctamente.');
        setShowApiModal(false);
      } else {
        Alert.alert('Error de conexión', 'No se pudo conectar con Groq. Verifica tu API key.');
      }
    }
  };

  // Cambiar modo de IA
  const handleAiModeChange = (mode: 'local' | 'groq' | 'n8n') => {
    setAiMode(mode);
    setConfig({ mode: mode as any });

    if (mode === 'groq' && !apiKeyInput) {
      setShowApiModal(true);
    }
  };

  // Secciones de configuración
  const settingsSections = [
    {
      title: 'Inteligencia Artificial',
      items: [
        {
          id: 'aiMode',
          label: 'Modo de IA',
          sublabel: aiMode === 'groq' ? 'Groq (Llama 3)' :
                   aiMode === 'n8n' ? 'n8n Webhook' : 'Local (sin conexión)',
          icon: 'microchip',
          type: 'button',
          color: '#9C27B0',
          onPress: () => setShowApiModal(true),
        },
        {
          id: 'testAi',
          label: 'Probar conexión IA',
          icon: 'plug',
          type: 'button',
          color: connectionStatus === 'success' ? '#4CAF50' :
                 connectionStatus === 'error' ? '#f44336' : '#4A90E2',
          onPress: async () => {
            setIsTestingConnection(true);
            const success = await testConnection();
            setConnectionStatus(success ? 'success' : 'error');
            setIsTestingConnection(false);
            Alert.alert(
              success ? 'Conexión OK' : 'Error de conexión',
              success ? 'La IA está funcionando correctamente.' : 'No se pudo conectar. Se usará modo local.'
            );
          },
        },
      ],
    },
    {
      title: 'Apariencia',
      items: [
        {
          id: 'darkMode',
          label: 'Modo oscuro',
          icon: 'moon-o',
          type: 'switch',
          value: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: 'fontSize',
          label: 'Tamaño de letra',
          icon: 'font',
          type: 'select',
          value: fontSize,
          options: ['small', 'medium', 'large'],
        },
      ],
    },
    {
      title: 'Sonido y notificaciones',
      items: [
        {
          id: 'sound',
          label: 'Sonido',
          icon: 'volume-up',
          type: 'switch',
          value: soundEnabled,
          onToggle: setSoundEnabled,
        },
        {
          id: 'vibration',
          label: 'Vibración',
          icon: 'mobile',
          type: 'switch',
          value: vibrationEnabled,
          onToggle: setVibrationEnabled,
        },
        {
          id: 'notifications',
          label: 'Notificaciones push',
          icon: 'bell',
          type: 'switch',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        {
          id: 'premium',
          label: state.user.isPremium ? 'Plan Premium activo' : 'Hazte Premium',
          icon: 'star',
          type: 'button',
          color: '#FFD700',
        },
        {
          id: 'coins',
          label: `Monedas: ${state.user.coins}`,
          icon: 'circle',
          type: 'info',
          color: '#FFD700',
        },
        {
          id: 'university',
          label: 'Vincular universidad',
          icon: 'university',
          type: 'button',
        },
        {
          id: 'sync',
          label: 'Sincronizar datos',
          icon: 'cloud-upload',
          type: 'button',
        },
      ],
    },
    {
      title: 'Datos',
      items: [
        {
          id: 'export',
          label: 'Exportar casos',
          icon: 'download',
          type: 'button',
        },
        {
          id: 'resetProgress',
          label: 'Borrar progreso',
          icon: 'trash',
          type: 'button',
          color: '#FF3B30',
        },
      ],
    },
    {
      title: 'Información',
      items: [
        {
          id: 'about',
          label: 'Acerca de PSYKAT',
          icon: 'info-circle',
          type: 'button',
        },
        {
          id: 'help',
          label: 'Ayuda y soporte',
          icon: 'question-circle',
          type: 'button',
        },
        {
          id: 'privacy',
          label: 'Política de privacidad',
          icon: 'shield',
          type: 'button',
        },
        {
          id: 'terms',
          label: 'Términos de uso',
          icon: 'file-text-o',
          type: 'button',
        },
      ],
    },
  ];

  // Manejar acciones de botón
  const handleButtonPress = (id: string, customOnPress?: () => void) => {
    if (customOnPress) {
      customOnPress();
      return;
    }

    switch (id) {
      case 'premium':
        Alert.alert(
          'PSYKAT Premium',
          'Desbloquea todos los modos, sin anuncios y acceso anticipado a nuevas funciones.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver planes', onPress: () => {} },
          ]
        );
        break;
      case 'resetProgress':
        Alert.alert(
          'Borrar progreso',
          '¿Estás seguro? Se eliminarán todos tus datos, casos y estadísticas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Borrar',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.clear();
                dispatch({ type: 'SET_LOADING', payload: true });
              },
            },
          ]
        );
        break;
      case 'about':
        Alert.alert(
          'PSYKAT 4.0',
          'Simulador de entrevista clínica para estudiantes de psicología.\n\nDesarrollado con amor por el equipo PSYKAT.\n\nPotenciado por Llama 3 via Groq.',
          [{ text: 'OK' }]
        );
        break;
      default:
        break;
    }
  };

  // Renderizar item de configuración
  const renderSettingItem = (item: any) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={() => item.type === 'button' && handleButtonPress(item.id, item.onPress)}
        activeOpacity={item.type === 'switch' || item.type === 'info' ? 1 : 0.7}
        disabled={item.type === 'info'}
      >
        <View style={[styles.settingIcon, item.color && { backgroundColor: item.color + '20' }]}>
          <Icon
            name={item.icon}
            size={18}
            color={item.color || '#4A90E2'}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, item.color && { color: item.color }]}>
            {item.label}
          </Text>
          {item.sublabel && (
            <Text style={styles.settingSublabel}>{item.sublabel}</Text>
          )}
        </View>
        {item.type === 'switch' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#ddd', true: '#4A90E2' }}
            thumbColor="white"
          />
        )}
        {item.type === 'button' && (
          <Icon name="chevron-right" size={14} color="#ccc" />
        )}
        {item.type === 'select' && (
          <Text style={styles.selectValue}>{item.value}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#6C757D', '#5a6268']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#6C757D" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      {/* Perfil rápido */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Icon name="user" size={30} color="white" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Terapeuta</Text>
          <Text style={styles.profileLevel}>
            Nivel {state.user.level} • {state.user.xp} XP
          </Text>
        </View>
        {state.user.isPremium && (
          <View style={styles.premiumBadge}>
            <Icon name="star" size={12} color="#FFD700" />
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Lista de ajustes */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Versión */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>PSYKAT v4.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 PSYKAT</Text>
        </View>
      </ScrollView>

      {/* Modal de configuración de API */}
      <Modal
        visible={showApiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.apiModal}>
            <View style={styles.apiModalHeader}>
              <Text style={styles.apiModalTitle}>Configuración de IA</Text>
              <TouchableOpacity onPress={() => setShowApiModal(false)}>
                <Icon name="times" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Selector de modo */}
            <Text style={styles.apiLabel}>Modo de IA</Text>
            <View style={styles.modeSelector}>
              {(['local', 'groq'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeOption,
                    aiMode === mode && styles.modeOptionActive,
                  ]}
                  onPress={() => handleAiModeChange(mode)}
                >
                  <Icon
                    name={mode === 'local' ? 'laptop' : 'cloud'}
                    size={20}
                    color={aiMode === mode ? 'white' : '#666'}
                  />
                  <Text style={[
                    styles.modeOptionText,
                    aiMode === mode && styles.modeOptionTextActive,
                  ]}>
                    {mode === 'local' ? 'Local' : 'Groq'}
                  </Text>
                  {mode === 'groq' && (
                    <Text style={[
                      styles.modeOptionSubtext,
                      aiMode === mode && styles.modeOptionSubtextActive,
                    ]}>
                      Llama 3
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* API Key input */}
            {aiMode === 'groq' && (
              <>
                <Text style={styles.apiLabel}>API Key de Groq</Text>
                <TextInput
                  style={styles.apiKeyInput}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.apiHint}>
                  Obtén tu API key gratis en console.groq.com
                </Text>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !apiKeyInput.trim() && styles.saveButtonDisabled,
                  ]}
                  onPress={saveApiKey}
                  disabled={!apiKeyInput.trim() || isTestingConnection}
                >
                  {isTestingConnection ? (
                    <Text style={styles.saveButtonText}>Conectando...</Text>
                  ) : (
                    <>
                      <Icon name="check" size={16} color="white" />
                      <Text style={styles.saveButtonText}>Guardar y probar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {aiMode === 'local' && (
              <View style={styles.localInfo}>
                <Icon name="info-circle" size={40} color="#4A90E2" />
                <Text style={styles.localInfoText}>
                  El modo local usa respuestas predefinidas. {'\n'}
                  Para respuestas más realistas, configura Groq.
                </Text>
              </View>
            )}

            {/* Estado de conexión */}
            {connectionStatus !== 'none' && (
              <View style={[
                styles.connectionStatus,
                connectionStatus === 'success' ? styles.connectionSuccess : styles.connectionError,
              ]}>
                <Icon
                  name={connectionStatus === 'success' ? 'check-circle' : 'times-circle'}
                  size={18}
                  color={connectionStatus === 'success' ? '#4CAF50' : '#f44336'}
                />
                <Text style={[
                  styles.connectionStatusText,
                  { color: connectionStatus === 'success' ? '#4CAF50' : '#f44336' },
                ]}>
                  {connectionStatus === 'success' ? 'Conexión exitosa' : 'Error de conexión'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  placeholder: {
    width: 36,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  profileLevel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
  },
  settingSublabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  selectValue: {
    fontSize: 14,
    color: '#999',
    textTransform: 'capitalize',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  copyrightText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  apiModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 40,
  },
  apiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  apiModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  apiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 10,
  },
  modeOptionActive: {
    backgroundColor: '#4A90E2',
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  modeOptionTextActive: {
    color: 'white',
  },
  modeOptionSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  modeOptionSubtextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  apiKeyInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  apiHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  localInfo: {
    alignItems: 'center',
    padding: 30,
  },
  localInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  connectionSuccess: {
    backgroundColor: '#E8F5E9',
  },
  connectionError: {
    backgroundColor: '#FFEBEE',
  },
  connectionStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default SettingsScreen;
