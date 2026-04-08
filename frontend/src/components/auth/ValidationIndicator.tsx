import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing } from '../../utils/constants';

interface Props {
  isValid: boolean | null;
  message: string;
  showMessage?: boolean;
}

const ValidationIndicator: React.FC<Props> = ({ isValid, message, showMessage = true }) => {
  if (!showMessage || isValid === null) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
      <MaterialCommunityIcons
        name={isValid ? 'check-circle' : 'close-circle'}
        size={14}
        color={isValid ? '#10B981' : '#EF4444'}
      />
      <Text style={{ marginLeft: 8, color: isValid ? '#10B981' : '#EF4444', fontSize: 12 }}>
        {message}
      </Text>
    </View>
  );
};

export default ValidationIndicator;