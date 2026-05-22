import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { validateAdminPlaceDraft } from '../domain/adminPlace';
import { colors, fonts, tints } from '../theme';
import type { AdminPlaceDraft, Place, Report } from '../types';

const initialDraft: AdminPlaceDraft = {
  name: '',
  category: 'Cocktail bar',
  city: '',
  province: '',
  region: 'Sicilia',
  country: 'Italia',
  latitude: '',
  longitude: '',
  description: '',
  photoUri: undefined,
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
  const [busy, setBusy] = useState<null | 'location' | 'photo'>(null);

  const updateDraft = (key: keyof AdminPlaceDraft, value: string | undefined) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (error) setError(null);
  };

  const useCurrentLocation = async () => {
    setBusy('location');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permesso posizione negato — inserisci lat/lng a mano.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setDraft((current) => ({
        ...current,
        latitude: position.coords.latitude.toFixed(5),
        longitude: position.coords.longitude.toFixed(5),
      }));
    } catch {
      setError('Posizione non disponibile — inserisci lat/lng a mano.');
    } finally {
      setBusy(null);
    }
  };

  const pickPhoto = async () => {
    setBusy('photo');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Permesso galleria negato — non posso caricare la foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        updateDraft('photoUri', result.assets[0].uri);
      }
    } catch {
      setError('Selezione foto non riuscita.');
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = () => updateDraft('photoUri', undefined);

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
        <Text style={styles.copy}>
          Aggiungi un posto che conosci. Carica una foto vera del locale e usa la tua posizione per coordinate precise.
        </Text>

        <Input label="Nome" placeholder="es. Oceanomare" value={draft.name} onChangeText={(value) => updateDraft('name', value)} />
        <Input label="Categoria" placeholder="Cocktail bar, Discoteca, Lounge…" value={draft.category} onChangeText={(value) => updateDraft('category', value)} />
        <View style={styles.twoCols}>
          <Input label="Città" placeholder="Agrigento" value={draft.city} onChangeText={(value) => updateDraft('city', value)} />
          <Input label="Provincia" placeholder="AG" value={draft.province} autoCapitalize="characters" maxLength={4} onChangeText={(value) => updateDraft('province', value)} />
        </View>
        <View style={styles.twoCols}>
          <Input label="Regione" value={draft.region} onChangeText={(value) => updateDraft('region', value)} />
          <Input label="Nazione" value={draft.country} onChangeText={(value) => updateDraft('country', value)} />
        </View>

        {/* COORDINATE */}
        <View style={styles.coordHeader}>
          <Text style={styles.sectionLabel}>Coordinate</Text>
          <TouchableOpacity onPress={useCurrentLocation} disabled={busy === 'location'} style={styles.helperButton} accessibilityRole="button" accessibilityLabel="Riempi lat e lng con la mia posizione">
            <Text style={styles.helperButtonText}>{busy === 'location' ? '⏳ leggo…' : '📍 Usa la mia posizione'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.twoCols}>
          <Input label="Lat" placeholder="37.2585" value={draft.latitude} keyboardType="decimal-pad" onChangeText={(value) => updateDraft('latitude', value)} />
          <Input label="Lng" placeholder="13.5940" value={draft.longitude} keyboardType="decimal-pad" onChangeText={(value) => updateDraft('longitude', value)} />
        </View>

        {/* FOTO DEL LOCALE */}
        <Text style={styles.sectionLabel}>Foto del locale</Text>
        {draft.photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: draft.photoUri }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity onPress={removePhoto} style={styles.photoRemove} accessibilityRole="button" accessibilityLabel="Rimuovi foto">
              <Text style={styles.photoRemoveText}>Rimuovi foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={pickPhoto} disabled={busy === 'photo'} style={styles.photoPicker} accessibilityRole="button" accessibilityLabel="Carica foto del locale">
            <Text style={styles.photoPickerTitle}>{busy === 'photo' ? '⏳ apro galleria…' : '📷 Carica una foto'}</Text>
            <Text style={styles.photoPickerHint}>JPG/PNG dalla galleria · 4:3 consigliato</Text>
          </TouchableOpacity>
        )}

        <Input label="Descrizione" placeholder="Come e dove è il posto, vibe, orari…" value={draft.description} multiline onChangeText={(value) => updateDraft('description', value)} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity onPress={submit} style={styles.createButton} accessibilityRole="button">
          <Text style={styles.createText}>Aggiungi luogo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Moderazione</Text>
        {reports.length === 0 ? (
          <Text style={styles.copy}>Nessuna segnalazione aperta. Tutto in ordine.</Text>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={styles.reportRow}>
              <Text style={styles.reportText}>{report.reason}</Text>
              <Text style={styles.reportStatus}>{report.status}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Luoghi attivi</Text>
        {places.map((place) => (
          <View key={place.id} style={styles.placeRow}>
            <View style={styles.placeTextBlock}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeMeta}>{place.city} · {place.category}</Text>
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

function Input(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        multiline={props.multiline}
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize={props.autoCapitalize}
        maxLength={props.maxLength}
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
    fontSize: 28,
    lineHeight: 32,
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
  sectionLabel: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  coordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  helperButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tints.gold(0.14),
    borderColor: tints.gold(0.42),
    borderWidth: 1,
  },
  helperButtonText: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  photoPicker: {
    backgroundColor: tints.fog(0.05),
    borderColor: tints.fog(0.18),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    gap: 4,
  },
  photoPickerTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 16,
  },
  photoPickerHint: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  photoPreviewWrap: {
    gap: 8,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  photoRemove: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tints.danger(0.18),
    borderWidth: 1,
    borderColor: tints.danger(0.42),
  },
  photoRemoveText: {
    color: '#E8C4B8',
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
    color: '#E8C4B8',
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
    fontSize: 19,
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
