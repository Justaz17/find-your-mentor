/**
 * DEV ONLY — remove before production
 * Drop <BecomeMentorDevButton /> anywhere in the app to quickly
 * promote the current logged-in user to mentor role.
 */
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';
import { Colors, Spacing, FontSize } from '../../utils/constants';

const BecomeMentorDevButton = () => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await api.post('/mentors/me/profile', {
        bio: 'Dev mentor profile',
        hourly_rate: 25,
        is_visible: true,
        skills: [],
        years_experience: 1,
        languages: 'English',
        session_format: 'online',
        location: 'Ireland',
        tags: '',
      });
      Alert.alert('Done', 'You are now a mentor. Restart the app or re-login to see the mentor dashboard.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={0.85} disabled={loading}>
      {loading
        ? <ActivityIndicator size="small" color="#fff" />
        : <Text style={styles.text}>DEV: Become a mentor</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5B21B6',
    borderStyle: 'dashed',
  },
  text: {
    color: '#fff',
    fontWeight: '900',
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
});

export default BecomeMentorDevButton;