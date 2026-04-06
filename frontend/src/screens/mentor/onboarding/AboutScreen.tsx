import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../../utils/constants';
import LocationPicker from '../../../components/common/LocationPicker';
import LanguagePicker from '../../../components/common/LanguagePicker';
import OnboardingProgress from '../../../components/common/OnboardingProgress';
import { MentorOnboardingParamList } from '../../../navigation/MentorOnboardingNavigator';
import { useMentorOnboarding } from '../../../context/MentorOnboardingContext';

type Nav = NativeStackNavigationProp<MentorOnboardingParamList>;
const BIO_MAX = 300;

const AboutScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { data, updateData, saveProfile, isSaving } = useMentorOnboarding();

  const [bio, setBio] = useState(data.bio);
  const [location, setLocation] = useState(data.location);
  const [languages, setLanguages] = useState(data.languages);



  const handleNext = async () => {
  const updates = { bio: bio.trim(), location, languages };
  updateData(updates);
  await saveProfile(updates);
  navigation.navigate('OnboardingFormat');
};

//  const handleNext = async () => {
//   console.log('handleNext called');
//   console.log('data before update:', data);
//   updateData({ bio: bio.trim(), location, languages });
//   console.log('calling saveProfile');
//   try {
//     await saveProfile();
//     console.log('saveProfile done');
//   } catch (e) {
//     console.log('saveProfile error:', e);
//   }
//   navigation.navigate('OnboardingFormat');
// };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
      }}>
        <OnboardingProgress current={0} />
        <View style={{ height: Spacing.xl }} />
        <Text style={{
          fontSize: FontSize.xxl, fontWeight: '900',
          color: Colors.text, letterSpacing: -0.5,
        }}>
          About you
        </Text>
        <Text style={{
          fontSize: FontSize.sm, color: Colors.textSecondary,
          fontWeight: '500', marginTop: 6,
        }}>
          Help learners get to know you.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          gap: Spacing.lg,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bio */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{
            fontSize: FontSize.sm, fontWeight: '700',
            color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Bio
          </Text>
          <TextInput
            style={{
              backgroundColor: Colors.surface, borderWidth: 1,
              borderColor: Colors.border, borderRadius: 14,
              paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
              fontSize: FontSize.sm, color: Colors.text, fontWeight: '500',
              minHeight: 130, textAlignVertical: 'top', lineHeight: 22,
            }}
            value={bio}
            onChangeText={v => v.length <= BIO_MAX && setBio(v)}
            placeholder="What do you do and what can you teach?"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={5}
          />
          <Text style={{
            fontSize: FontSize.xs,
            color: bio.length > BIO_MAX * 0.9 ? Colors.error : Colors.textSecondary,
            fontWeight: '600', textAlign: 'right',
          }}>
            {bio.length}/{BIO_MAX}
          </Text>
          {/* Inspiration prompts */}
          <View style={{ gap: 4 }}>
            {[
              'What do you do professionally?',
              'What is your teaching style?',
              'What results have you helped others achieve?',
            ].map(prompt => (
              <View key={prompt} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="circle-small" size={16} color={Colors.primary} />
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>
                  {prompt}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{
            fontSize: FontSize.sm, fontWeight: '700',
            color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Location
          </Text>
          <LocationPicker value={location} onChange={setLocation} />
        </View>

        {/* Languages */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{
            fontSize: FontSize.sm, fontWeight: '700',
            color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Languages
          </Text>
          <LanguagePicker value={languages} onChange={setLanguages} />
        </View>
      </ScrollView>

      {/* Bottom — no skip, mandatory */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingBottom: insets.bottom + Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1, borderTopColor: Colors.border,
        backgroundColor: Colors.background,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: Colors.primary, borderRadius: 14,
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
    </KeyboardAvoidingView>
  );
};

export default AboutScreen;