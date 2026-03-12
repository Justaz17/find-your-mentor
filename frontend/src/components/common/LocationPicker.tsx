import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../utils/constants';

// Curated list — countries + major cities most relevant to an Irish platform
// Easily extendable
const LOCATIONS = [
  // Ireland
  'Dublin, Ireland', 'Cork, Ireland', 'Galway, Ireland', 'Limerick, Ireland',
  'Waterford, Ireland', 'Kilkenny, Ireland', 'Athlone, Ireland', 'Sligo, Ireland',
  'Drogheda, Ireland', 'Remote (Ireland)',
  // UK
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK',
  'Glasgow, UK', 'Bristol, UK', 'Leeds, UK', 'Liverpool, UK',
  // Europe
  'Amsterdam, Netherlands', 'Berlin, Germany', 'Paris, France',
  'Barcelona, Spain', 'Madrid, Spain', 'Lisbon, Portugal',
  'Warsaw, Poland', 'Vilnius, Lithuania', 'Riga, Latvia', 'Tallinn, Estonia',
  'Prague, Czech Republic', 'Vienna, Austria', 'Zurich, Switzerland',
  'Rome, Italy', 'Milan, Italy', 'Brussels, Belgium', 'Stockholm, Sweden',
  // North America
  'New York, USA', 'San Francisco, USA', 'Austin, USA', 'Chicago, USA',
  'Toronto, Canada', 'Vancouver, Canada',
  // Other
  'Sydney, Australia', 'Melbourne, Australia',
  'Dubai, UAE', 'Singapore',
  // Generic
  'Remote (Worldwide)',
].sort();

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return LOCATIONS;
    const q = search.toLowerCase();
    return LOCATIONS.filter(l => l.toLowerCase().includes(q));
  }, [search]);

  const handleSelect = (location: string) => {
    onChange(location);
    setVisible(false);
    setSearch('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={20}
          color={value ? Colors.text : Colors.textSecondary}
        />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || 'Select location'}
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
            <Text style={styles.modalTitle}>Location</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search city or country..."
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, value === item && styles.optionActive]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={18}
                  color={value === item ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.optionText, value === item && styles.optionTextActive]}>
                  {item}
                </Text>
                {value === item && (
                  <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  placeholder: { color: Colors.textSecondary },

  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
    gap: Spacing.sm,
  },
  optionActive: { backgroundColor: Colors.primaryLight },
  optionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  optionTextActive: { color: Colors.primary, fontWeight: '800' },
});

export default LocationPicker;