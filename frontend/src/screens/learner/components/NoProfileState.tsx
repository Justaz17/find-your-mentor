import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing } from '../../../utils/constants';
import { styles } from '../../../styles/LearnerDashboardScreen.styles';
import { RootStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface NoProfileStateProps {
  navigation: NavProp;
}

export const NoProfileState: React.FC<NoProfileStateProps> = ({ navigation }) => (
  <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Colours.surface }}>
    <View style={styles.noProfileCard}>
      <MaterialCommunityIcons name="account-edit-outline" size={40} color={Colours.primary} style={{ marginBottom: Spacing.sm }} />
      <Text style={styles.noProfileTitle}>Complete your learner profile</Text>
      <Text style={styles.noProfileSubtitle}>
        Add your skills, goals, and preferences so we can match you with the right mentors.
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('EditLearnerProfile', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.createButtonText}>Create my profile</Text>
      </TouchableOpacity>
    </View>
  </View>
);