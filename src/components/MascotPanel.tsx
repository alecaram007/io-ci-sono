import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  places: PlaceWithPresence[];
  onOpenPlace: (placeId: string) => void;
  onBackToDiscover: () => void;
};

export function MascotPanel({ places, onOpenPlace, onBackToDiscover }: Props) {
  const topPlaces = places.slice(0, 3);
  const hottest = topPlaces[0];
  const provinceCount = new Set(places.map((place) => place.province)).size;
  const wildCount = places.filter((place) => place.heatLevel === 'wild').length;

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <View style={styles.orbitOne} />
        <View style={styles.orbitTwo} />
        <View style={styles.mascotShell} accessibilityLabel="Mizzi, mascotte dell'app Io ci sono">
          <View style={styles.geckoHead}>
            <View style={[styles.eye, styles.eyeLeft]} />
            <View style={[styles.eye, styles.eyeRight]} />
            <View style={styles.smile} />
          </View>
          <View style={styles.geckoBody}>
            <View style={styles.belly} />
          </View>
          <View style={[styles.leg, styles.legOne]} />
          <View style={[styles.leg, styles.legTwo]} />
          <View style={[styles.leg, styles.legThree]} />
          <View style={[styles.leg, styles.legFour]} />
          <View style={styles.tail} />
        </View>
        <Text style={styles.kicker}>/mascotte avviata</Text>
        <Text style={styles.title}>Sono Mizzi, il geco della serata.</Text>
        <Text style={styles.copy}>
          Ti leggo la Sicilia in tempo reale: dove c'e folla, dove ci sono amici e dove conviene muoversi prima che la notte scappi via.
        </Text>
      </View>

      <View style={styles.pulseGrid}>
        <StatPill value={`${places.reduce((sum, place) => sum + place.totalCount, 0)}`} label="persone tracciate" />
        <StatPill value={`${provinceCount}`} label="province attive" />
        <StatPill value={`${wildCount}`} label="posti wild" />
      </View>

      {hottest ? (
        <View style={styles.recommendation}>
          <Text style={styles.sectionKicker}>Consiglio di Mizzi</Text>
          <Text style={styles.recommendTitle}>Parti da {hottest.name}</Text>
          <Text style={styles.recommendCopy}>
            Ora e il punto piu caldo: {hottest.totalCount} persone, {hottest.city} / {hottest.province}. Se vuoi folla vera, parti da qui.
          </Text>
          <TouchableOpacity onPress={() => onOpenPlace(hottest.id)} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryText}>Apri il posto caldo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.routeCard}>
        <Text style={styles.sectionKicker}>Rotta stasera</Text>
        {topPlaces.map((place, index) => (
          <TouchableOpacity key={place.id} onPress={() => onOpenPlace(place.id)} style={styles.routeStep} accessibilityRole="button">
            <Text style={styles.routeIndex}>{index + 1}</Text>
            <View style={styles.routeTextBlock}>
              <Text style={styles.routeName}>{place.name}</Text>
              <Text style={styles.routeMeta}>{place.city} / {place.province} / {place.totalCount} ci sono</Text>
            </View>
            <View style={[styles.routeSignal, { backgroundColor: place.heroColor }]} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.rulesCard}>
        <Text style={styles.sectionKicker}>Promessa del geco</Text>
        <Text style={styles.rule}>Conteggio pubblico, identita protette.</Text>
        <Text style={styles.rule}>Avatar solo tra amici accettati.</Text>
        <Text style={styles.rule}>Una presenza attiva per serata, puoi spostarla.</Text>
      </View>

      <TouchableOpacity onPress={onBackToDiscover} style={styles.secondaryButton} accessibilityRole="button">
        <Text style={styles.secondaryText}>Torna alla lista calda</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingBottom: 34,
  },
  heroCard: {
    backgroundColor: 'rgba(238, 241, 231, 0.93)',
    borderRadius: 38,
    minHeight: 500,
    overflow: 'hidden',
    padding: 24,
  },
  orbitOne: {
    backgroundColor: 'rgba(255, 122, 26, 0.24)',
    borderRadius: 160,
    height: 320,
    position: 'absolute',
    right: -120,
    top: -70,
    width: 320,
  },
  orbitTwo: {
    backgroundColor: 'rgba(97, 208, 149, 0.28)',
    borderRadius: 140,
    bottom: -100,
    height: 280,
    left: -100,
    position: 'absolute',
    width: 280,
  },
  mascotShell: {
    alignSelf: 'center',
    height: 220,
    marginBottom: 12,
    marginTop: 10,
    width: 220,
  },
  geckoHead: {
    alignItems: 'center',
    backgroundColor: colors.acid,
    borderColor: colors.ink,
    borderRadius: 58,
    borderWidth: 5,
    height: 112,
    justifyContent: 'center',
    left: 48,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '-8deg' }],
    width: 124,
    zIndex: 3,
  },
  geckoBody: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderColor: colors.ink,
    borderRadius: 54,
    borderWidth: 5,
    height: 116,
    justifyContent: 'center',
    left: 56,
    position: 'absolute',
    top: 95,
    transform: [{ rotate: '7deg' }],
    width: 106,
    zIndex: 2,
  },
  belly: {
    backgroundColor: 'rgba(238, 241, 231, 0.72)',
    borderRadius: 28,
    height: 62,
    width: 50,
  },
  eye: {
    backgroundColor: colors.ink,
    borderRadius: 12,
    height: 24,
    position: 'absolute',
    top: 35,
    width: 24,
  },
  eyeLeft: { left: 31 },
  eyeRight: { right: 31 },
  smile: {
    borderBottomColor: colors.ink,
    borderBottomWidth: 4,
    borderRadius: 20,
    height: 24,
    marginTop: 28,
    width: 44,
  },
  leg: {
    backgroundColor: colors.acid,
    borderColor: colors.ink,
    borderRadius: 18,
    borderWidth: 4,
    height: 38,
    position: 'absolute',
    width: 54,
    zIndex: 1,
  },
  legOne: { left: 24, top: 112, transform: [{ rotate: '-24deg' }] },
  legTwo: { right: 25, top: 113, transform: [{ rotate: '25deg' }] },
  legThree: { left: 34, top: 173, transform: [{ rotate: '23deg' }] },
  legFour: { right: 36, top: 174, transform: [{ rotate: '-20deg' }] },
  tail: {
    backgroundColor: colors.flame,
    borderColor: colors.ink,
    borderRadius: 44,
    borderWidth: 5,
    height: 48,
    position: 'absolute',
    right: 2,
    top: 157,
    transform: [{ rotate: '33deg' }],
    width: 92,
    zIndex: 0,
  },
  kicker: {
    color: colors.flame,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -1.4,
    lineHeight: 47,
    marginTop: 8,
    textAlign: 'center',
  },
  copy: {
    color: '#4b5545',
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  pulseGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    backgroundColor: colors.panel,
    borderColor: 'rgba(238, 241, 231, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  statValue: {
    color: colors.acid,
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 31,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  recommendation: {
    backgroundColor: colors.acid,
    borderRadius: 30,
    padding: 18,
  },
  sectionKicker: {
    color: colors.flame,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  recommendTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 35,
    marginTop: 6,
  },
  recommendCopy: {
    color: '#39411f',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 18,
    marginTop: 14,
    padding: 14,
  },
  primaryText: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 21,
  },
  routeCard: {
    backgroundColor: 'rgba(32, 40, 51, 0.94)',
    borderRadius: 30,
    gap: 10,
    padding: 18,
  },
  routeStep: {
    alignItems: 'center',
    backgroundColor: 'rgba(238, 241, 231, 0.08)',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 12,
    padding: 13,
  },
  routeIndex: {
    color: colors.acid,
    fontFamily: fonts.display,
    fontSize: 30,
    width: 28,
  },
  routeTextBlock: {
    flex: 1,
  },
  routeName: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  routeMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  routeSignal: {
    borderRadius: 999,
    height: 28,
    width: 28,
  },
  rulesCard: {
    backgroundColor: 'rgba(32, 40, 51, 0.94)',
    borderColor: 'rgba(238, 241, 231, 0.10)',
    borderRadius: 30,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  rule: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(238, 241, 231, 0.10)',
    borderRadius: 22,
    padding: 16,
  },
  secondaryText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
