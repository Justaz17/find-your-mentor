import React from 'react';
import { View } from 'react-native';
import { Colors } from '../../utils/constants';

interface Props {
  current: number;
  total?: number;
}

const OnboardingProgress = ({ current, total = 5 }: Props) => (
  <View style={{ flexDirection: 'row', gap: 6 }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{
        flex: 1, height: 4, borderRadius: 99,
        backgroundColor: i <= current ? Colors.primary : Colors.border,
      }} />
    ))}
  </View>
);

export default OnboardingProgress;