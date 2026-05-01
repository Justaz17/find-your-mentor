import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours } from '../../../utils/constants';
import { styles } from '../../../styles/LearnerDashboardScreen.styles';

interface PreferenceRowProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string | null | undefined;
}

export const PreferenceRow: React.FC<PreferenceRowProps> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.prefRow}>
      <MaterialCommunityIcons name={icon} size={20} color={Colours.textSecondary} style={styles.prefIconEl} />
      <View style={styles.prefText}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefValue}>{value}</Text>
      </View>
    </View>
  );
};