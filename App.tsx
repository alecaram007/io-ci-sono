import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AdminPanel } from './src/components/AdminPanel';
import { AppHeader } from './src/components/AppHeader';
import { AuthPanel } from './src/components/AuthPanel';
import { BottomTabBar } from './src/components/BottomTabBar';
import { EmptyState } from './src/components/EmptyState';
import { FilterBar } from './src/components/FilterBar';
import { FriendsPanel } from './src/components/FriendsPanel';
import { HotMap } from './src/components/HotMap';
import { ModeSwitch } from './src/components/ModeSwitch';
import { NowPlayingDeck } from './src/components/NowPlayingDeck';
import { PlaceDetailSheet } from './src/components/PlaceDetailSheet';
import {
  blocks as mockBlocks,
  createMockPresences,
  currentUser as mockCurrentUser,
  friendships as mockFriendships,
  places as mockPlaces,
  profiles as mockProfiles,
  reports as mockReports,
} from './src/data/mock';
import { getNightKeyForPlace } from './src/domain/night';
import { setPresence } from './src/domain/presence';
import { useGeoPreference } from './src/hooks/useGeoPreference';
import { useMotionPreference } from './src/hooks/useMotionPreference';
import { useNightClock } from './src/hooks/useNightClock';
import { usePersistentState } from './src/hooks/usePersistentState';
import { createAppRepositories } from './src/repository/createAppRepository';
import type { AppRepository } from './src/repository/types';
import { applyOptimisticPresence } from './src/services/optimisticPresence';
import { distinctValues, projectPlacesWithPresence } from './src/services/placeProjection';
import { colors, fontPresets, fonts, tints } from './src/theme';
import type {
  AdminPlaceDraft,
  AppErrorState,
  AuthMode,
  DataSource,
  DiscoveryMode,
  FontPreset,
  MotionPreference,
  Place,
  PlaceFilters,
  PlaceWithPresence,
  Profile,
  Surface,
  SyncStatus,
} from './src/types';

const initialFilters: PlaceFilters = {
  query: '',
  city: '',
  province: '',
  region: '',
  country: '',
};

export default function App() {
  const repositories = useMemo(() => createAppRepositories(), []);
  const activeRepository = useRef<AppRepository>(repositories.mock);
  const motionPreference = useMotionPreference();
  const { nightKey, tonightLabel } = useNightClock('Europe/Rome');
  const geo = useGeoPreference();

  const [loggedIn, setLoggedIn] = useState(false);
  const [surface, setSurface] = useState<Surface>('discover');
  const [mode, setMode] = useState<DiscoveryMode>('list');
  const [fontPreset, setFontPreset] = usePersistentState<FontPreset>('fontPreset', 'editorial');
  const [authMode, setAuthMode] = useState<AuthMode>('demo');
  const [dataSource, setDataSource] = useState<DataSource>('mock');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [errorState, setErrorState] = useState<AppErrorState>(null);
  const [isIncognito, setIsIncognito] = usePersistentState('isIncognito', false);

  const [filters, setFilters] = usePersistentState<PlaceFilters>('filters', initialFilters);
  const [currentUser, setCurrentUser] = useState<Profile>(mockCurrentUser);
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
  const [placeList, setPlaceList] = useState<Place[]>(mockPlaces);
  const [friendshipList, setFriendshipList] = useState(mockFriendships);
  const [blockList, setBlockList] = useState(mockBlocks);
  const [reportList, setReportList] = useState(mockReports);
  const [presenceList, setPresenceList] = useState(() => createMockPresences(nightKey, mockPlaces));
  const [discoverPlaces, setDiscoverPlaces] = useState<PlaceWithPresence[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const glow = useSharedValue(0.2);

  useEffect(() => {
    if (motionPreference === 'reduced') {
      glow.value = withTiming(0.2, { duration: 400 });
      return;
    }

    glow.value = withRepeat(
      withTiming(1, {
        duration: 4800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [glow, motionPreference]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + glow.value * 0.2,
    transform: [{ scale: 0.88 + glow.value * 0.22 }],
  }));

  const projectLocalDiscover = useCallback(
    (inputFilters: PlaceFilters) => {
      const projected = projectPlacesWithPresence({
        places: placeList,
        profiles,
        friendships: friendshipList,
        blocks: blockList,
        presences: presenceList,
        viewerId: currentUser.id,
        nightKey,
        filters: inputFilters,
        coords: geo.coords,
      });

      setDiscoverPlaces(projected);
    },
    [blockList, currentUser.id, friendshipList, geo.coords, nightKey, placeList, presenceList, profiles],
  );

  const refreshDiscover = useCallback(
    async (inputFilters: PlaceFilters) => {
      setSyncStatus('syncing');
      setErrorState(null);

      if (dataSource === 'supabase' && repositories.supabase) {
        const remoteResult = await repositories.supabase.fetchDiscover(inputFilters, nightKey);
        if (remoteResult.ok) {
          setDiscoverPlaces(remoteResult.data);
          setSyncStatus('idle');
          return;
        }

        setErrorState({ scope: 'discover', message: remoteResult.message });
      }

      projectLocalDiscover(inputFilters);
      setSyncStatus('idle');
    },
    [dataSource, nightKey, projectLocalDiscover, repositories.supabase],
  );

  const loadRepositoryState = useCallback(
    async (repository: AppRepository) => {
      setSyncStatus('syncing');
      const result = await repository.bootstrap(nightKey);

      if (!result.ok) {
        setSyncStatus('error');
        setErrorState({ scope: 'network', message: result.message });
        return false;
      }

      const data = result.data;
      setCurrentUser(data.currentUser);
      setProfiles(data.profiles);
      setFriendshipList(data.friendships);
      setBlockList(data.blocks);
      setReportList(data.reports);
      setPlaceList(data.places);
      setPresenceList(data.presences);
      setSyncStatus('idle');
      return true;
    },
    [nightKey],
  );

  useEffect(() => {
    if (!loggedIn) return;
    void refreshDiscover(filters);
  }, [filters, loggedIn, nightKey, refreshDiscover]);

  useEffect(() => {
    if (!loggedIn || dataSource !== 'mock') return;
    setPresenceList(createMockPresences(nightKey, placeList));
  }, [dataSource, loggedIn, nightKey, placeList]);

  useEffect(() => {
    if (surface === 'admin' && currentUser.role !== 'admin') {
      setSurface('discover');
    }
  }, [currentUser.role, surface]);

  const requestOtp = async (phone: string) => {
    if (!repositories.supabase) {
      return { ok: false, message: 'Backend non configurato: usa demo locale.' };
    }
    const result = await repositories.supabase.sendPhoneOtp(phone);
    return { ok: result.ok, message: result.message };
  };

  const verifyOtp = async (phone: string, token: string) => {
    if (!repositories.supabase) {
      return { ok: false, message: 'Backend non configurato: usa demo locale.' };
    }

    const result = await repositories.supabase.verifyPhoneOtp(phone, token);
    return { ok: result.ok, message: result.message };
  };

  const enterDemo = async () => {
    activeRepository.current = repositories.mock;
    setAuthMode('demo');
    setDataSource('mock');
    const ok = await loadRepositoryState(repositories.mock);
    if (!ok) {
      return;
    }

    setLoggedIn(true);
    setSurface('discover');
    setSelectedPlaceId(null);
  };

  const enterOtp = async () => {
    if (!repositories.supabase) {
      setErrorState({ scope: 'auth', message: 'OTP non disponibile: backend non configurato.' });
      return;
    }

    activeRepository.current = repositories.supabase;
    setAuthMode('otp');
    setDataSource('supabase');

    const ok = await loadRepositoryState(repositories.supabase);
    if (!ok) {
      activeRepository.current = repositories.mock;
      setDataSource('mock');
      setAuthMode('demo');
      return;
    }

    setLoggedIn(true);
    setSurface('discover');
    setSelectedPlaceId(null);
  };

  const setPresenceForPlace = async (placeId: string) => {
    const place = placeList.find((item) => item.id === placeId);
    if (!place) return;

    if (dataSource === 'mock') {
      const placeNightKey = getNightKeyForPlace(place);
      setPresenceList((current) =>
        setPresence({ presences: current, userId: currentUser.id, placeId, nightKey: placeNightKey, isIncognito }),
      );
      setDiscoverPlaces((current) => applyOptimisticPresence(current, placeId));
      void Haptics.selectionAsync();
      return;
    }

    const snapshot = [...discoverPlaces];
    setDiscoverPlaces((current) => applyOptimisticPresence(current, placeId));
    const result = await activeRepository.current.setPresence(placeId);

    if (!result.ok) {
      setDiscoverPlaces(snapshot);
      setErrorState({ scope: 'presence', message: result.message });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await refreshDiscover(filters);
  };

  const createPlace = async (draft: AdminPlaceDraft) => {
    const created = await activeRepository.current.createPlace(draft);
    if (!created.ok) {
      Alert.alert('Creazione non riuscita', created.message);
      return;
    }

    setPlaceList((current) => [created.data, ...current]);
    setSurface('discover');
    setSelectedPlaceId(created.data.id);
    await refreshDiscover(filters);
  };

  const togglePlace = async (placeId: string) => {
    const target = placeList.find((place) => place.id === placeId);
    if (!target) return;

    const nextActive = !target.isActive;
    const toggleResult = await activeRepository.current.togglePlace(placeId, nextActive);
    if (!toggleResult.ok) {
      Alert.alert('Aggiornamento non riuscito', toggleResult.message);
      return;
    }

    setPlaceList((current) => current.map((place) => (place.id === placeId ? { ...place, isActive: nextActive } : place)));
    await refreshDiscover(filters);
  };

  const acceptRequest = async (friendshipId: string) => {
    const result = await activeRepository.current.acceptFriendRequest(friendshipId);
    if (!result.ok) {
      setErrorState({ scope: 'friends', message: result.message });
      return;
    }

    setFriendshipList((current) =>
      current.map((friendship) => (friendship.id === friendshipId ? { ...friendship, status: 'accepted' } : friendship)),
    );
  };

  const selectedPlace = selectedPlaceId ? discoverPlaces.find((place) => place.id === selectedPlaceId) ?? null : null;
  const totalTonight = discoverPlaces.reduce((sum, place) => sum + place.totalCount, 0);
  const filterOptions = useMemo(
    () => ({
      provinces: distinctValues(placeList, 'province'),
    }),
    [placeList],
  );

  if (!loggedIn) {
    return (
      <AuthPanel
        onDemoLogin={enterDemo}
        onOtpLogin={enterOtp}
        onRequestOtp={requestOtp}
        onVerifyOtp={verifyOtp}
        otpEnabled={Boolean(repositories.supabase?.otpEnabled)}
      />
    );
  }

  const motion: MotionPreference = motionPreference;
  const titleFont = fontPreset === 'legacy' ? fontPresets.legacy.display : fontPresets.editorial.display;

  return (
    <LinearGradient colors={[colors.ink, '#0E1115', '#06080A']} style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
          <Animated.View style={[styles.glowOne, glowStyle]} pointerEvents="none" />
          <Animated.View style={[styles.glowTwo, glowStyle]} pointerEvents="none" />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={motion === 'full' ? FadeInUp.duration(450) : undefined}>
              <AppHeader
                surface={surface}
                authMode={authMode}
                dataSource={dataSource}
                fontPreset={fontPreset}
                titleFont={titleFont}
                currentUser={currentUser}
                isIncognito={isIncognito}
                onToggleFont={() => setFontPreset((current) => (current === 'editorial' ? 'legacy' : 'editorial'))}
                onToggleIncognito={() => {
                  setIsIncognito((current) => !current);
                  void Haptics.selectionAsync();
                }}
              />
            </Animated.View>

            {errorState ? (
              <View style={styles.bannerError} accessibilityLiveRegion="polite" accessibilityRole="alert">
                <Text style={styles.bannerErrorText}>{errorState.message}</Text>
              </View>
            ) : null}

            {syncStatus === 'syncing' ? (
              <View style={styles.bannerSync} accessibilityLiveRegion="polite">
                <Text style={styles.bannerSyncText}>Aggiornamento in corso...</Text>
              </View>
            ) : null}

            {surface === 'discover' ? (
              <View style={styles.sectionStack}>
                <Animated.View entering={motion === 'full' ? FadeInDown.delay(60).duration(420) : undefined}>
                  <ModeSwitch mode={mode} onChange={setMode} />
                </Animated.View>

                <Animated.View entering={motion === 'full' ? FadeInDown.delay(90).duration(420) : undefined}>
                  <FilterBar
                    filters={filters}
                    provinces={filterOptions.provinces}
                    geoStatus={geo.status}
                    onChange={setFilters}
                    onRequestLocation={() => void geo.request()}
                    onClearLocation={geo.decline}
                  />
                </Animated.View>

                {discoverPlaces.length === 0 ? (
                  <EmptyState />
                ) : mode === 'map' ? (
                  <Animated.View entering={motion === 'full' ? FadeInDown.delay(120).duration(420) : undefined}>
                    <HotMap places={discoverPlaces} onSelect={(target) => setSelectedPlaceId(target.id)} />
                  </Animated.View>
                ) : (
                  <Animated.View entering={motion === 'full' ? FadeInDown.delay(120).duration(420) : undefined}>
                    <NowPlayingDeck
                      places={discoverPlaces}
                      totalTonight={totalTonight}
                      tonightLabel={tonightLabel}
                      onSetPresence={setPresenceForPlace}
                      onOpenDetail={setSelectedPlaceId}
                    />
                  </Animated.View>
                )}
              </View>
            ) : null}

            {surface === 'friends' ? (
              <Animated.View entering={motion === 'full' ? FadeInDown.duration(320) : undefined}>
                <FriendsPanel
                  currentUser={currentUser}
                  profiles={profiles}
                  friendships={friendshipList}
                  onAcceptRequest={acceptRequest}
                />
              </Animated.View>
            ) : null}

            {surface === 'admin' && currentUser.role === 'admin' ? (
              <Animated.View entering={motion === 'full' ? FadeInDown.duration(320) : undefined}>
                <AdminPanel
                  places={placeList}
                  reports={reportList}
                  onCreatePlace={createPlace}
                  onTogglePlace={togglePlace}
                />
              </Animated.View>
            ) : null}
          </ScrollView>

          <BottomTabBar
            surface={surface}
            isAdmin={currentUser.role === 'admin'}
            onChange={setSurface}
          />

          <PlaceDetailSheet
            visible={Boolean(selectedPlace)}
            place={selectedPlace}
            onClose={() => setSelectedPlaceId(null)}
            onSetPresence={setPresenceForPlace}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  glowOne: {
    backgroundColor: tints.gold(0.08),
    borderRadius: 200,
    height: 360,
    position: 'absolute',
    right: -160,
    top: 80,
    width: 360,
  },
  glowTwo: {
    backgroundColor: tints.copper(0.06),
    borderRadius: 160,
    bottom: 80,
    height: 300,
    left: -160,
    position: 'absolute',
    width: 300,
  },
  content: {
    padding: 18,
    paddingBottom: 160, // spazio per il BottomTabBar fisso + safe area
  },
  bannerError: {
    backgroundColor: tints.danger(0.18),
    borderColor: tints.danger(0.55),
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  bannerErrorText: {
    color: '#E8C4B8',
    fontFamily: fonts.body,
    fontSize: 12,
  },
  bannerSync: {
    backgroundColor: tints.gold(0.10),
    borderRadius: 16,
    marginBottom: 12,
    padding: 10,
  },
  bannerSyncText: {
    color: colors.acid,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  sectionStack: {
    gap: 14,
  },
});
