import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fonts, tints } from '../theme';
import type { Surface } from '../types';

type Props = {
  surface: Surface;
  isAdmin: boolean;
  onChange: (surface: Surface) => void;
};

type TabKey = Exclude<Surface, 'admin'> | 'admin';

type TabDef = {
  key: Surface;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

function DiscoverIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.fog : colors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={stroke} strokeWidth={2} />
      <Path d="m20 20-4.3-4.3" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function FriendsIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.fog : colors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.4" stroke={stroke} strokeWidth={2} />
      <Path d="M3 19c1-3.5 3.5-5 6-5s5 1.5 6 5" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="17.5" cy="9" r="2.6" stroke={stroke} strokeWidth={1.6} />
      <Path d="M14.5 16c.7-1.8 2-2.6 3.5-2.6s2.7.8 3.5 2.6" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function AdminIcon({ active }: { active: boolean }) {
  const stroke = active ? colors.fog : colors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke={stroke} strokeWidth={2} />
      <Path d="M7 9h10M7 13h7M7 16h5" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function BottomTabBar({ surface, isAdmin, onChange }: Props) {
  const tabs: TabDef[] = [
    { key: 'discover', label: 'Scopri', icon: (active) => <DiscoverIcon active={active} /> },
    { key: 'friends', label: 'Amici', icon: (active) => <FriendsIcon active={active} /> },
  ];
  if (isAdmin) {
    tabs.push({ key: 'admin', label: 'Admin', icon: (active) => <AdminIcon active={active} /> });
  }

  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = surface === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              {tab.icon(active)}
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
              {active ? <View style={styles.dot} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: tints.panel(0.92),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: tints.fog(0.08),
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 18,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: tints.gold(0.12),
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.fog,
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.acid,
  },
});
