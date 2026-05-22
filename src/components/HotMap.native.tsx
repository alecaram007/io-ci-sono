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

// Centro geografico della Sicilia (Enna, baricentro reale). Default region.
const SICILY_CENTER = {
  latitude: 37.6,
  longitude: 14.05,
  latitudeDelta: 2.8,
  longitudeDelta: 2.8,
};

// Limite di marker visibili in mappa: i top per affollamento.
// Oltre questo numero la mappa diventa una macchia di pin.
const MAX_MARKERS = 40;

export function HotMap({ places, onSelect }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  const initialRegion = useMemo(() => {
    if (places.length === 0) return SICILY_CENTER;
    // Centra sul baricentro dei top luoghi (più stabile che usare il primo).
    const top = [...places].sort((a, b) => b.totalCount - a.totalCount).slice(0, 20);
    const avgLat = top.reduce((sum, p) => sum + p.latitude, 0) / top.length;
    const avgLng = top.reduce((sum, p) => sum + p.longitude, 0) / top.length;
    return { latitude: avgLat, longitude: avgLng, latitudeDelta: 2.4, longitudeDelta: 2.4 };
  }, [places]);

  // Mostra solo i top N per affollamento → mappa leggibile.
  const visibleMarkers = useMemo(() => {
    return [...places].sort((a, b) => b.totalCount - a.totalCount).slice(0, MAX_MARKERS);
  }, [places]);
  const hiddenCount = Math.max(0, places.length - visibleMarkers.length);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionMessage('Permesso negato — continuo a mostrarti la Sicilia di default.');
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
    setPermissionMessage(null);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Mappa mobile</Text>
        <Text style={styles.fallbackCopy}>Su iOS/Android vedrai i marker più caldi della serata. Sul web resta attiva la lista.</Text>
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
        showsCompass={false}
        showsUserLocation
      >
        {visibleMarkers.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            onPress={() => onSelect(place)}
            tracksViewChanges={false}
          >
            <View style={[styles.marker, { borderColor: place.heroColor }]}>
              <Text style={styles.markerCount}>{place.totalCount}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Overlay top: titolo a sinistra, CTA Vicino a me a destra */}
      <View style={styles.topRow} pointerEvents="box-none">
        <View style={styles.titlePill}>
          <Text style={styles.titleText}>Heat map · top {visibleMarkers.length}</Text>
        </View>
        <TouchableOpacity onPress={requestLocation} style={styles.locationButton} accessibilityRole="button" accessibilityLabel="Centra la mappa sulla mia posizione">
          <Text style={styles.locationText}>📍 Vicino a me</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom note: status / hidden count */}
      {(permissionMessage || hiddenCount > 0) ? (
        <View style={styles.bottomNote} pointerEvents="none">
          <Text style={styles.bottomNoteText} numberOfLines={2}>
            {permissionMessage ?? `+${hiddenCount} luoghi minori non mostrati · affina filtri o zoom`}
          </Text>
        </View>
      ) : null}
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
  topRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titlePill: {
    backgroundColor: tints.ink(0.86),
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: tints.fog(0.08),
  },
  titleText: {
    color: colors.fog,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  locationButton: {
    backgroundColor: colors.acid,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  locationText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
  },
  marker: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 20,
    borderWidth: 3,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 8,
    width: 36,
  },
  markerCount: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  bottomNote: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: tints.ink(0.86),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tints.fog(0.08),
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomNoteText: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
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
