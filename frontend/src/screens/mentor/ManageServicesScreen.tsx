import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { MentorService } from '../../types/Mentor';
import {
  createService,
  updateService,
  deleteService,
  getMyServices,
} from '../../services/serviceService';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DURATIONS = [30, 45, 60, 90, 120];

interface ServiceFormState {
  title: string;
  description: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
}

const defaultForm = (): ServiceFormState => ({
  title: '',
  description: '',
  duration_minutes: 60,
  price: '',
  is_active: true,
});

const ManageServicesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const isOnboarding = route.params?.isOnboarding ?? false;
  const { user } = useAuth();

  const [services, setServices] = useState<MentorService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<MentorService | null>(null);
  const [form, setForm] = useState<ServiceFormState>(defaultForm());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      if (!user) return;
      const data = await getMyServices();
      setServices(data);
    } catch {
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    load();
  }, [load]));

  // ── Modal helpers ─────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingService(null);
    setForm(defaultForm());
    setError(null);
    setShowModal(true);
  };

  const openEdit = (service: MentorService) => {
    setEditingService(service);
    setForm({
      title: service.title,
      description: service.description ?? '',
      duration_minutes: service.duration_minutes,
      price: String(service.price),
      is_active: service.is_active,
    });
    setError(null);
    setShowModal(true);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError('Enter a valid price'); return; }

    setIsSaving(true);
    setError(null);
    try {
      if (editingService) {
        const updated = await updateService(editingService.id, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          duration_minutes: form.duration_minutes,
          price,
          is_active: form.is_active,
        });
        setServices(prev => prev.map(s => s.id === editingService.id ? updated : s));
      } else {
        const created = await createService({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          duration_minutes: form.duration_minutes,
          price,
        });
        setServices(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (service: MentorService) => {
    Alert.alert(
      'Delete Service',
      `Remove "${service.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(service.id);
              setServices(prev => prev.filter(s => s.id !== service.id));
            } catch {
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (service: MentorService) => {
    try {
      const updated = await updateService(service.id, { is_active: !service.is_active });
      setServices(prev => prev.map(s => s.id === service.id ? updated : s));
    } catch {
      Alert.alert('Error', 'Failed to update service');
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────

  const handleNext = () => {
    // In onboarding context go to availability, otherwise go back
    if (isOnboarding) {
      navigation.navigate('OnboardingAvailability' as any);
    } else {
      navigation.goBack();
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ── Header ── */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
      }}>
        {/* Back button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '900', color: Colors.text }}>
            My Services
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>
            {services.length} service{services.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Next button — onboarding only */}
        {isOnboarding && (
          <TouchableOpacity
            style={{
              backgroundColor: Colors.secondary, borderRadius: 12,
              paddingHorizontal: Spacing.md, paddingVertical: 8,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
            onPress={() => navigation.navigate('OnboardingAvailability' as any)}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: FontSize.sm }}>Next</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Add button — only when services exist */}
        {services.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: Colors.primary, borderRadius: 12,
              paddingHorizontal: Spacing.md, paddingVertical: 8,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
            onPress={openCreate}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: FontSize.sm }}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Service list ── */}
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          gap: Spacing.md,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {services.length === 0 ? (
          // Empty state
          <View style={{ alignItems: 'center', paddingTop: 80, gap: Spacing.md }}>
            <MaterialCommunityIcons name="briefcase-outline" size={56} color={Colors.border} />
            <Text style={{ fontSize: FontSize.lg, fontWeight: '900', color: Colors.text }}>
              No services yet
            </Text>
            <Text style={{
              fontSize: FontSize.sm, color: Colors.textSecondary,
              textAlign: 'center', lineHeight: 20,
            }}>
              Create your first service so learners can book sessions with you
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary, borderRadius: 14,
                paddingHorizontal: Spacing.xl, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}
              onPress={openCreate}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: FontSize.md }}>
                Create first service
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Service cards
          services.map(service => (
            <View key={service.id} style={{
              backgroundColor: Colors.background, borderRadius: 16,
              padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
              opacity: service.is_active ? 1 : 0.6,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>

                {/* Service info */}
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '900', color: Colors.text }}>
                      {service.title}
                    </Text>
                    {!service.is_active && (
                      <View style={{
                        backgroundColor: Colors.border, borderRadius: 999,
                        paddingHorizontal: 8, paddingVertical: 2,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.textSecondary }}>
                          INACTIVE
                        </Text>
                      </View>
                    )}
                  </View>
                  {service.description && (
                    <Text style={{
                      fontSize: FontSize.sm, color: Colors.textSecondary,
                      fontWeight: '600',
                    }} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    gap: Spacing.md, marginTop: 4,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary }}>
                        {service.duration_minutes} min
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="currency-eur" size={14} color={Colors.secondary} />
                      <Text style={{ fontSize: FontSize.xs, fontWeight: '800', color: Colors.secondary }}>
                        {service.price === 0 ? 'Free' : `€${service.price}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => handleToggleActive(service)}
                    style={{ padding: 8 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={service.is_active ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openEdit(service)}
                    style={{ padding: 8 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(service)}
                    style={{ padding: 8 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Create / Edit Modal ── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: Colors.background }}>

          {/* Modal header */}
          <View style={{
            paddingTop: Spacing.xl, paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
            flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
          }}>
            <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: FontSize.lg, fontWeight: '900', color: Colors.text }}>
              {editingService ? 'Edit Service' : 'New Service'}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary, borderRadius: 12,
                paddingHorizontal: Spacing.md, paddingVertical: 8,
              }}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '900', fontSize: FontSize.sm }}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Modal form */}
          <ScrollView
            contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error banner */}
            {error && (
              <View style={{
                backgroundColor: Colors.error + '15', borderRadius: 12,
                padding: Spacing.md, borderWidth: 1, borderColor: Colors.error + '30',
              }}>
                <Text style={{ color: Colors.error, fontWeight: '700', fontSize: FontSize.sm }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Title field */}
            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.text }}>
                Title <Text style={{ color: Colors.error }}>*</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
                  borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: 12,
                  fontSize: FontSize.sm, color: Colors.text, fontWeight: '600',
                }}
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder="e.g. Python Fundamentals Session"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Description field */}
            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.text }}>
                Description{' '}
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>(optional)</Text>
              </Text>
              <TextInput
                style={{
                  backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
                  borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: 12,
                  fontSize: FontSize.sm, color: Colors.text, fontWeight: '600',
                  minHeight: 80, textAlignVertical: 'top',
                }}
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
                placeholder="What will learners get from this session?"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Duration picker */}
            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.text }}>
                Duration
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DURATIONS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                      backgroundColor: form.duration_minutes === d ? Colors.primary : Colors.surface,
                      borderWidth: 1,
                      borderColor: form.duration_minutes === d ? Colors.primary : Colors.border,
                    }}
                    onPress={() => setForm(f => ({ ...f, duration_minutes: d }))}
                    activeOpacity={0.85}
                  >
                    <Text style={{
                      fontSize: FontSize.sm, fontWeight: '800',
                      color: form.duration_minutes === d ? '#fff' : Colors.textSecondary,
                    }}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price field */}
            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.text }}>
                Price{' '}
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>— 0 for free</Text>
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: Colors.surface, borderWidth: 1,
                borderColor: Colors.border, borderRadius: 12,
                paddingHorizontal: Spacing.md,
              }}>
                <MaterialCommunityIcons name="currency-eur" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={{
                    flex: 1, paddingVertical: 12, paddingHorizontal: 8,
                    fontSize: FontSize.sm, color: Colors.text, fontWeight: '600',
                  }}
                  value={form.price}
                  onChangeText={v => setForm(f => ({ ...f, price: v }))}
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Active toggle — edit mode only */}
            {editingService && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md,
                  borderWidth: 1, borderColor: Colors.border,
                }}
                onPress={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                activeOpacity={0.85}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.text }}>
                    Active
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>
                    Learners can see and book this service
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={form.is_active ? 'toggle-switch' : 'toggle-switch-off'}
                  size={36}
                  color={form.is_active ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default ManageServicesScreen;