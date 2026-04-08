import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPasswordValidationErrors } from '../../utils/validators';
import { Spacing } from '../../utils/constants';

interface Props {
  password: string;
}

const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  const errors = getPasswordValidationErrors(password);

  if (!password) return null;

  if (errors.length === 0) {
    return (
      <View style={{ marginTop: Spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
          <Text style={{ marginLeft: 8, color: '#10B981', fontSize: 12 }}>
            Password is strong
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginTop: Spacing.xs }}>
      {errors.map((error, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <MaterialCommunityIcons name="close-circle" size={14} color="#EF4444" />
          <Text style={{ marginLeft: 8, color: '#EF4444', fontSize: 12 }}>
            {error}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default PasswordStrengthIndicator;