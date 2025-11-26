import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface SelectableCardProps {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  showCheckmark?: boolean;
}

const SelectableCard: React.FC<SelectableCardProps> = ({
  title,
  description,
  badge,
  badgeColor = '#4A90E2',
  selected,
  onPress,
  disabled = false,
  showCheckmark = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.rightContent}>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
          {showCheckmark && selected && (
            <Icon name="check-circle" size={24} color="#4CAF50" style={styles.checkmark} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    marginTop: 4,
  },
});

export default SelectableCard;
