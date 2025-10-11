import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

type LockScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LockScreen'>;

const LockScreen: React.FC = () => {
  const navigation = useNavigation<LockScreenNavigationProp>();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tapCount, setTapCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Actualizar tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear tiempo
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Formatear fecha
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Manejar tap en pantalla
  const handleScreenTap = () => {
    setTapCount(prev => prev + 1);

    // Animación de feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Si es doble tap, desbloquear
    if (tapCount === 1) {
      setTimeout(() => setTapCount(0), 500);
    } else if (tapCount === 2) {
      unlockScreen();
    }
  };

  // Desbloquear pantalla
  const unlockScreen = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.replace('Desktop');
    });
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Hora y fecha */}
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(currentTime)}</Text>
            <Text style={styles.date}>{formatDate(currentTime)}</Text>
          </View>

          {/* Logo PSYKAT */}
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Icon name="paw" size={80} color="#FF8C42" style={styles.logoIcon} />
            <Text style={styles.logoText}>PSYKAT</Text>
          </Animated.View>

          {/* Instrucción */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instruction}>Toca dos veces para desbloquear</Text>
            <View style={styles.tapIndicator}>
              <View style={[styles.tapDot, tapCount >= 1 && styles.tapDotActive]} />
              <View style={[styles.tapDot, tapCount >= 2 && styles.tapDotActive]} />
            </View>
          </View>

          {/* Área táctil */}
          <TouchableOpacity
            style={styles.touchArea}
            onPress={handleScreenTap}
            activeOpacity={1}
          />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  time: {
    fontSize: 72,
    fontWeight: '300',
    color: 'white',
    fontFamily: 'System',
  },
  date: {
    fontSize: 18,
    color: 'white',
    opacity: 0.8,
    marginTop: 8,
    fontFamily: 'System',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 4,
    marginTop: 10,
    fontFamily: 'System',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instruction: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    fontFamily: 'System',
  },
  tapIndicator: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tapDotActive: {
    backgroundColor: 'white',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});

export default LockScreen;