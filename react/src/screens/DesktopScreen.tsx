import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

type DesktopNavigationProp = StackNavigationProp<RootStackParamList, 'Desktop'>;

interface AppIcon {
  id: string;
  name: string;
  icon: string;
  color: string;
  badge?: number;
  isDock?: boolean;
}

const DesktopScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigation = useNavigation<DesktopNavigationProp>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [appAnimations] = useState(() => 
    Array(8).fill(null).map(() => new Animated.Value(0))
  );

  // Actualizar tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animación de entrada
  useEffect(() => {
    const animations = appAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, animations).start();
  }, []);

  // Formatear tiempo
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Aplicaciones
  const apps: AppIcon[] = [
    {
      id: 'mail',
      name: 'Correo',
      icon: 'envelope',
      color: '#007AFF',
      badge: state.cases.filter(c => c.status === 'new').length,
    },
    {
      id: 'contacts',
      name: 'Contactos',
      icon: 'address-book',
      color: '#4CAF50',
      badge: state.cases.filter(c => c.status === 'new').length,
    },
    {
      id: 'messaging',
      name: 'Mensajería',
      icon: 'comments',
      color: '#34B7F1',
      badge: state.cases.filter(c => c.status === 'active').length,
    },
    {
      id: 'tubetok',
      name: 'PsykTok',
      icon: 'play-circle',
      color: '#FF0066',
    },
    {
      id: 'diary',
      name: 'Diario',
      icon: 'book-medical',
      color: '#8B5CF6',
    },
    {
      id: 'calls',
      name: 'Llamadas',
      icon: 'phone',
      color: '#FF8C42',
    },
    {
      id: 'achievements',
      name: 'Logros',
      icon: 'trophy',
      color: '#FFD700',
    },
    {
      id: 'settings',
      name: 'Ajustes',
      icon: 'cog',
      color: '#6C757D',
    },
  ];

  // Dock apps
  const dockApps: AppIcon[] = [
    {
      id: 'messaging',
      name: 'Mensajería',
      icon: 'comments',
      color: '#34B7F1',
      badge: state.cases.filter(c => c.status === 'active').length,
      isDock: true,
    },
    {
      id: 'contacts',
      name: 'Contactos',
      icon: 'address-book',
      color: '#4CAF50',
      isDock: true,
    },
    {
      id: 'diary',
      name: 'Diario',
      icon: 'book-medical',
      color: '#8B5CF6',
      isDock: true,
    },
  ];

  // Navegar a aplicación
  const openApp = (appId: string) => {
    navigation.navigate(appId as any);
  };

  // Renderizar icono de aplicación
  const renderAppIcon = (app: AppIcon, index: number, isDock = false) => {
    const scale = appAnimations[index] || new Animated.Value(1);
    
    return (
      <Animated.View
        key={app.id}
        style={[
          styles.appIcon,
          {
            transform: [{ scale }],
            opacity: scale,
            marginHorizontal: isDock ? 0 : 12,
            marginVertical: isDock ? 0 : 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.iconContainer, { backgroundColor: app.color + '20' }]}
          onPress={() => openApp(app.id)}
          activeOpacity={0.8}
        >
          <Icon name={app.icon} size={isDock ? 28 : 32} color={app.color} />
          {app.badge && app.badge > 0 && (
            <View style={[styles.badge, { backgroundColor: app.color }]}>
              <Text style={styles.badgeText}>
                {app.badge > 9 ? '9+' : app.badge}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {!isDock && (
          <Text style={styles.appLabel} numberOfLines={1}>
            {app.name}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Barra de estado */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>{formatTime(currentTime)}</Text>
        <View style={styles.statusIcons}>
          <Icon name="wifi" size={16} color="white" style={styles.statusIcon} />
          <Icon name="battery-three-quarters" size={16} color="white" />
        </View>
      </View>

      {/* Grid de aplicaciones */}
      <ScrollView 
        contentContainerStyle={styles.appGrid}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appGridContent}>
          {apps.map((app, index) => renderAppIcon(app, index))}
        </View>
      </ScrollView>

      {/* Dock inferior */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.dock}
      >
        <View style={styles.dockContent}>
          {dockApps.map((app, index) => renderAppIcon(app, index + apps.length, true))}
        </View>
        
        {/* Indicador de swipe */}
        <View style={styles.swipeIndicator} />
      </LinearGradient>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  statusTime: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  appGrid: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  appGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  appIcon: {
    alignItems: 'center',
    margin: 8,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  appLabel: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 70,
    fontFamily: 'System',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  dock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 25,
  },
  dockContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 10,
  },
});

export default DesktopScreen;