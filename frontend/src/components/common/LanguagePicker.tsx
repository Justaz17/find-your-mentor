import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { styles } from '../../styles/LanguagePicker.styles';

const LANGUAGES = [
  'English', 'Irish', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Polish', 'Lithuanian', 'Latvian', 'Estonian',
  'Romanian', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Russian', 'Ukrainian', 'Arabic', 'Mandarin', 'Japanese', 'Korean',
  'Hindi', 'Bengali', 'Urdu', 'Turkish', 'Persian', 'Swahili',
].sort();

interface LanguagePickerProps {
  value: string;          // comma-separated string stored in DB
  onChange: (value: string) => void;
}

const LanguagePicker = ({ value, onChange }: LanguagePickerProps) => {
  const [visible, setVisible] = useState(false);

  const selected = new Set(
    value ? value.split(',').map(l => l.trim()).filter(Boolean) : []
  );

  const toggle = (lang: string) => {
    const next = new Set(selected);
    next.has(lang) ? next.delete(lang) : next.add(lang);
    onChange(Array.from(next).join(','));
  };

  const displayValue = Array.from(selected).join(', ');

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="translate"
          size={20}
          color={selected.size > 0 ? Colors.text : Colors.textSecondary}
        />
        <Text style={[styles.triggerText, selected.size === 0 && styles.placeholder]}>
          {selected.size > 0 ? displayValue : 'Select languages'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Languages I speak</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {selected.size > 0 && (
            <View style={styles.selectedRow}>
              {Array.from(selected).map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={styles.selectedChip}
                  onPress={() => toggle(lang)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectedChipText}>{lang}</Text>
                  <MaterialCommunityIcons name="close" size={14} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {LANGUAGES.map(lang => {
              const isSelected = selected.has(lang);
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.option, isSelected && styles.optionActive]}
                  onPress={() => toggle(lang)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {lang}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default LanguagePicker;