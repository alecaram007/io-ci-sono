import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { validateAdminPlaceDraft } from '../domain/adminPlace';
import { colors, fonts, tints } from '../theme';
import type { AdminPlaceDraft, Place, Report } from '../types';

const initialDraft: AdminPlaceDraft = {
  name: '',
  category: 'Club',
  city: 'Roma',
  province: 'RM',
  region: 'Lazio',
  country: 'Italia',
  latitude: '41.9028',
  longitude: '12.4964',
  description: '',
};

type Props = {
  places: Place[];
  reports: Report[];
  onCreatePlace: (draft: AdminPlaceDraft) => void;
  onTogglePlace: (placeId: string) => void;
};

export function AdminPanel({ places, reports, onCreatePlace, onTogglePlace }: Props) {
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | null>(null);

  const updateDraft = (key: keyof AdminPlaceDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (error) setError(null);
  };

  const submit = () => {
    const validationError = validateAdminPlaceDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    onCreatePlace(draft);
    setDraft(initialDraft);
    setError(null);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <Text style={styles.title}>Admin luoghi</Text>
        <Text style={styles.copy}>Crea i posti che conosci gia: citta, coordinate e descrizione bastano per farli comparire in lista e mappa.</Text>
        <Input label="Nome" value={draft.name} onChangeText={(value) => updateDraft('name', value)} />
        <Input label="Categoria" value={draft.category} onChangeText={(value) => updateDraft('category', value)} />
        <View style={styles.twoCols}>
          <Input label="Citta" value={draft.city} onChangeText={(value) => updateDraft('city', value)} />
          <Input label="Provincia" value={draft.province} onChangeText={(value) => updateDraft('province', value)} />
        </View>
        <View style={styles.twoCols}>
          <Input label="Regione" value={draft.region} onChangeText={(value) => updateDraft('region', value)} />
          <Input label="Nazione" value={draft.country} onChangeText={(value) => updateDraft('country', value)} />
        </View>
        <View style={styles.twoCols}>
          <Input label="Lat" value={draft.latitude} keyboardType="decimal-pad" onChangeText={(value) => updateDraft('latitude', value)} />
          <Input label="Lng" value={draft.longitude} keyboardType="decimal-pad" onChangeText={(value) => updateDraft('longitude', value)} />
        </View>
        <Input label="Descrizione" value={draft.description} multiline onChangeText={(value) => updateDraft('description', value)} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity onPress={submit} style={styles.createButton} accessibilityRole="button">
          <Text style={styles.createText}>Aggiungi luogo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Moderazione</Text>
        {reports.map((report) => (
          <View key={report.id} style={styles.reportRow}>
            <Text style={styles.reportText}>{report.reason}</Text>
            <Text style={styles.reportStatus}>{report.status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Luoghi attivi</Text>
        {places.map((place) => (
          <View key={place.id} style={styles.placeRow}>
            <View style={styles.placeTextBlock}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeMeta}>{place.city} / {place.category}</Text>
            </View>
            <TouchableOpacity onPress={() => onTogglePlace(place.id)} style={[styles.toggle, !place.isActive && styles.toggleOff]}>
              <Text style={styles.toggleText}>{place.isActive ? 'Attivo' : 'Nascosto'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

function Input(props: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; keyboardType?: 'default' | 'decimal-pad' }) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
        keyboardType={props.keyboardType ?? 'default'}
        style={[styles.input, props.multiline && styles.multiline]}
        placeholderTextColor="#9C928A"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingBottom: 30,
  },
  panel: {
    backgroundColor: tints.panel(0.94),
    borderColor: tints.fog(0.08),
    borderRadius: 30,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  title: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 31,
    lineHeight: 33,
  },
  copy: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    gap: 5,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.sand,
    borderRadius: 16,
    color: colors.ink,
    fontFamily: fonts.body,
    padding: 12,
  },
  multiline: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: colors.acid,
    borderRadius: 18,
    padding: 14,
  },
  createText: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 21,
  },
  reportRow: {
    alignItems: 'center',
    borderTopColor: tints.fog(0.06),
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  reportText: {
    color: colors.fog,
    flex: 1,
    fontFamily: fonts.body,
  },
  reportStatus: {
    color: colors.amber,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  placeRow: {
    alignItems: 'center',
    borderTopColor: tints.fog(0.06),
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  placeTextBlock: {
    flex: 1,
  },
  placeName: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  placeMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  toggle: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleOff: {
    backgroundColor: colors.panelSoft,
  },
  toggleText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
