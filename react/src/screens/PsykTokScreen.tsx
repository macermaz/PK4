import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../contexts/AppContext';
import { psykTokVideos } from '../data/mockData';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const PsykTokScreen: React.FC = () => {
  const { dispatch } = useApp();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [showAds, setShowAds] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const currentVideo = psykTokVideos[currentVideoIndex];

  // Simular anuncios
  useEffect(() => {
    const timer = setInterval(() => {
      setAdTimer(prev => {
        if (prev >= 10) {
          setShowAds(true);
          setTimeout(() => setShowAds(false), 5000);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear número de likes
  const formatLikes = (likes: number): string => {
    if (likes >= 1000000) {
      return (likes / 1000000).toFixed(1) + 'M';
    } else if (likes >= 1000) {
      return (likes / 1000).toFixed(1) + 'K';
    }
    return likes.toString();
  };

  // Manejar like
  const handleLike = (videoId: string) => {
    const newLikedVideos = new Set(likedVideos);
    if (likedVideos.has(videoId)) {
      newLikedVideos.delete(videoId);
    } else {
      newLikedVideos.add(videoId);
      // Añadir XP por interactuar
      dispatch({ type: 'ADD_XP', payload: 5 });
    }
    setLikedVideos(newLikedVideos);
  };

  // Manejar scroll para cambiar de video
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const videoHeight = height - 100; // Altura aproximada del video
    const newIndex = Math.round(offsetY / videoHeight);
    
    if (newIndex !== currentVideoIndex && newIndex >= 0 && newIndex < psykTokVideos.length) {
      setCurrentVideoIndex(newIndex);
    }
  };

  // Renderizar video
  const renderVideoItem = ({ item, index }: { item: any; index: number }) => {
    const isLiked = likedVideos.has(item.id);
    
    return (
      <View style={styles.videoContainer}>
        {/* Video Placeholder */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.videoBackground}
        >
          <View style={styles.videoContent}>
            <Icon name="play-circle" size={80} color="white" style={styles.playIcon} />
            <Text style={styles.videoTitle}>{item.title}</Text>
            <Text style={styles.videoDescription}>{item.description}</Text>
            <View style={styles.videoStats}>
              <Text style={styles.statText}>
                <Icon name="heart" size={16} color="white" /> {formatLikes(item.likes)}
              </Text>
              <Text style={styles.statText}>
                <Icon name="clock" size={16} color="white" /> {item.duration}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Controles laterales */}
        <View style={styles.videoControls}>
          <TouchableOpacity
            style={[styles.controlButton, isLiked && styles.controlButtonLiked]}
            onPress={() => handleLike(item.id)}
          >
            <Icon
              name={isLiked ? 'heart' : 'heart-o'}
              size={28}
              color={isLiked ? '#ff0066' : 'white'}
            />
            <Text style={styles.controlText}>{formatLikes(item.likes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Icon name="share" size={28} color="white" />
            <Text style={styles.controlText}>Compartir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Icon name="bookmark" size={28} color="white" />
            <Text style={styles.controlText}>Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Icon name="comment" size={28} color="white" />
            <Text style={styles.controlText}>Comentar</Text>
          </TouchableOpacity>
        </View>

        {/* Información del autor */}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </View>
    );
  };

  // Anuncio
  const AdBanner = () => {
    if (!showAds) return null;

    const ads = [
      {
        title: 'PSYKAT Premium',
        description: 'Sin anuncios • Casos ilimitados • Contenido exclusivo',
        cta: 'Mejora ahora',
      },
      {
        title: 'Curso de Psicología',
        description: 'Aprende con expertos • Certificado oficial',
        cta: 'Inscríbete',
      },
    ];

    const ad = ads[Math.floor(Math.random() * ads.length)];

    return (
      <Animated.View
        style={[styles.adBanner, { transform: [{ translateY: scrollY }] }]}
        entering={Animated.spring}
        exiting={Animated.spring}
      >
        <View style={styles.adContent}>
          <View style={styles.adInfo}>
            <Text style={styles.adTitle}>{ad.title}</Text>
            <Text style={styles.adDescription}>{ad.description}</Text>
          </View>
          <TouchableOpacity style={styles.adButton}>
            <Text style={styles.adButtonText}>{ad.cta}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.adClose}
          onPress={() => setShowAds(false)}
        >
          <Icon name="times" size={16} color="#666" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Lista de videos */}
      <FlatList
        ref={flatListRef}
        data={psykTokVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideoItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={height - 100}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Anuncio */}
      <AdBanner />

      {/* Indicador de navegación */}
      <View style={styles.navigationIndicator}>
        {psykTokVideos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              index === currentVideoIndex && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    height: height - 100,
    position: 'relative',
  },
  videoBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  playIcon: {
    marginBottom: 30,
    opacity: 0.8,
  },
  videoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'System',
  },
  videoDescription: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    fontFamily: 'System',
  },
  videoStats: {
    flexDirection: 'row',
    gap: 30,
  },
  statText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'System',
  },
  videoControls: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'center',
    gap: 25,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
  },
  controlButtonLiked: {
    transform: [{ scale: 1.1 }],
  },
  controlText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'System',
  },
  authorInfo: {
    position: 'absolute',
    left: 20,
    bottom: 80,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  category: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    fontFamily: 'System',
  },
  adBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  adContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'System',
  },
  adDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'System',
  },
  adButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  adButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'System',
  },
  adClose: {
    padding: 5,
  },
  navigationIndicator: {
    position: 'absolute',
    right: 20,
    top: 100,
    flexDirection: 'column',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  indicatorDotActive: {
    backgroundColor: 'white',
  },
});

export default PsykTokScreen;