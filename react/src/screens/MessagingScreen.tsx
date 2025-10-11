import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Case } from '../types';

type MessagingNavigationProp = StackNavigationProp<RootStackParamList, 'Messaging'>;

const MessagingScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigation = useNavigation<MessagingNavigationProp>();

  // Obtener casos activos
  const activeCases = state.cases.filter(c => c.status === 'active');

  // Formatear último mensaje
  const formatLastMessage = (lastMessage: string): string => {
    if (!lastMessage) return 'Inicia la conversación...';
    if (lastMessage.length > 50) {
      return lastMessage.substring(0, 50) + '...';
    }
    return lastMessage;
  };

  // Formatear tiempo
  const formatTime = (timeString: string): string => {
    if (!timeString) return 'Ahora';
    return timeString;
  };

  // Navegar a chat
  const openChat = (case_: Case) => {
    navigation.navigate('Chat', { caseId: case_.id });
  };

  // Renderizar item de chat
  const renderChatItem = ({ item }: { item: Case }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => openChat(item)}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.patient.avatar}</Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 9 ? '9+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Información del chat */}
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.patient.name}
          </Text>
          <Text style={styles.chatTime}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        <Text style={styles.chatPreview} numberOfLines={2}>
          {formatLastMessage(item.lastMessage)}
        </Text>
        <View style={styles.chatMeta}>
          <Text style={styles.chatDetails}>
            {item.patient.age} años • {item.patient.occupation}
          </Text>
          {item.sessions > 0 && (
            <Text style={styles.sessionCount}>
              {item.sessions} sesión{item.sessions > 1 ? 'es' : ''}
            </Text>
          )}
        </View>
      </View>

      {/* Indicador de estado */}
      <View style={[styles.statusIndicator, { 
        backgroundColor: item.status === 'active' ? '#4CAF50' : '#FF8C42' 
      }]} />
    </TouchableOpacity>
  );

  // Lista vacía
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="comments" size={80} color="#666" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No hay conversaciones activas</Text>
      <Text style={styles.emptySubtitle}>
        Visita Contactos para añadir nuevos casos
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Contacts')}
      >
        <Text style={styles.emptyButtonText}>Ir a Contactos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#4A90E2', '#357abd']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mensajería</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="search" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="ellipsis-v" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeCases.length}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{state.user.casesCompleted}</Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{state.user.level}</Text>
            <Text style={styles.statLabel}>Nivel</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Lista de chats */}
      <View style={styles.content}>
        <FlatList
          data={activeCases}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'System',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    paddingVertical: 10,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    fontFamily: 'System',
  },
  chatTime: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
  },
  chatPreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontFamily: 'System',
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatDetails: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'System',
  },
  sessionCount: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
    fontFamily: 'System',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
    alignSelf: 'center',
  },
  emptyContainer: {
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
    marginBottom: 30,
    fontFamily: 'System',
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default MessagingScreen;