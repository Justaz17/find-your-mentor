import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import { getEmailValidationError, getLoginErrors, getRegistrationErrors, passwordsMatch } from '../../utils/validators';
import { login, register } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import { styles } from '../../styles/AuthScreen.styles';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import ValidationIndicator from '../../components/auth/ValidationIndicator';

type AuthNavProp = NativeStackNavigationProp<RootStackParamList>;
type AuthRouteProp = RouteProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const { signIn } = useAuth();

  const initialTab = route.params?.initialTab ?? 'login';
  const initialWantsMentor = route.params?.wantsMentor ?? false;

  const [isLogin, setIsLogin] = useState(initialTab === 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [wantsMentor, setWantsMentor] = useState(initialWantsMentor);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    resetForm();
  };

  const handleLogin = async () => {
    const validationError = getLoginErrors(email, password);
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError(null);
    try {
      const response = await login({ email, password });
      await signIn(response.access_token);
      navigation.navigate('Main' as never);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    console.log('wantsMentor:', wantsMentor);
    console.log('role being sent:', wantsMentor ? 'mentor' : 'learner');
  const validationError = getRegistrationErrors(name, email, password, confirmPassword);
  if (validationError) { setError(validationError); return; }

  setIsLoading(true);
  setError(null);
  try {
    await register({ name, email, password, role: wantsMentor ? 'mentor' : 'learner' });
    const response = await login({ email, password });
    await signIn(response.access_token, true);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' as any }] })
    );
  } catch (err: any) {
    setError(err.message || 'Registration failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const handleSubmit = () => {
    if (isLogin) handleLogin();
    else handleRegister();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dismiss button */}
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="close" size={22} color={Colours.textSecondary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>FM</Text>
          </View>
          <Text style={styles.appTitle}>Find Your Mentor</Text>
          <Text style={styles.appSubtitle}>
            Connect with experts for personalised{'\n'}1-on-1 mentoring sessions
          </Text>
        </View>

        {/* Tab toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => { if (!isLogin) toggleMode(); }}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => { if (isLogin) toggleMode(); }}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={Colours.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colours.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {!isLogin && email && (
            <ValidationIndicator
              isValid={!getEmailValidationError(email)}
              message={getEmailValidationError(email) || 'Email valid'}
              showMessage={true}
            />
          )}
          </View>

          <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={Colours.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          {!isLogin && <PasswordStrengthIndicator password={password} />}
        </View>

          {!isLogin && (
            <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={Colours.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            {confirmPassword && (
              <ValidationIndicator
                isValid={passwordsMatch(password, confirmPassword)}
                message={passwordsMatch(password, confirmPassword) ? 'Passwords match' : 'Passwords do not match'}
                showMessage={true}
              />
            )}
          </View>

    {/* Mentor checkbox */}
    <TouchableOpacity
      style={styles.mentorCheckRow}
      onPress={() => setWantsMentor(prev => !prev)}
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, wantsMentor && styles.checkboxActive]}>
        {wantsMentor && (
          <MaterialCommunityIcons name="check" size={14} color="#fff" />
        )}
      </View>
      <View style={styles.mentorCheckText}>
        <Text style={styles.mentorCheckLabel}>I want to become a mentor</Text>
        <Text style={styles.mentorCheckSub}>
          You'll be guided to set up your mentor profile after signing up
        </Text>
      </View>
    </TouchableOpacity>
  </>
)}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color={Colours.textLight} />
              : <Text style={styles.submitButtonText}>
                  {isLogin ? 'Log In' : 'Create Account'}
                </Text>
            }
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Sign Up' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;