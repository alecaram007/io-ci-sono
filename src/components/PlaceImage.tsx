import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, tints } from '../theme';
import type { PlaceMedia } from '../types';

type Props = {
  media: PlaceMedia;
  label: string;
  height: number;
  showCredit?: boolean;
};

export function PlaceImage({ media, label, height, showCredit = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(media.uri));

  useEffect(() => {
    setFailed(false);
    setLoading(Boolean(media.uri));
  }, [media.uri]);

  const source = useMemo(
    () => (media.uri ? { uri: media.uri } : null),
    [media.uri],
  );

  const hasPhoto = Boolean(source) && !failed;

  if (!hasPhoto || !source) {
    return <BrandCard media={media} label={label} height={height} />;
  }

  return (
    <ImageBackground
      source={source}
      style={[styles.image, { height }]}
      imageStyle={styles.imageRadius}
      onError={() => {
        setFailed(true);
        setLoading(false);
      }}
      onLoadEnd={() => setLoading(false)}
      accessibilityLabel={label}
    >
      <View style={styles.overlay}>
        <Text style={styles.label}>{label}</Text>
        {showCredit ? <Text style={styles.credit}>{media.credit}</Text> : null}
      </View>
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.fog} />
        </View>
      ) : null}
    </ImageBackground>
  );
}

function BrandCard({ media, label, height }: { media: PlaceMedia; label: string; height: number }) {
  const { name, category, heroColor } = media.brand;
  const accent = heroColor || colors.acid;

  return (
    <View style={[styles.brandCard, { height }]} accessibilityLabel={`${label} · ${name}`}>
      <LinearGradient
        colors={[withAlpha(accent, 0.32), withAlpha(accent, 0.08), 'rgba(11,13,16,0.94)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.brandFill}
      />
      <View style={[styles.brandAccent, { backgroundColor: accent }]} />
      <View style={styles.brandHeader}>
        <Text style={styles.brandLabel}>{label.toUpperCase()}</Text>
        <View style={[styles.brandDot, { backgroundColor: accent }]} />
      </View>
      <View style={styles.brandBody}>
        <Text style={styles.brandName} numberOfLines={2}>{name}</Text>
        <Text style={styles.brandCategory}>{category.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');
  if (sanitized.length !== 6) return `rgba(212, 176, 104, ${alpha})`;
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  image: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  imageRadius: {
    borderRadius: radius.md,
  },
  overlay: {
    backgroundColor: tints.ink(0.42),
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  label: {
    alignSelf: 'flex-start',
    backgroundColor: tints.ink(0.82),
    borderRadius: radius.pill,
    color: colors.fog,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  credit: {
    alignSelf: 'flex-start',
    backgroundColor: tints.ink(0.74),
    borderRadius: radius.pill,
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 10,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: tints.ink(0.36),
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  brandCard: {
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: tints.fog(0.08),
    backgroundColor: colors.dusk,
    justifyContent: 'flex-start',
    padding: 16,
    gap: 14,
  },
  brandFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  brandAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    opacity: 0.85,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLabel: {
    color: colors.fog,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    backgroundColor: tints.ink(0.6),
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  brandBody: {
    gap: 6,
  },
  brandName: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  brandCategory: {
    color: colors.sand,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
  },
});
