import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export type GeoStatus = 'idle' | 'pending' | 'granted' | 'denied' | 'unavailable';

export type GeoCoords = {
  latitude: number;
  longitude: number;
};

export type GeoPreference = {
  status: GeoStatus;
  coords: GeoCoords | null;
  /** Chiede il permesso e, se concesso, recupera la posizione corrente. */
  request: () => Promise<void>;
  /** Forza lo stato 'denied' senza richiedere il permesso (skip esplicito dell'utente). */
  decline: () => void;
};

const DECLINE_STORAGE_KEY = 'iocisono:geoDeclined';

async function getCurrentCoords(): Promise<GeoCoords | null> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 60_000 },
      );
    });
  }

  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

export function useGeoPreference(): GeoPreference {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const declinedOnceRef = useRef(false);

  const persistDecline = useCallback((value: boolean) => {
    declinedOnceRef.current = value;
    AsyncStorage.setItem(DECLINE_STORAGE_KEY, value ? '1' : '0').catch(() => {});
  }, []);

  const request = useCallback(async () => {
    setStatus('pending');

    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setStatus('unavailable');
        return;
      }
      const next = await getCurrentCoords();
      if (next) {
        setCoords(next);
        setStatus('granted');
        persistDecline(false);
      } else {
        setStatus('denied');
        persistDecline(true);
      }
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setStatus('denied');
      persistDecline(true);
      return;
    }
    const next = await getCurrentCoords();
    if (next) {
      setCoords(next);
      setStatus('granted');
      persistDecline(false);
    } else {
      setStatus('denied');
      persistDecline(true);
    }
  }, [persistDecline]);

  const decline = useCallback(() => {
    setCoords(null);
    setStatus('denied');
    persistDecline(true);
  }, [persistDecline]);

  // su mount: ripristina lo stato precedente (denied persistito, oppure granted se sistema lo conferma)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const declined = await AsyncStorage.getItem(DECLINE_STORAGE_KEY);
        if (declined === '1' && !cancelled) {
          declinedOnceRef.current = true;
          setStatus('denied');
        }
      } catch {
        // storage non disponibile: continua col flusso normale
      }

      if (Platform.OS === 'web') return;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (permission.status === 'granted') {
          const next = await getCurrentCoords();
          if (!cancelled && next) {
            setCoords(next);
            setStatus('granted');
            persistDecline(false);
          }
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persistDecline]);

  return { status, coords, request, decline };
}
