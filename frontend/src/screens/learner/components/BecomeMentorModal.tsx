import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing } from '../../../utils/constants';
import { RootStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface BecomeMentorModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const BecomeMentorModal: React.FC<BecomeMentorModalProps> = ({ visible, onClose, onConfirm }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: Spacing.lg, width: '80%' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: Spacing.md }}>Become a Mentor?</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg }}>
          You'll be guided through setting up your mentor profile. You can't exit until it's complete.
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center' }}
            onPress={onClose}
          >
            <Text style={{ color: Colors.primary, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: Spacing.md, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center' }}
            onPress={onConfirm}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Let's go</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);