import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colours, Spacing, FontSize } from '../../../utils/constants';
import { RootStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface MentorOnlyStateProps {
  navigation: NavProp;
}

export const MentorOnlyState: React.FC<MentorOnlyStateProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colours.background }}>
      <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
        <Text style={{ fontSize: FontSize.xxl, fontWeight: '900', color: Colours.text }}>
          Learner Profile
        </Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg }}>
        <View style={{ alignItems: 'center', gap: Spacing.lg }}>
          <MaterialCommunityIcons name="account-plus" size={48} color={Colours.primary} />
          <Text style={{ fontSize: FontSize.lg, fontWeight: '900', color: Colours.text, textAlign: 'center' }}>
            Create your learner profile
          </Text>
          <Text style={{ fontSize: FontSize.sm, color: Colours.textSecondary, textAlign: 'center' }}>
            Start booking sessions with mentors by creating a learner profile.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: Colours.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginTop: Spacing.md,
            }}
            onPress={() => navigation.navigate('Onboarding' as never)}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '700' }}>
              Get started
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};