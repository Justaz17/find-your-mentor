import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../utils/constants';
import { styles } from '../../../styles/LearnerDashboardScreen.styles';

interface InfoChipProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}

export const InfoChip: React.FC<InfoChipProps> = ({ icon, label }) => (
  <View style={styles.infoChip}>
    <MaterialCommunityIcons name={icon} size={13} color={Colors.textSecondary} />
    <Text style={styles.infoChipText}>{label}</Text>
  </View>
);