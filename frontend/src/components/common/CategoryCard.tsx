import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Spacing, FontSize } from '../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryCardProps {
  name: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const CategoryCard = ({ name, icon, color, onPress }: CategoryCardProps) => {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={26} color={color} />
      </View>
      <Text style={[styles.name, { color }]} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 90,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    marginRight: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default CategoryCard;