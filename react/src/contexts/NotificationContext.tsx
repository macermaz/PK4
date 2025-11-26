import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tipos de notificación
export type NotificationType = 'message' | 'case' | 'result' | 'system' | 'achievement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  onPress?: () => void;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Componente de popup de notificación
const NotificationPopup: React.FC<{
  notification: Notification | null;
  onDismiss: () => void;
  onPress: () => void;
}> = ({ notification, onDismiss, onPress }) => {
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (notification) {
      // Animar entrada
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss después de 4 segundos
      const timer = setTimeout(() => {
        dismissPopup();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const dismissPopup = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!notification) return null;

  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return { icon: 'comments', color: '#34B7F1' };
      case 'case':
        return { icon: 'user-plus', color: '#4CAF50' };
      case 'result':
        return { icon: 'check-circle', color: '#9C27B0' };
      case 'achievement':
        return { icon: 'trophy', color: '#FFD700' };
      case 'system':
      default:
        return { icon: 'bell', color: '#4A90E2' };
    }
  };

  const config = getTypeConfig(notification.type);
  const iconName = notification.icon || config.icon;
  const iconColor = notification.color || config.color;

  return (
    <Animated.View
      style={[
        styles.popupContainer,
        {
          transform: [{ translateY }],
          opacity,
          marginTop: insets.top + 10,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.popup}
        onPress={() => {
          dismissPopup();
          onPress();
        }}
        activeOpacity={0.9}
      >
        <View style={[styles.popupIcon, { backgroundColor: iconColor + '20' }]}>
          <Icon name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.popupContent}>
          <Text style={styles.popupTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.popupBody} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={dismissPopup}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="times" size={14} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPopup, setCurrentPopup] = useState<Notification | null>(null);
  const popupQueueRef = useRef<Notification[]>([]);

  const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showNotification = useCallback(
    (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notificationData,
        id: generateId(),
        timestamp: new Date(),
        read: false,
      };

      // Añadir a la lista de notificaciones
      setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Máximo 50

      // Añadir a la cola de popups
      if (currentPopup) {
        popupQueueRef.current.push(newNotification);
      } else {
        setCurrentPopup(newNotification);
      }
    },
    [currentPopup]
  );

  const handlePopupDismiss = useCallback(() => {
    setCurrentPopup(null);
    // Mostrar siguiente en cola
    if (popupQueueRef.current.length > 0) {
      const next = popupQueueRef.current.shift();
      setTimeout(() => setCurrentPopup(next || null), 300);
    }
  }, []);

  const handlePopupPress = useCallback(() => {
    if (currentPopup?.onPress) {
      currentPopup.onPress();
    }
  }, [currentPopup]);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showNotification,
        clearNotification,
        clearAllNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      <NotificationPopup
        notification={currentPopup}
        onDismiss={handlePopupDismiss}
        onPress={handlePopupPress}
      />
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 15,
  },
  popup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  popupIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  popupContent: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  popupBody: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default NotificationContext;
