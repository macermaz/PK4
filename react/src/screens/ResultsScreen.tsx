import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useApp } from '../contexts/AppContext';
import { useAI, ReviewData, SupervisorFeedback } from '../contexts/AIContext';

type ResultsNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsRouteProp = RouteProp<RootStackParamList, 'Results'>;

const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<ResultsNavigationProp>();
  const route = useRoute<ResultsRouteProp>();
  const { state, dispatch } = useApp();
  const { generateReview, generateSupervisorFeedback, isLoading } = useAI();
  const { correct, xpGained, diagnosis, caseId, coinsGained = 0 } = route.params;

  // Estados para animaciones
  const [starAnimation] = useState(new Animated.Value(0));
  const [xpAnimation] = useState(new Animated.Value(0));
  const [reviewAnimation] = useState(new Animated.Value(0));
  const [feedbackAnimation] = useState(new Animated.Value(0));

  // Estados para datos generados por IA
  const [review, setReview] = useState<ReviewData | null>(null);
  const [supervisorFeedback, setSupervisorFeedback] = useState<SupervisorFeedback | null>(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  // Obtener caso
  const currentCase = state.cases.find(c => c.id === caseId);

  // Cargar review y feedback con IA
  useEffect(() => {
    const loadAIContent = async () => {
      if (!currentCase) return;

      // Generar review del paciente
      try {
        const reviewData = await generateReview(currentCase, correct);
        setReview(reviewData);
      } catch (error) {
        console.error('Error generating review:', error);
        // Fallback
        setReview({
          stars: correct ? 4 : 2,
          comment: correct
            ? 'Me sentí escuchado/a y comprendido/a. El tratamiento ha sido muy efectivo.'
            : 'Creo que el diagnóstico no fue del todo acertado.',
          wouldRecommend: correct,
          emotionalState: correct ? 'agradecido/a' : 'decepcionado/a',
        });
      }
      setLoadingReview(false);

      // Generar feedback del supervisor
      try {
        const feedback = await generateSupervisorFeedback(currentCase);
        setSupervisorFeedback(feedback);
      } catch (error) {
        console.error('Error generating feedback:', error);
        // Fallback
        setSupervisorFeedback({
          overallScore: correct ? 80 : 50,
          strengths: ['Buena capacidad de escucha'],
          areasToImprove: ['Profundizar en historia familiar'],
          clinicalNotes: 'Caso interesante. Revisar los criterios diagnósticos.',
          recommendation: correct ? 'Buen trabajo, continúa así.' : 'Necesitas más práctica.',
        });
      }
      setLoadingFeedback(false);
    };

    loadAIContent();
  }, [currentCase]);

  // Animaciones de entrada
  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(starAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(xpAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(reviewAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Aplicar recompensas
    if (correct) {
      dispatch({ type: 'ADD_XP', payload: xpGained });
      if (coinsGained > 0) {
        dispatch({ type: 'ADD_COINS', payload: coinsGained });
      }
      dispatch({
        type: 'COMPLETE_CASE',
        payload: { caseId, correct: true, xpGained, coinsGained },
      });
    }
  }, []);

  // Obtener puntuación final del caso
  const finalScore = currentCase?.finalScore;

  // Generar estrellas basadas en la puntuación final
  const renderStars = () => {
    const stars = finalScore?.stars || review?.stars || (correct ? 4 : 2);
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Animated.View
            key={star}
            style={[
              styles.star,
              {
                transform: [
                  {
                    scale: starAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
                opacity: starAnimation,
              },
            ]}
          >
            <Icon
              name={star <= stars ? 'star' : 'star-o'}
              size={36}
              color={star <= stars ? '#FFD700' : '#ccc'}
            />
          </Animated.View>
        ))}
      </View>
    );
  };

  // Renderizar barra de progreso para cada métrica
  const renderMetricBar = (value: number, maxValue: number, color: string) => {
    const percentage = Math.min(100, (value / maxValue) * 100);
    return (
      <View style={styles.metricBarContainer}>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </View>
    );
  };

  // Barra de puntuación del supervisor
  const renderScoreBar = (score: number) => {
    const color = score >= 70 ? '#4CAF50' : score >= 50 ? '#FF9800' : '#f44336';
    return (
      <View style={styles.scoreBarContainer}>
        <View style={styles.scoreBar}>
          <Animated.View
            style={[
              styles.scoreBarFill,
              {
                width: `${score}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={[styles.scoreText, { color }]}>{score}/100</Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={correct ? ['#4CAF50', '#45a049'] : ['#FF9800', '#f57c00']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Resultado principal */}
          <View style={styles.resultHeader}>
            <View style={styles.iconContainer}>
              <Icon
                name={correct ? 'check-circle' : 'exclamation-circle'}
                size={80}
                color="white"
              />
            </View>
            <Text style={styles.resultTitle}>
              {correct ? '¡Caso Completado!' : 'Caso Fallido'}
            </Text>
            <Text style={styles.diagnosisText}>
              Tratamiento: {correct ? 'Efectivo' : 'Inefectivo'}
            </Text>
            {currentCase && (
              <Text style={styles.correctDiagnosis}>
                Diagnóstico: {currentCase.diagnosis || 'No realizado'}
              </Text>
            )}
          </View>

          {/* Estrellas */}
          {renderStars()}

          {/* Review del paciente (generada por IA) */}
          <Animated.View
            style={[
              styles.reviewCard,
              {
                transform: [
                  {
                    translateY: reviewAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
                opacity: reviewAnimation,
              },
            ]}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {currentCase?.patient.avatar || '??'}
                </Text>
              </View>
              <View style={styles.reviewInfo}>
                <Text style={styles.patientName}>
                  {currentCase?.patient.name || 'Paciente'}
                </Text>
                <Text style={styles.reviewLabel}>Ha dejado una valoración</Text>
              </View>
              {review?.wouldRecommend && (
                <View style={styles.recommendBadge}>
                  <Icon name="thumbs-up" size={12} color="#4CAF50" />
                  <Text style={styles.recommendText}>Recomienda</Text>
                </View>
              )}
            </View>

            {loadingReview ? (
              <ActivityIndicator size="small" color="#4A90E2" style={styles.loader} />
            ) : (
              <>
                <Text style={styles.reviewText}>"{review?.comment}"</Text>
                <View style={styles.emotionalState}>
                  <Icon name="heart" size={14} color="#e91e63" />
                  <Text style={styles.emotionalStateText}>
                    Estado: {review?.emotionalState}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>

          {/* XP y Monedas Ganados */}
          <Animated.View
            style={[
              styles.rewardsCard,
              {
                transform: [
                  {
                    translateY: xpAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: xpAnimation,
              },
            ]}
          >
            <View style={styles.rewardItem}>
              <Icon name="bolt" size={24} color="#FFD700" />
              <Text style={styles.rewardValue}>+{xpGained}</Text>
              <Text style={styles.rewardLabel}>XP</Text>
            </View>

            <View style={styles.rewardDivider} />

            <View style={styles.rewardItem}>
              <Icon name="circle" size={20} color="#FFD700" />
              <Text style={styles.rewardValue}>+{coinsGained}</Text>
              <Text style={styles.rewardLabel}>Monedas</Text>
            </View>

            <View style={styles.rewardDivider} />

            <View style={styles.rewardItem}>
              <Icon name="trophy" size={20} color="#9C27B0" />
              <Text style={styles.rewardValue}>Lv.{state.user.level}</Text>
              <Text style={styles.rewardLabel}>Nivel</Text>
            </View>
          </Animated.View>

          {/* Barra de progreso XP */}
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressBar}>
              <View
                style={[
                  styles.xpProgressFill,
                  { width: `${(state.user.xp / state.user.maxXp) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.xpProgressText}>
              {state.user.xp} / {state.user.maxXp} XP para nivel {state.user.level + 1}
            </Text>
          </View>

          {/* Estadísticas del caso */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Estadísticas del caso</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentCase?.sessions || 0}
                </Text>
                <Text style={styles.statLabel}>Sesiones</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentCase?.messages.filter(m => m.sender === 'user').length || 0}
                </Text>
                <Text style={styles.statLabel}>Preguntas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentCase?.selectedSymptoms.length || 0}
                </Text>
                <Text style={styles.statLabel}>Síntomas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentCase?.rapport || 50}%
                </Text>
                <Text style={styles.statLabel}>Rapport</Text>
              </View>
            </View>
          </View>

          {/* Desglose de Puntuación Final */}
          {finalScore && (
            <View style={styles.scoreBreakdownCard}>
              <Text style={styles.scoreBreakdownTitle}>Desglose de Puntuación</Text>

              {/* Puntuación total */}
              <View style={styles.totalScoreContainer}>
                <Text style={styles.totalScoreValue}>{finalScore.totalScore}</Text>
                <Text style={styles.totalScoreLabel}>Puntuación Total</Text>
              </View>

              {/* Métricas individuales */}
              <View style={styles.metricsContainer}>
                {/* Diagnóstico a la primera */}
                <View style={styles.metricRow}>
                  <View style={styles.metricInfo}>
                    <Icon
                      name={finalScore.diagnosisFirstTry ? 'check-circle' : 'times-circle'}
                      size={16}
                      color={finalScore.diagnosisFirstTry ? '#4CAF50' : '#f44336'}
                    />
                    <Text style={styles.metricLabel}>Diagnóstico a la primera</Text>
                  </View>
                  <Text style={[
                    styles.metricPoints,
                    { color: finalScore.diagnosisFirstTry ? '#4CAF50' : '#f44336' }
                  ]}>
                    {finalScore.diagnosisFirstTry ? '+20' : currentCase?.diagnosisCorrect ? '+10' : '0'}
                  </Text>
                </View>

                {/* Tratamiento a la primera */}
                <View style={styles.metricRow}>
                  <View style={styles.metricInfo}>
                    <Icon
                      name={finalScore.treatmentFirstTry ? 'check-circle' : 'times-circle'}
                      size={16}
                      color={finalScore.treatmentFirstTry ? '#4CAF50' : '#FF9800'}
                    />
                    <Text style={styles.metricLabel}>Tratamiento a la primera</Text>
                  </View>
                  <Text style={[
                    styles.metricPoints,
                    { color: finalScore.treatmentFirstTry ? '#4CAF50' : '#FF9800' }
                  ]}>
                    {finalScore.treatmentFirstTry ? '+30' : currentCase?.treatmentCorrect ? '+15' : '0'}
                  </Text>
                </View>

                {/* Calidad de preguntas */}
                <View style={styles.metricRow}>
                  <View style={styles.metricInfo}>
                    <Icon name="comments" size={16} color="#4A90E2" />
                    <Text style={styles.metricLabel}>Calidad de preguntas</Text>
                  </View>
                  {renderMetricBar(finalScore.questionQuality, 100, '#4A90E2')}
                </View>

                {/* Aspectos de vida explorados */}
                <View style={styles.metricRow}>
                  <View style={styles.metricInfo}>
                    <Icon name="users" size={16} color="#9C27B0" />
                    <Text style={styles.metricLabel}>Aspectos explorados</Text>
                  </View>
                  {renderMetricBar(finalScore.lifeAspectsScore, 100, '#9C27B0')}
                </View>

                {/* Rapport final */}
                <View style={styles.metricRow}>
                  <View style={styles.metricInfo}>
                    <Icon name="heart" size={16} color="#E91E63" />
                    <Text style={styles.metricLabel}>Rapport final</Text>
                  </View>
                  {renderMetricBar(finalScore.rapportFinal, 100, '#E91E63')}
                </View>
              </View>

              {/* Leyenda de pesos */}
              <View style={styles.weightsLegend}>
                <Text style={styles.weightsTitle}>Pesos:</Text>
                <Text style={styles.weightsText}>
                  Diagnóstico 20% | Tratamiento 30% | Preguntas 25% | Aspectos 15% | Rapport 10%
                </Text>
              </View>
            </View>
          )}

          {/* Feedback del Dr. Domingo (generado por IA) */}
          <Animated.View
            style={[
              styles.feedbackCard,
              {
                transform: [
                  {
                    translateY: feedbackAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
                opacity: feedbackAnimation,
              },
            ]}
          >
            <View style={styles.supervisorHeader}>
              <View style={styles.supervisorAvatar}>
                <Text style={styles.supervisorEmoji}>🐱</Text>
              </View>
              <View style={styles.supervisorInfo}>
                <Text style={styles.supervisorName}>Dr. Domingo</Text>
                <Text style={styles.supervisorRole}>Supervisor Clínico</Text>
              </View>
            </View>

            {loadingFeedback ? (
              <ActivityIndicator size="small" color="#4A90E2" style={styles.loader} />
            ) : (
              <>
                {/* Puntuación general */}
                <View style={styles.scoreSection}>
                  <Text style={styles.scoreLabel}>Puntuación General</Text>
                  {renderScoreBar(supervisorFeedback?.overallScore || 0)}
                </View>

                {/* Fortalezas */}
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackSectionTitle}>
                    <Icon name="check-circle" size={14} color="#4CAF50" /> Puntos Fuertes
                  </Text>
                  {supervisorFeedback?.strengths.map((strength, index) => (
                    <Text key={index} style={styles.feedbackBullet}>• {strength}</Text>
                  ))}
                </View>

                {/* Áreas de mejora */}
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackSectionTitle}>
                    <Icon name="arrow-up" size={14} color="#FF9800" /> Áreas de Mejora
                  </Text>
                  {supervisorFeedback?.areasToImprove.map((area, index) => (
                    <Text key={index} style={styles.feedbackBullet}>• {area}</Text>
                  ))}
                </View>

                {/* Notas clínicas */}
                <View style={styles.clinicalNotes}>
                  <Text style={styles.clinicalNotesTitle}>Observaciones:</Text>
                  <Text style={styles.clinicalNotesText}>
                    "{supervisorFeedback?.clinicalNotes}"
                  </Text>
                </View>

                {/* Recomendación */}
                <View style={styles.recommendation}>
                  <Icon
                    name={correct ? 'thumbs-up' : 'book'}
                    size={16}
                    color={correct ? '#4CAF50' : '#FF9800'}
                  />
                  <Text style={styles.recommendationText}>
                    {supervisorFeedback?.recommendation}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Desktop')}
            >
              <Icon name="home" size={18} color={correct ? '#4CAF50' : '#FF9800'} style={styles.buttonIcon} />
              <Text style={[styles.primaryButtonText, { color: correct ? '#4CAF50' : '#FF9800' }]}>
                Volver al Inicio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Contacts')}
            >
              <Icon name="user-plus" size={16} color="white" style={styles.buttonIcon} />
              <Text style={styles.secondaryButtonText}>Nuevo Caso</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton}>
              <Icon name="share-alt" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.shareButtonText}>Compartir Logro</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
  },
  diagnosisText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  correctDiagnosis: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  star: {
    marginHorizontal: 5,
  },
  loader: {
    marginVertical: 20,
  },
  // Review Card
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  patientAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewLabel: {
    fontSize: 12,
    color: '#666',
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  emotionalState: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  emotionalStateText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  // Rewards Card
  rewardsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 5,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rewardDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  // XP Progress
  xpProgressContainer: {
    marginBottom: 15,
  },
  xpProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  xpProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  // Stats Card
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
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
    marginTop: 4,
  },
  // Score Breakdown Card
  scoreBreakdownCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  totalScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalScoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#4A90E2',
  },
  totalScoreLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  metricsContainer: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  metricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  metricPoints: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  metricBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  metricBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  weightsLegend: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  weightsTitle: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  weightsText: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 3,
  },
  // Feedback Card (Dr. Domingo)
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supervisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  supervisorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supervisorEmoji: {
    fontSize: 28,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  supervisorRole: {
    fontSize: 12,
    color: '#666',
  },
  scoreSection: {
    marginBottom: 15,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  feedbackBullet: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 22,
  },
  clinicalNotes: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  clinicalNotesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 5,
  },
  clinicalNotesText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  // Action Buttons
  actionButtons: {
    marginTop: 10,
  },
  treatmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  treatmentButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  shareButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
});

export default ResultsScreen;
