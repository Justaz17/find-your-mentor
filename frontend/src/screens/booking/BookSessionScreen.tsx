import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Surface,
  RadioButton,
} from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { MentorService, AvailabilitySlot } from '../../types/Mentor';
import { getMentorServices } from '../../services/serviceService';
import { getMentorAvailability } from '../../services/mentorService';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import TimelinePickerComponent from '../../components/booking/TimeLinePicker';
import { styles } from '../../styles/BookSessionScreen.styles';

type BookSessionRouteProp = RouteProp<RootStackParamList, 'BookSession'>;
type BookSessionNavProp = NativeStackNavigationProp<RootStackParamList>;

const BookSessionScreen = () => {
  const route = useRoute<BookSessionRouteProp>();
  const navigation = useNavigation<BookSessionNavProp>();
  const insets = useSafeAreaInsets();
  const { mentorId } = route.params;

  // Step tracking: 1 = select service, 2 = select date, 3 = select time
  const [step, setStep] = useState(1);

  const [services, setServices] = useState<MentorService[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedService, setSelectedService] = useState<MentorService | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const [servicesData, slotsData] = await Promise.all([
          getMentorServices(mentorId),
          getMentorAvailability(mentorId),
        ]);
        setServices(servicesData);
        setSlots(slotsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load booking data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [mentorId]);

  // Group slots by local date to avoid UTC shifting
  const slotsByDate = useMemo(() => {
    const grouped: Record<string, AvailabilitySlot[]> = {};
    const now = new Date();

    const toLocalDateKey = (iso: string) => {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    slots
      .filter((s) => s.status === 'available' && new Date(s.start_time) > now)
      .forEach((slot) => {
        const date = toLocalDateKey(slot.start_time);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(slot);
      });

    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [slots]);

  const availableDates = Object.keys(slotsByDate);

  // Filter services that fit within available slot durations for selected date
  const compatibleServices = useMemo(() => {
    if (!selectedDate || !slotsByDate[selectedDate]) return services;

    const slotsForDate = slotsByDate[selectedDate];
    const maxSlotDuration = Math.max(
      ...slotsForDate.map((slot) => {
        return (new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / 60000;
      })
    );

    return services.filter((service) => service.duration_minutes <= maxSlotDuration);
  }, [services, selectedDate, slotsByDate]);

  const visibleServices = selectedDate ? compatibleServices : services;

  // Deselect service if it becomes incompatible after date change
  useEffect(() => {
    if (!selectedService) return;
    const stillCompatible = compatibleServices.some((s) => s.id === selectedService.id);
    if (!stillCompatible) {
      setSelectedService(null);
      setSelectedStartTime(null);
      setSelectedEndTime(null);
      setSelectedSlotId(null);
      setStep(2);
    }
  }, [compatibleServices, selectedService]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return d.toLocaleDateString('en-IE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-IE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTimeSelected = (startTime: string, endTime: string) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);

    // Find which availability slot this time window falls within,
    // so the backend can mark it as booked and prevent double-booking.
    const matchingSlot = (slotsByDate[selectedDate!] || []).find((slot) => {
      const slotStart = new Date(slot.start_time).getTime();
      const slotEnd = new Date(slot.end_time).getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      return start >= slotStart && end <= slotEnd;
    });

    setSelectedSlotId(matchingSlot?.id ?? null);
  };

  const handleContinueToConfirmation = () => {
    if (!selectedService || !selectedStartTime || !selectedEndTime || !selectedSlotId) return;

    navigation.navigate('BookingConfirmation', {
      mentorId,
      serviceId: selectedService.id,
      slotId: selectedSlotId,
      serviceName: selectedService.title,
      price: selectedService.price,
      slotStart: selectedStartTime,
      slotEnd: selectedEndTime,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Disable continue if we couldn't match a slot ID (shouldn't happen in practice)
  const canContinue =
    !!selectedService && !!selectedStartTime && !!selectedEndTime && !!selectedSlotId;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[styles.progressDot, s <= step && styles.progressDotActive]}
          />
        ))}
      </View>

      {/* Step 1: Select Service */}
      {step >= 1 && (
        <Card mode="outlined" style={styles.stepCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.stepTitle}>
              1. Choose a service
            </Text>

            {visibleServices.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                {selectedDate
                  ? 'No services fit the selected date. Try a different date.'
                  : "This mentor hasn't set up any services yet."}
              </Text>
            ) : (
              visibleServices.map((service) => (
                <Surface
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === service.id && styles.serviceCardSelected,
                  ]}
                  elevation={0}
                >
                  <RadioButton
                    value={String(service.id)}
                    status={selectedService?.id === service.id ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setSelectedService(service);
                      setStep(Math.max(step, 2));
                      setSelectedDate(null);
                      setSelectedStartTime(null);
                      setSelectedEndTime(null);
                      setSelectedSlotId(null);
                    }}
                    color={Colors.primary}
                  />
                  <View style={styles.serviceInfo}>
                    <Text variant="bodyLarge" style={styles.serviceName}>
                      {service.title}
                    </Text>
                    {!!service.description && (
                      <Text variant="bodySmall" style={styles.serviceDesc}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.serviceMeta}>
                      <Chip compact mode="flat" style={styles.durationChip} textStyle={styles.durationText}>
                        {service.duration_minutes} min
                      </Chip>
                      <Text variant="titleMedium" style={styles.servicePrice}>
                        {service.price === 0 ? 'Free' : `€${service.price}`}
                      </Text>
                    </View>
                  </View>
                </Surface>
              ))
            )}
          </Card.Content>
        </Card>
      )}

      {/* Step 2: Select Date */}
      {step >= 2 && (
        <Card mode="outlined" style={styles.stepCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.stepTitle}>
              2. Pick a date
            </Text>

            {availableDates.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No available dates right now. Check back later.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateRow}
              >
                {availableDates.map((date) => (
                  <Button
                    key={date}
                    mode={selectedDate === date ? 'contained' : 'outlined'}
                    onPress={() => {
                      setSelectedDate(date);
                      setSelectedStartTime(null);
                      setSelectedEndTime(null);
                      setSelectedSlotId(null);
                      setStep(Math.max(step, 3));
                    }}
                    style={[
                      styles.dateButton,
                      selectedDate === date && styles.dateButtonSelected,
                    ]}
                    labelStyle={[
                      styles.dateLabel,
                      selectedDate === date && styles.dateLabelSelected,
                    ]}
                    compact
                  >
                    {formatDate(date)}
                  </Button>
                ))}
              </ScrollView>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Step 2b: No compatible services warning */}
      {step >= 2 && selectedDate && compatibleServices.length === 0 && (
        <Card mode="outlined" style={styles.stepCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.warningText}>
              No compatible services for {formatDate(selectedDate)}
            </Text>
            <Text variant="bodySmall" style={styles.warningSubtext}>
              The available slots on this date are shorter than the service duration. Try a different date.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Step 3: Select Time */}
      {step >= 3 && selectedDate && selectedService && (
        <TimelinePickerComponent
          availabilitySlots={slotsByDate[selectedDate] || []}
          selectedDate={selectedDate}
          serviceDurationMinutes={selectedService.duration_minutes}
          onTimeSelected={handleTimeSelected}
        />
      )}

      {/* Summary + Continue */}
      {canContinue && (
        <View style={styles.bottomSection}>
          <Surface style={styles.summaryCard} elevation={0}>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Service</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>{selectedService!.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Date</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>{formatDate(selectedDate!)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Time</Text>
              <Text variant="bodyMedium" style={styles.summaryValue}>
                {formatTime(selectedStartTime!)} – {formatTime(selectedEndTime!)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium" style={styles.summaryLabel}>Total</Text>
              <Text variant="titleMedium" style={styles.summaryPrice}>
                {selectedService!.price === 0 ? 'Free' : `€${selectedService!.price}`}
              </Text>
            </View>
          </Surface>

          <Button
            mode="contained"
            onPress={handleContinueToConfirmation}
            style={styles.continueButton}
            contentStyle={styles.continueButtonContent}
            labelStyle={styles.continueButtonLabel}
          >
            Continue to Booking
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default BookSessionScreen;
