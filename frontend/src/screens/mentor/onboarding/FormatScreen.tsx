import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing, FontSize } from '../../../utils/constants';
import OnboardingProgress from '../../../components/common/OnboardingProgress';
import { MentorOnboardingParamList } from '../../../navigation/MentorOnboardingNavigator';
import { useMentorOnboarding } from '../../../context/MentorOnboardingContext';

type Nav = NativeStackNavigationProp<MentorOnboardingParamList>;

const FORMATS = [
  {
    value: 'online',
    label: 'Online',
    icon: 'laptop',
    description: 'Video calls, screen sharing, remote sessions',
  },
  {
    value: 'in_person',
    label: 'In-person',
    icon: 'account-group-outline',
    description: 'Meet at an agreed location',
  },
  {
    value: 'both',
    label: 'Both',
    icon: 'swap-horizontal',
    description: 'Flexible - whatever works for the learner',
  },
];

const FormatScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data, updateData, saveProfile, isSaving } = useMentorOnboarding();
  const [selected, setSelected] = useState(data.sessionFormat);

  const handleNext = async () => {
  const updates = { sessionFormat: selected };
  updateData(updates);
  await saveProfile(updates);
  navigation.navigate('OnboardingExpertise');
};

  return (
    <View style={{ flex: 1, backgroundColor: Colours.background }}>
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
      }}>
        <OnboardingProgress current={1} />
        <View style={{ height: Spacing.xl }} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: Spacing.md }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colours.text} />
        </TouchableOpacity>
        <Text style={{
          fontSize: FontSize.xxl, fontWeight: '900',
          color: Colours.text, letterSpacing: -0.5,
        }}>
          How do you teach?
        </Text>
        <Text style={{
          fontSize: FontSize.sm, color: Colours.textSecondary,
          fontWeight: '500', marginTop: 6,
        }}>
          You can change this anytime.
        </Text>
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, flex: 1 }}>
        {FORMATS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
              backgroundColor: selected === f.value ? Colours.primaryLight : Colours.surface,
              borderRadius: 16, padding: Spacing.md, borderWidth: 2,
              borderColor: selected === f.value ? Colours.primary : Colours.border,
            }}
            onPress={() => setSelected(f.value)}
            activeOpacity={0.85}
          >
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: selected === f.value ? Colours.primary : Colours.border,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <MaterialCommunityIcons
                name={f.icon as any}
                size={26}
                color={selected === f.value ? '#fff' : Colours.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: FontSize.md, fontWeight: '800',
                color: selected === f.value ? Colours.primary : Colours.text,
              }}>
                {f.label}
              </Text>
              <Text style={{
                fontSize: FontSize.sm, color: Colours.textSecondary,
                fontWeight: '500', marginTop: 2,
              }}>
                {f.description}
              </Text>
            </View>
            {selected === f.value && (
              <MaterialCommunityIcons name="check-circle" size={24} color={Colours.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom — no skip, mandatory */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingBottom: insets.bottom + Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1, borderTopColor: Colours.border,
        backgroundColor: Colours.background,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: Colours.primary, borderRadius: 14,
            paddingVertical: 16, flexDirection: 'row',
            justifyContent: 'center', alignItems: 'center', gap: 8,
          }}
          onPress={handleNext}
          activeOpacity={0.88}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FormatScreen;