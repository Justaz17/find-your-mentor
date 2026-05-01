import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, FontSize, Spacing } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
  duration?: number;
}

const Toast = ({ visible, message, type = 'success', onHide, duration = 3000 }: ToastProps) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(onHide);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const config = {
  success: {
    icon: 'check-circle-outline',
    color: '#fff',
    bg: Colours.secondary,
    border: Colours.secondary,
  },
  error: {
    icon: 'alert-circle-outline',
    color: '#fff',
    bg: Colours.error,
    border: Colours.error,
  },
  info: {
    icon: 'information-outline',
    color: '#fff',
    bg: Colours.primary,
    border: Colours.primary,
  },
}[type];

  return (
    <Animated.View style={{
      position: 'absolute',
      top: insets.top + Spacing.md,
      left: Spacing.lg,
      right: Spacing.lg,
      zIndex: 9999,
      opacity,
      transform: [{ translateY }],
    }}>
      <View style={{
        backgroundColor: config.bg,
        borderRadius: 14, padding: Spacing.md,
        borderWidth: 1, borderColor: config.border,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        shadowColor: '#000', shadowOpacity: 0.1,
        shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        elevation: 5,
      }}>
        <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
        <Text style={{ flex: 1, fontSize: FontSize.sm, fontWeight: '700', color: '#fff' }}>
        {message}
        </Text>
      </View>
    </Animated.View>
  );
};

export default Toast;