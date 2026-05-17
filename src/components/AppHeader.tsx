import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  isAdmin: boolean;
  onSurfaceChange: (surface: Surface) => void;
  onToggleFont: () => void;
};

const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

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
  isAdmin,
  onSurfaceChange,
  onToggleFont,
}: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const greeting = formatGreeting(now);

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

      <Text style={[styles.headline, { fontFamily: titleFont }]}>La serata, prima di uscire.</Text>

      <View style={styles.cardRow} accessibilityRole="tablist">
        <NavCard label="Scopri" active={surface === 'discover'} onPress={() => onSurfaceChange('discover')} />
        <NavCard label="Amici" active={surface === 'friends'} onPress={() => onSurfaceChange('friends')} />
        {isAdmin ? (
          <NavCard label="Admin" active={surface === 'admin'} onPress={() => onSurfaceChange('admin')} />
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {authMode === 'otp' ? 'sessione otp' : 'sessione demo'} · {dataSource === 'supabase' ? 'dati live' : 'dati mock'}
        </Text>
      </View>
    </View>
  );
}

function NavCard({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  if (active) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        accessibilityLabel={label}
        style={styles.cardActiveWrap}
      >
        <LinearGradient
          colors={[tints.gold(0.22), tints.copper(0.14)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardActive}
        >
          <Text style={styles.cardLabelActive}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      accessibilityRole="tab"
      accessibilityState={{ selected: false }}
      accessibilityLabel={label}
    >
      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 14,
    marginBottom: 18,
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
  cardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: tints.fog(0.04),
    borderColor: tints.fog(0.08),
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActiveWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tints.gold(0.5),
  },
  cardActive: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  cardLabelActive: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  metaRow: {
    alignItems: 'flex-start',
  },
  metaText: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
