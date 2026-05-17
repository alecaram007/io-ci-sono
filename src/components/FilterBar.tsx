import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, fonts, tints } from '../theme';
import type { PlaceFilters } from '../types';
import type { GeoStatus } from '../hooks/useGeoPreference';

type Props = {
  filters: PlaceFilters;
  provinces: string[];
  geoStatus: GeoStatus;
  onChange: (filters: PlaceFilters) => void;
  onRequestLocation: () => void;
  onClearLocation: () => void;
};

export function FilterBar({
  filters,
  provinces,
  geoStatus,
  onChange,
  onRequestLocation,
  onClearLocation,
}: Props) {
  const showProvinceChips = geoStatus !== 'granted' && provinces.length > 0;

  const setProvince = (value: string) => {
    onChange({ ...filters, province: filters.province === value ? '' : value, city: '', region: '', country: '' });
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        value={filters.query}
        onChangeText={(query) => onChange({ ...filters, query })}
        placeholder="Cerca club, pub, piazze..."
        placeholderTextColor="#9C928A"
        style={styles.search}
        autoCorrect={false}
        accessibilityLabel="Cerca luoghi"
        returnKeyType="search"
      />

      <LocationStatus
        status={geoStatus}
        province={filters.province}
        onRequest={onRequestLocation}
        onClear={onClearLocation}
      />

      {showProvinceChips ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Scegli provincia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Tutte" active={!filters.province} onPress={() => setProvince('')} />
            {provinces.map((value) => (
              <Chip
                key={`province-${value}`}
                label={value}
                active={filters.province === value}
                onPress={() => setProvince(value)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function LocationStatus({
  status,
  province,
  onRequest,
  onClear,
}: {
  status: GeoStatus;
  province: string;
  onRequest: () => void;
  onClear: () => void;
}) {
  if (status === 'granted') {
    return (
      <View style={styles.statusRow}>
        <View style={styles.statusBadgeOn}>
          <View style={styles.statusDot} />
          <Text style={styles.statusTextOn}>Ordinati per vicinanza</Text>
        </View>
        <TouchableOpacity
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Non usare la posizione, scegli manualmente"
        >
          <Text style={styles.statusLink}>Scegli a mano</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Sto chiedendo la posizione…</Text>
        </View>
      </View>
    );
  }

  if (status === 'idle') {
    return (
      <TouchableOpacity
        onPress={onRequest}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel="Usa la mia posizione per ordinare i luoghi vicini"
      >
        <Text style={styles.ctaText}>Usa la mia posizione</Text>
        <Text style={styles.ctaHint}>vediamo cosa si muove vicino a te</Text>
      </TouchableOpacity>
    );
  }

  // denied | unavailable
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{province ? `Provincia: ${province}` : 'Scegli una provincia'}</Text>
      </View>
      <TouchableOpacity onPress={onRequest} accessibilityRole="button" accessibilityLabel="Riprova posizione">
        <Text style={styles.statusLink}>Usa posizione</Text>
      </TouchableOpacity>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filtra per ${label}`}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  search: {
    backgroundColor: colors.sand,
    borderRadius: 22,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tints.fog(0.1),
    backgroundColor: tints.fog(0.04),
  },
  statusBadgeOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tints.gold(0.42),
    backgroundColor: tints.gold(0.12),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.acid,
  },
  statusText: {
    color: colors.sand,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  statusTextOn: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  statusLink: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  cta: {
    backgroundColor: tints.gold(0.12),
    borderColor: tints.gold(0.5),
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ctaText: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  ctaHint: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  group: {
    gap: 6,
  },
  groupLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  chips: {
    gap: 8,
    paddingRight: 18,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: tints.fog(0.08),
    borderColor: tints.fog(0.12),
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.acid,
    borderColor: colors.acid,
  },
  chipText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.ink,
  },
});
