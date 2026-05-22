import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAMESPACE = 'iocisono:';

/**
 * Hook stato + persistenza AsyncStorage trasparente.
 *
 * Uso:
 *   const [value, setValue, hydrated] = usePersistentState('myKey', defaultValue);
 *
 * - All'avvio carica il valore salvato (asincrono): finché hydrated è false
 *   il valore è quello di default.
 * - Ogni set scrive in AsyncStorage (fire-and-forget, errori ignorati).
 * - La chiave è automaticamente namespaced con `iocisono:` per evitare collisioni.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (next: T | ((current: T) => T)) => void, boolean] {
  const [value, setValueRaw] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const fullKey = useRef(`${NAMESPACE}${key}`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(fullKey.current);
        if (!cancelled && raw !== null) {
          setValueRaw(JSON.parse(raw) as T);
        }
      } catch {
        // dato corrotto o storage non disponibile: usiamo il default
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setValue = useCallback((next: T | ((current: T) => T)) => {
    setValueRaw((current) => {
      const resolved = typeof next === 'function' ? (next as (c: T) => T)(current) : next;
      AsyncStorage.setItem(fullKey.current, JSON.stringify(resolved)).catch(() => {});
      return resolved;
    });
  }, []);

  return [value, setValue, hydrated];
}
