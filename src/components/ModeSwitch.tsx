import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, tints } from '../theme';
import type { DiscoveryMode } from '../types';

type Props = {
  mode: DiscoveryMode;
  onChange: (mode: DiscoveryMode) => void;
};

export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <View style={styles.modeRow} accessibilityRole="tablist">
      <ModeButton label="In onda" active={mode === 'list'} onPress={() => onChange('list')} />
      <ModeButton label="Mappa" active={mode === 'map'} onPress={() => onChange('map')} />
    </View>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    backgroundColor: tints.fog(0.06),
    borderRadius: 22,
    flexDirection: 'row',
    padding: 5,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    paddingVertical: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.panel,
  },
  modeText: {
    color: colors.muted,
    fontFamily: fonts.body,
  },
  modeTextActive: {
    color: colors.fog,
  },
});
