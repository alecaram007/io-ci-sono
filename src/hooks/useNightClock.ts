import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getNightKey, getTonightLabel } from '../domain/night';

type NightClock = {
  nightKey: string;
  tonightLabel: string;
};

export function useNightClock(timeZone: string): NightClock {
  const compute = () => ({
    nightKey: getNightKey(timeZone),
    tonightLabel: getTonightLabel(timeZone),
  });

  const [state, setState] = useState<NightClock>(compute);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const update = () => setState(compute());

    const startTimer = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(update, 60_000);
    };

    const stopTimer = () => {
      if (!timerRef.current) return;
      clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        update();
        startTimer();
      } else {
        stopTimer();
      }
    };

    startTimer();
    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      stopTimer();
      subscription.remove();
    };
  }, [timeZone]);

  return state;
}
