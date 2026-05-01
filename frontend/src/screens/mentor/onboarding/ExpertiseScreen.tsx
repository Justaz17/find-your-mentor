import React, { useState } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing, FontSize } from '../../../utils/constants';
import OnboardingProgress from '../../../components/common/OnboardingProgress';
import { MentorOnboardingParamList } from '../../../navigation/MentorOnboardingNavigator';
import { ROLE_PRESETS, RolePreset } from '../../../utils/rolePresets';
import { useMentorOnboarding } from '../../../context/MentorOnboardingContext';

type Nav = NativeStackNavigationProp<MentorOnboardingParamList>;

const PROFICIENCY_LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Expert', value: 'expert' },
];

interface SkillEntry {
  name: string;
  proficiency: string;
}

const ExpertiseScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { updateData, saveProfile, isSaving } = useMentorOnboarding();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const toggleRole = (roleName: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      next.has(roleName) ? next.delete(roleName) : next.add(roleName);
      return next;
    });
  };

  const addRole = (rolePreset: RolePreset) => {
    setSelectedRoles(prev => [...prev, rolePreset.role]);
    setSkillEntries(prev => {
      const existingNames = new Set(prev.map(s => s.name));
      const newSkills = rolePreset.skills
        .filter(name => !existingNames.has(name))
        .map(name => ({ name, proficiency: 'intermediate' }));
      return [...prev, ...newSkills];
    });
  };

  const removeRole = (roleName: string) => {
    setSelectedRoles(prev => prev.filter(r => r !== roleName));
  };

  const removeSkillManually = (skillName: string) => {
    setSkillEntries(prev => prev.filter(s => s.name !== skillName));
  };

  const setSkillProficiency = (skillName: string, proficiency: string) => {
    setSkillEntries(prev =>
      prev.map(s => s.name === skillName ? { ...s, proficiency } : s)
    );
  };

  const handleSaveAndNavigate = async (destination: keyof MentorOnboardingParamList) => {
  const updates = {
    skills: skillEntries.map(s => s.name),
    tags: skillEntries.length > 0
      ? skillEntries.map(s => `${s.name}:${s.proficiency}`).join(',')
      : '',
  };
  updateData(updates);
  await saveProfile(updates);
  navigation.navigate(destination as any);
};

  return (
    <View style={{ flex: 1, backgroundColor: Colours.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
      }}>
        <OnboardingProgress current={2} />
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
          Your expertise
        </Text>
        <Text style={{
          fontSize: FontSize.sm, color: Colours.textSecondary,
          fontWeight: '500', marginTop: 6,
        }}>
          Pick roles to pre-select skills, then fine-tune.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          gap: Spacing.md,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected skills */}
        {skillEntries.length > 0 && (
          <View style={{
            backgroundColor: Colours.surface, borderRadius: 14,
            padding: Spacing.md, gap: Spacing.sm,
            borderWidth: 1, borderColor: Colours.border,
          }}>
            <Text style={{
              fontSize: FontSize.xs, fontWeight: '700',
              color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Selected skills ({skillEntries.length})
            </Text>
            {skillEntries.map(entry => (
              <View key={entry.name} style={{
                gap: Spacing.sm, paddingBottom: Spacing.sm,
                borderBottomWidth: 1, borderBottomColor: Colours.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: Colours.text }}>
                    {entry.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeSkillManually(entry.name)}>
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color={Colours.error} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {PROFICIENCY_LEVELS.map(level => (
                    <TouchableOpacity
                      key={level.value}
                      style={{
                        flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
                        backgroundColor: entry.proficiency === level.value ? Colours.primary : Colours.background,
                        borderWidth: 1,
                        borderColor: entry.proficiency === level.value ? Colours.primary : Colours.border,
                      }}
                      onPress={() => setSkillProficiency(entry.name, level.value)}
                    >
                      <Text style={{
                        fontSize: FontSize.xs, fontWeight: '800',
                        color: entry.proficiency === level.value ? '#fff' : Colours.textSecondary,
                      }}>
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Role picker */}
        <Text style={{
          fontSize: FontSize.xs, fontWeight: '700',
          color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Browse by role
        </Text>

        {ROLE_PRESETS.map(categoryPreset => (
          <View key={categoryPreset.category} style={{
            backgroundColor: Colours.surface, borderRadius: 14,
            borderWidth: 1, borderColor: Colours.border, overflow: 'hidden',
          }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center',
                padding: Spacing.md, gap: Spacing.sm,
              }}
              onPress={() => toggleCategory(categoryPreset.category)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={categoryPreset.icon as any}
                size={18}
                color={Colours.primary}
              />
              <Text style={{ flex: 1, fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                {categoryPreset.category}
              </Text>
              {categoryPreset.roles.filter(r => selectedRoles.includes(r.role)).length > 0 && (
                <View style={{
                  backgroundColor: Colours.primary, borderRadius: 999,
                  paddingHorizontal: 8, paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>
                    {categoryPreset.roles.filter(r => selectedRoles.includes(r.role)).length}
                  </Text>
                </View>
              )}
              <MaterialCommunityIcons
                name={expandedCategories.has(categoryPreset.category) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colours.textSecondary}
              />
            </TouchableOpacity>

            {expandedCategories.has(categoryPreset.category) && (
              <View style={{
                borderTopWidth: 1, borderTopColor: Colours.border,
                padding: Spacing.sm, gap: 6,
              }}>
                {categoryPreset.roles.map(rolePreset => {
                  const isRoleSelected = selectedRoles.includes(rolePreset.role);
                  const isRoleExpanded = expandedRoles.has(rolePreset.role);

                  return (
                    <View key={rolePreset.role} style={{
                      backgroundColor: isRoleSelected ? Colours.primaryLight : Colours.background,
                      borderRadius: 12, borderWidth: 1,
                      borderColor: isRoleSelected ? Colours.primary : Colours.border,
                      overflow: 'hidden',
                    }}>
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          gap: Spacing.sm, padding: Spacing.sm,
                        }}
                        onPress={() => toggleRole(rolePreset.role)}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons
                          name={rolePreset.icon as any}
                          size={16}
                          color={isRoleSelected ? Colours.primary : Colours.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: FontSize.sm, fontWeight: '800',
                            color: isRoleSelected ? Colours.primary : Colours.text,
                          }}>
                            {rolePreset.role}
                          </Text>
                          <Text style={{
                            fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '500',
                          }}>
                            {rolePreset.skills.length} skills
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: isRoleSelected ? Colours.primary : Colours.background,
                            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
                            borderWidth: 1,
                            borderColor: isRoleSelected ? Colours.primary : Colours.border,
                            opacity: isRoleSelected ? 0.6 : 1,
                          }}
                          onPress={() => { if (!isRoleSelected) addRole(rolePreset); }}
                          activeOpacity={isRoleSelected ? 1 : 0.85}
                        >
                          <MaterialCommunityIcons
                            name={isRoleSelected ? 'check' : 'plus'}
                            size={12}
                            color={isRoleSelected ? '#fff' : Colours.primary}
                          />
                          <Text style={{
                            fontSize: 11, fontWeight: '800',
                            color: isRoleSelected ? '#fff' : Colours.primary,
                          }}>
                            {isRoleSelected ? 'Added' : 'Add all'}
                          </Text>
                        </TouchableOpacity>

                        <MaterialCommunityIcons
                          name={isRoleExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={Colours.textSecondary}
                        />
                      </TouchableOpacity>

                      {isRoleExpanded && (
                        <View style={{
                          borderTopWidth: 1, borderTopColor: Colours.border,
                          paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
                          gap: 2,
                        }}>
                          {rolePreset.skills.map(skillName => {
                            const isSelected = skillEntries.some(s => s.name === skillName);
                            return (
                              <TouchableOpacity
                                key={skillName}
                                style={{
                                  flexDirection: 'row', alignItems: 'center',
                                  gap: Spacing.sm, paddingVertical: 8,
                                  paddingHorizontal: Spacing.sm, borderRadius: 8,
                                  backgroundColor: isSelected ? Colours.primary + '12' : 'transparent',
                                }}
                                onPress={() => isSelected
                                  ? removeSkillManually(skillName)
                                  : setSkillEntries(prev => [...prev, { name: skillName, proficiency: 'intermediate' }])
                                }
                                activeOpacity={0.85}
                              >
                                <MaterialCommunityIcons
                                  name={isSelected ? 'check-circle' : 'plus-circle-outline'}
                                  size={18}
                                  color={isSelected ? Colours.primary : Colours.textSecondary}
                                />
                                <Text style={{
                                  flex: 1, fontSize: FontSize.sm, fontWeight: '600',
                                  color: isSelected ? Colours.primary : Colours.text,
                                }}>
                                  {skillName}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingBottom: insets.bottom + Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1, borderTopColor: Colours.border,
        backgroundColor: Colours.background,
        flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => handleSaveAndNavigate('OnboardingCongrats')}
          style={{
            paddingVertical: 16, paddingHorizontal: Spacing.md,
            borderRadius: 14, borderWidth: 1, borderColor: Colours.border,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: FontSize.sm, color: Colours.textSecondary, fontWeight: '700' }}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1, backgroundColor: Colours.primary, borderRadius: 14,
            paddingVertical: 16, flexDirection: 'row',
            justifyContent: 'center', alignItems: 'center', gap: 8,
          }}
          onPress={() => handleSaveAndNavigate('OnboardingCongrats')}
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

export default ExpertiseScreen;