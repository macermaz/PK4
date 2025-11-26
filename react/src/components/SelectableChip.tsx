import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
}

const SelectableChip: React.FC<SelectableChipProps> = ({
  label,
  selected,
  onPress,
  variant = 'default',
  size = 'medium',
}) => {
  const getBackgroundColor = () => {
    if (selected) {
      if (variant === 'success') return '#4CAF50';
      if (variant === 'warning') return '#FF9800';
      if (variant === 'error') return '#F44336';
      return '#4A90E2';
    }
    return 'white';
  };

  const getTextColor = () => {
    return selected ? 'white' : '#666';
  };

  const getPadding = () => {
    if (size === 'small') return { paddingHorizontal: 10, paddingVertical: 6 };
    if (size === 'large') return { paddingHorizontal: 16, paddingVertical: 12 };
    return { paddingHorizontal: 12, paddingVertical: 8 };
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: getBackgroundColor(), borderColor: selected ? 'transparent' : '#E0E0E0' },
        getPadding(),
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: getTextColor() }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SelectableChip;
