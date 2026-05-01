import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import { styles } from '../../styles/LocationPicker.styles';

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
          color={value ? Colours.text : Colours.textSecondary}
        />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || 'Select location'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={Colours.textSecondary} />
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
              <MaterialCommunityIcons name="close" size={24} color={Colours.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colours.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search city or country..."
              placeholderTextColor={Colours.textSecondary}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colours.textSecondary} />
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
                  color={value === item ? Colours.primary : Colours.textSecondary}
                />
                <Text style={[styles.optionText, value === item && styles.optionTextActive]}>
                  {item}
                </Text>
                {value === item && (
                  <MaterialCommunityIcons name="check" size={18} color={Colours.primary} />
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

export default LocationPicker;