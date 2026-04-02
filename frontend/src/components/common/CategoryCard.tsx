import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Spacing, FontSize } from '../../utils/constants';
import { styles } from '../../styles/CategoryCard.styles';
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

export default CategoryCard;