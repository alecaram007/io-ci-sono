import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, tints } from '../theme';
import type { PlaceMedia } from '../types';

type Props = {
  media: PlaceMedia;
  label: string;
  height: number;
  showCredit?: boolean;
};

const fallbackAssets = {
  icon: require('../../assets/icon.png'),
  splash: require('../../assets/splash-icon.png'),
};

export function PlaceImage({ media, label, height, showCredit = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(media.uri));

  useEffect(() => {
    setFailed(false);
    setLoading(Boolean(media.uri));
  }, [media.uri]);

  const isRemote = Boolean(media.uri) && !failed;
  const source = useMemo(() => {
    if (failed || !media.uri) return fallbackAssets[media.fallbackAsset];
    return { uri: media.uri };
  }, [failed, media.fallbackAsset, media.uri]);

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
      {loading && isRemote ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.fog} />
        </View>
      ) : null}
    </ImageBackground>
  );
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
});
