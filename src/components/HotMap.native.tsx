import { useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, fonts, tints } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  places: PlaceWithPresence[];
  onSelect: (place: PlaceWithPresence) => void;
};

export function HotMap({ places, onSelect }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [permissionMessage, setPermissionMessage] = useState('Posizione non richiesta: la mappa funziona anche manualmente.');

  const initialRegion = useMemo(() => {
    const first = places[0];
    return {
      latitude: first?.latitude ?? 41.9028,
      longitude: first?.longitude ?? 12.4964,
      latitudeDelta: 5.8,
      longitudeDelta: 5.8,
    };
  }, [places]);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionMessage('Permesso negato: continui a vedere lista e mappa senza salvare GPS live.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion(
      {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      650,
    );
    setPermissionMessage('Posizione usata solo ora, in foreground, per centrarti sui luoghi vicini.');
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Mappa mobile</Text>
        <Text style={styles.fallbackCopy}>Su iOS/Android vedrai marker caldi e luoghi vicini. Sul web resta attiva la lista.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsCompass
        showsUserLocation
      >
        {places.map((place) => (
          <Marker key={place.id} coordinate={{ latitude: place.latitude, longitude: place.longitude }} onPress={() => onSelect(place)}>
            <View style={[styles.marker, { borderColor: place.heroColor }]}> 
              <Text style={styles.markerCount}>{place.totalCount}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      <View style={styles.mapOverlay} pointerEvents="box-none">
        <Text style={styles.mapTitle}>Heat map della serata</Text>
        <TouchableOpacity onPress={requestLocation} style={styles.locationButton} accessibilityRole="button">
          <Text style={styles.locationText}>Vicino a me</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.permission}>{permissionMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 30,
    height: 430,
    marginBottom: 18,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 14,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  mapTitle: {
    backgroundColor: tints.ink(0.86),
    borderRadius: 999,
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 20,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  locationButton: {
    backgroundColor: colors.acid,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 22,
    borderWidth: 4,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    width: 44,
  },
  markerCount: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  permission: {
    backgroundColor: tints.ink(0.86),
    borderRadius: 14,
    bottom: 12,
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    left: 12,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 12,
  },
  fallback: {
    backgroundColor: colors.panel,
    borderRadius: 30,
    marginBottom: 18,
    padding: 24,
  },
  fallbackTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 30,
  },
  fallbackCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    lineHeight: 20,
    marginTop: 8,
  },
});
