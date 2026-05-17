import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { MotionPreference } from '../types';

export function useMotionPreference(): MotionPreference {
  const [preference, setPreference] = useState<MotionPreference>('full');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setPreference(enabled ? 'reduced' : 'full');
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setPreference(enabled ? 'reduced' : 'full');
    });

    return () => subscription.remove();
  }, []);

  return preference;
}
