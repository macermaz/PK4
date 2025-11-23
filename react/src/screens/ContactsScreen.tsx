import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Case } from '../types';

type ContactsNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

const ContactsScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigation = useNavigation<ContactsNavigationProp>();
  const [selectedContact, setSelectedContact] = useState<Case | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Obtener todos los casos (contactos)
  const contacts = state.cases.filter(c => c.status !== 'cancelled');

  // Agrupar por letra inicial
  const groupedContacts = contacts.reduce((groups, contact) => {
    const letter = contact.patient.name.charAt(0).toUpperCase();
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(contact);
    return groups;
  }, {} as Record<string, Case[]>);

  // Ordenar letras
  const sortedLetters = Object.keys(groupedContacts).sort();

  // Abrir contacto
  const openContact = (contact: Case) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  // Iniciar chat
  const startChat = (contact: Case) => {
    // Cambiar estado a activo si es nuevo
    if (contact.status === 'new') {
      dispatch({
        type: 'UPDATE_CASE',
        payload: {
          id: contact.id,
          updates: { status: 'active' },
        },
      });
    }
    setShowContactModal(false);
    navigation.navigate('Chat', { caseId: contact.id });
  };

  // Color según estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return '#4CAF50';
      case 'active': return '#FF9800';
      case 'completed': return '#4A90E2';
      default: return '#9E9E9E';
    }
  };

  // Etiqueta de estado
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'new': return 'Nuevo';
      case 'active': return 'En curso';
      case 'completed': return 'Completado';
      default: return 'Desconocido';
    }
  };

  // Renderizar item de contacto
  const renderContactItem = (contact: Case) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.contactItem}
      onPress={() => openContact(contact)}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.patient.avatar}</Text>
        </View>
        {contact.status === 'new' && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.patient.name}</Text>
        <Text style={styles.contactMeta}>
          {contact.patient.age} años • {contact.patient.occupation}
        </Text>
        {contact.sessions > 0 && (
          <Text style={styles.sessionInfo}>
            {contact.sessions} sesión{contact.sessions > 1 ? 'es' : ''} realizadas
          </Text>
        )}
      </View>

      {/* Indicador de estado */}
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(contact.status) }]} />
    </TouchableOpacity>
  );

  // Modal de contacto
  const ContactModal = () => {
    if (!selectedContact) return null;

    return (
      <Modal
        visible={showContactModal}
        animationType="slide"
        onRequestClose={() => setShowContactModal(false)}
      >
        <LinearGradient
          colors={['#4A90E2', '#357abd']}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowContactModal(false)}
            >
              <Icon name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contacto</Text>
            <View style={styles.placeholder} />
          </SafeAreaView>

          <ScrollView style={styles.modalContent}>
            {/* Cabecera del contacto */}
            <View style={styles.contactHeader}>
              <View style={styles.contactAvatarLarge}>
                <Text style={styles.contactAvatarLargeText}>
                  {selectedContact.patient.avatar}
                </Text>
              </View>
              <Text style={styles.contactNameLarge}>{selectedContact.patient.name}</Text>
              <Text style={styles.contactMetaLarge}>
                {selectedContact.patient.age} años • {selectedContact.patient.occupation}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedContact.status) }]}>
                <Text style={styles.statusBadgeText}>
                  {getStatusLabel(selectedContact.status)}
                </Text>
              </View>
            </View>

            {/* Información de contacto */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Información de contacto</Text>

              <View style={styles.infoRow}>
                <Icon name="phone" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  +34 6{Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Icon name="envelope" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  {selectedContact.patient.name.toLowerCase().replace(' ', '.')}@email.com
                </Text>
              </View>
            </View>

            {/* Estadísticas del caso */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Estadísticas del caso</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{selectedContact.sessions}</Text>
                  <Text style={styles.statLabel}>Sesiones</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{selectedContact.messages.length}</Text>
                  <Text style={styles.statLabel}>Mensajes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{selectedContact.selectedSymptoms.length}</Text>
                  <Text style={styles.statLabel}>Síntomas</Text>
                </View>
              </View>
            </View>

            {/* Notas del secretario */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Notas del secretario</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                  Paciente derivado a consulta. Refiere malestar general.
                  {(selectedContact as any).isFromFamily && ' Contacto inicial realizado por familiar.'}
                </Text>
              </View>
            </View>

            {/* Tests aplicados */}
            {selectedContact.batteryApplied && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Tests aplicados</Text>
                <View style={styles.testItem}>
                  <Icon name="file-text-o" size={16} color="#4A90E2" />
                  <Text style={styles.testName}>{selectedContact.batteryApplied}</Text>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Ver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Notas propias */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Mis notas</Text>
              <TouchableOpacity style={styles.addNoteButton}>
                <Icon name="plus" size={14} color="#4A90E2" />
                <Text style={styles.addNoteText}>Añadir nota</Text>
              </TouchableOpacity>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => startChat(selectedContact)}
              >
                <Icon name="comments" size={18} color="white" style={styles.buttonIcon} />
                <Text style={styles.chatButtonText}>
                  {selectedContact.status === 'new' ? 'Iniciar chat' : 'Continuar chat'}
                </Text>
              </TouchableOpacity>

              {selectedContact.status !== 'completed' && (
                <TouchableOpacity style={styles.cancelButton}>
                  <Icon name="trash" size={16} color="#FF3B30" />
                  <Text style={styles.cancelButtonText}>Anular caso</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
    );
  };

  return (
    <LinearGradient
      colors={['#4CAF50', '#45a049']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contactos</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Contador */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {contacts.length} paciente{contacts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </SafeAreaView>

      {/* Lista de contactos */}
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedLetters.length > 0 ? (
            sortedLetters.map(letter => (
              <View key={letter}>
                <Text style={styles.sectionLetter}>{letter}</Text>
                {groupedContacts[letter].map(contact => renderContactItem(contact))}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="address-book-o" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>No hay contactos</Text>
              <Text style={styles.emptySubtitle}>
                Revisa tu correo para añadir nuevos pacientes
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Mail')}
              >
                <Text style={styles.emptyButtonText}>Ir al correo</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal de contacto */}
      <ContactModal />
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
  counterContainer: {
    alignItems: 'center',
    paddingBottom: 15,
  },
  counterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
  sectionLetter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 25,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  sessionInfo: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 36,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  contactHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  contactAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactAvatarLargeText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
  },
  contactNameLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  contactMetaLarge: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    width: 25,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
  },
  testName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  viewButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 15,
  },
  addNoteText: {
    color: '#4A90E2',
    marginLeft: 8,
  },
  actionButtons: {
    padding: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#FF3B30',
    marginLeft: 8,
  },
});

export default ContactsScreen;
