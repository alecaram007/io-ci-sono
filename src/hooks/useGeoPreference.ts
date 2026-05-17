import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
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
      } else {
        setStatus('denied');
      }
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setStatus('denied');
      return;
    }
    const next = await getCurrentCoords();
    if (next) {
      setCoords(next);
      setStatus('granted');
    } else {
      setStatus('denied');
    }
  }, []);

  const decline = useCallback(() => {
    setCoords(null);
    setStatus('denied');
  }, []);

  // su mount controlliamo lo stato corrente senza richiedere niente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (Platform.OS === 'web') return;
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (permission.status === 'granted') {
          const next = await getCurrentCoords();
          if (!cancelled && next) {
            setCoords(next);
            setStatus('granted');
          }
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, coords, request, decline };
}
