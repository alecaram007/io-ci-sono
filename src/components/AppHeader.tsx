import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Logo } from './Logo';
import { colors, fonts, tints } from '../theme';
import type { AuthMode, DataSource, FontPreset, Profile, Surface } from '../types';

type Props = {
  surface: Surface;
  authMode: AuthMode;
  dataSource: DataSource;
  fontPreset: FontPreset;
  titleFont: string | undefined;
  currentUser: Profile;
  isIncognito: boolean;
  onToggleFont: () => void;
  onToggleIncognito: () => void;
};

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

const HEADLINES: Record<Surface, string> = {
  discover: 'La serata, prima di uscire.',
  friends: 'I tuoi.',
  admin: 'Gestione luoghi.',
};

function formatGreeting(now: Date): string {
  const day = DAY_NAMES[now.getDay()];
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `È ${day}, ${hh}:${mm}`;
}

function firstName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return 'amico';
  return trimmed.split(/\s+/)[0];
}

export function AppHeader({
  surface,
  authMode,
  dataSource,
  fontPreset,
  titleFont,
  currentUser,
  isIncognito,
  onToggleFont,
  onToggleIncognito,
}: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const greeting = formatGreeting(now);
  const headline = HEADLINES[surface];
  const isDemoMock = authMode === 'demo' && dataSource === 'mock';

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.identityRow}>
          <Logo size={40} radius={12} />
          <View>
            <Text style={styles.kicker}>CIAO, {firstName(currentUser.displayName).toUpperCase()}</Text>
            <Text style={[styles.greeting, { fontFamily: titleFont }]}>{greeting}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onToggleFont}
          style={styles.fontSwitch}
          accessibilityRole="button"
          accessibilityLabel={`Cambia preset font, attualmente ${fontPreset === 'editorial' ? 'editoriale' : 'legacy'}`}
        >
          <Text style={styles.fontSwitchText}>{fontPreset === 'editorial' ? 'Aa' : 'Aa*'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.headline, { fontFamily: titleFont }]}>{headline}</Text>

      <View style={styles.chipRow}>
        <TouchableOpacity
          onPress={onToggleIncognito}
          style={[styles.incognitoChip, isIncognito && styles.incognitoChipActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: isIncognito }}
          accessibilityLabel={isIncognito ? 'Disattiva modalità invisibile' : 'Attiva modalità invisibile'}
        >
          <View style={[styles.incognitoDot, isIncognito && styles.incognitoDotOn]} />
          <Text style={[styles.incognitoText, isIncognito && styles.incognitoTextOn]}>
            {isIncognito ? 'Stasera invisibile · ON' : 'Stasera invisibile'}
          </Text>
        </TouchableOpacity>
        {isDemoMock ? (
          <View style={styles.demoBadge} accessibilityElementsHidden importantForAccessibility="no">
            <Text style={styles.demoBadgeText}>demo · dati locali</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kicker: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  greeting: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 18,
    fontStyle: 'italic',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  fontSwitch: {
    backgroundColor: tints.fog(0.05),
    borderColor: tints.fog(0.1),
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fontSwitchText: {
    color: colors.sand,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  headline: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 36,
    maxWidth: 320,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  incognitoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tints.fog(0.05),
    borderWidth: 1,
    borderColor: tints.fog(0.1),
  },
  incognitoChipActive: {
    backgroundColor: tints.gold(0.14),
    borderColor: tints.gold(0.42),
  },
  incognitoDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: tints.fog(0.3),
  },
  incognitoDotOn: {
    backgroundColor: colors.acid,
  },
  incognitoText: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  incognitoTextOn: {
    color: colors.acid,
  },
  demoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: tints.gold(0.08),
    borderWidth: 1,
    borderColor: tints.gold(0.2),
    justifyContent: 'center',
  },
  demoBadgeText: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
