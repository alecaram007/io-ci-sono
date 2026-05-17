import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, tints } from '../theme';

type Props = {
  size?: number;
  withFrame?: boolean;
  radius?: number;
};

// Grid tipografica del glifo (viewBox 0 0 64 64):
//   - baseline a y=48
//   - x-height da y=26 a y=48 (corpo minuscola = 22)
//   - tittle della i centrato sopra il body
//   - i e o condividono baseline e x-height
const I_STEM_X = 18;
const I_STEM_W = 4;
const I_STEM_TOP = 26;
const I_STEM_BOTTOM = 48;
const I_FOOT_W = 12;
const I_FOOT_X = I_STEM_X + I_STEM_W / 2 - I_FOOT_W / 2;
const I_FOOT_Y = 48;
const I_FOOT_H = 2;
const I_DOT_CX = I_STEM_X + I_STEM_W / 2;
const I_DOT_CY = 15;
const I_DOT_R = 4.5;

const O_CX = 42;
const O_CY = 37;
const O_R = 11;
const O_STROKE = 3;
const O_INNER_R = 2.8;

export function Logo({ size = 64, withFrame = true, radius }: Props) {
  const frameRadius = radius ?? Math.round(size * 0.28);
  const glyph = <LogoGlyph size={size} />;

  if (!withFrame) {
    return glyph;
  }

  return (
    <View
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: frameRadius },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Io ci sono"
    >
      <LinearGradient
        colors={['#181410', '#0B0D10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.frameFill, { borderRadius: frameRadius }]}
      />
      <View style={styles.glow} pointerEvents="none">
        <LinearGradient
          colors={[tints.gold(0.22), 'rgba(11,13,16,0)']}
          start={{ x: 0.15, y: 0.15 }}
          end={{ x: 1, y: 1 }}
          style={[styles.frameFill, { borderRadius: frameRadius }]}
        />
      </View>
      {glyph}
    </View>
  );
}

function LogoGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" style={styles.glyph}>
      <Defs>
        <RadialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.acid} stopOpacity="0.32" />
          <Stop offset="100%" stopColor={colors.acid} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* alone tenue solo dietro al tittle della i */}
      <Circle cx={I_DOT_CX} cy={I_DOT_CY} r={I_DOT_R * 2.2} fill="url(#dotGlow)" />

      {/* i — asta + foot + tittle */}
      <Rect
        x={I_STEM_X}
        y={I_STEM_TOP}
        width={I_STEM_W}
        height={I_STEM_BOTTOM - I_STEM_TOP}
        rx={1.2}
        fill={colors.fog}
      />
      <Rect
        x={I_FOOT_X}
        y={I_FOOT_Y}
        width={I_FOOT_W}
        height={I_FOOT_H}
        rx={1}
        fill={colors.fog}
      />
      <Circle cx={I_DOT_CX} cy={I_DOT_CY} r={I_DOT_R} fill={colors.acid} />

      {/* o — anello + centro acceso */}
      <Circle
        cx={O_CX}
        cy={O_CY}
        r={O_R}
        stroke={colors.fog}
        strokeWidth={O_STROKE}
        fill="none"
      />
      <Circle cx={O_CX} cy={O_CY} r={O_INNER_R} fill={colors.acid} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glyph: {
    position: 'relative',
  },
});
