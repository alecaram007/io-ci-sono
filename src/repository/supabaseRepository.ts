import { currentUser as mockCurrentUser } from '../data/mock';
import { supabase } from '../lib/supabase';
import type { AppRepository, BootstrapPayload, RepositoryResult } from './types';
import type {
  AdminPlaceDraft,
  Block,
  Friendship,
  NightlyPresence,
  Place,
  PlaceFilters,
  PlaceWithPresence,
  Profile,
  Report,
  VisibleAvatar,
} from '../types';

type ProfileRow = {
  id: string;
  nickname: string;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string;
  age_confirmed: boolean;
  role: 'user' | 'admin';
  friend_code: string;
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
};

type BlockRow = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  city: string;
  province: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  hero_color: string;
  vibe_tags: string[];
  image_url: string | null;
  image_credit: string | null;
  source_url: string | null;
  popularity_score: number;
  is_active: boolean;
};

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  place_id: string | null;
  reason: string;
  status: 'open' | 'reviewed' | 'resolved';
  created_at: string;
};

type NightlyPresenceRow = {
  id: string;
  user_id: string;
  place_id: string;
  night_key: string;
  created_at: string;
  updated_at: string;
};

type RemotePlaceRow = {
  id: string;
  name: string;
  category: string;
  description: string;
  city: string;
  province: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  hero_color: string;
  vibe_tags: string[];
  image_url: string | null;
  image_credit: string | null;
  source_url: string | null;
  popularity_score: number;
  total_count: number | string;
  heat_level: 'quiet' | 'warming' | 'hot' | 'wild';
  is_user_here: boolean;
  friend_count: number | string;
  visible_avatars: unknown;
};

const pickMessage = (message: string) => message || 'Errore di rete.';

async function ensureProfile(userId: string): Promise<RepositoryResult<Profile>> {
  if (!supabase) return { ok: false, message: 'Backend non configurato.' };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, display_name, avatar_url, avatar_color, age_confirmed, role, friend_code')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { ok: false, message: pickMessage(error.message) };
  if (data) return { ok: true, data: mapProfile(data) };

  const fallback = {
    id: userId,
    nickname: `${mockCurrentUser.nickname}-${userId.slice(0, 4)}`.slice(0, 24),
    display_name: mockCurrentUser.displayName,
    avatar_url: null,
    avatar_color: mockCurrentUser.avatarColor,
    age_confirmed: true,
    role: 'user' as const,
    friend_code: `${userId.slice(0, 4).toUpperCase()}-${userId.slice(-4).toUpperCase()}`,
  };

  const inserted = await supabase.from('profiles').insert(fallback).select('id, nickname, display_name, avatar_url, avatar_color, age_confirmed, role, friend_code').single();
  if (inserted.error) return { ok: false, message: pickMessage(inserted.error.message) };
  return { ok: true, data: mapProfile(inserted.data) };
}

export function createSupabaseRepository(): AppRepository {
  return {
    kind: 'supabase',
    otpEnabled: Boolean(supabase),
    async sendPhoneOtp(phone: string) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return { ok: false, message: pickMessage(error.message) };
      return { ok: true, data: undefined, message: 'Codice OTP inviato.' };
    },
    async verifyPhoneOtp(phone: string, token: string) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) return { ok: false, message: pickMessage(error.message) };
      return { ok: true, data: undefined, message: 'Accesso completato.' };
    },
    async bootstrap(nightKey: string) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        return { ok: false, message: pickMessage(authError?.message ?? 'Sessione non trovata.') };
      }

      const profileResult = await ensureProfile(authData.user.id);
      if (!profileResult.ok) return profileResult;

      const [profilesRes, friendshipsRes, blocksRes, reportsRes, placesRes, myPresencesRes] = await Promise.all([
        supabase.from('profiles').select('id, nickname, display_name, avatar_url, avatar_color, age_confirmed, role, friend_code'),
        supabase.from('friendships').select('id, requester_id, addressee_id, status, created_at'),
        supabase.from('blocks').select('id, blocker_id, blocked_id, created_at'),
        supabase.from('reports').select('id, reporter_id, reported_user_id, place_id, reason, status, created_at').order('created_at', { ascending: false }),
        supabase.from('places').select('id, name, category, description, city, province, region, country, latitude, longitude, timezone, hero_color, vibe_tags, image_url, image_credit, source_url, popularity_score, is_active').order('name'),
        supabase.from('nightly_presences').select('id, user_id, place_id, night_key, created_at, updated_at'),
      ]);

      if (profilesRes.error) return { ok: false, message: pickMessage(profilesRes.error.message) };
      if (friendshipsRes.error) return { ok: false, message: pickMessage(friendshipsRes.error.message) };
      if (blocksRes.error) return { ok: false, message: pickMessage(blocksRes.error.message) };
      if (reportsRes.error) return { ok: false, message: pickMessage(reportsRes.error.message) };
      if (placesRes.error) return { ok: false, message: pickMessage(placesRes.error.message) };
      if (myPresencesRes.error) return { ok: false, message: pickMessage(myPresencesRes.error.message) };

      const payload: BootstrapPayload = {
        currentUser: profileResult.data,
        profiles: (profilesRes.data ?? []).map((row) => mapProfile(row as ProfileRow)),
        friendships: (friendshipsRes.data ?? []).map((row) => mapFriendship(row as FriendshipRow)),
        blocks: (blocksRes.data ?? []).map((row) => mapBlock(row as BlockRow)),
        reports: (reportsRes.data ?? []).map((row) => mapReport(row as ReportRow)),
        places: (placesRes.data ?? []).map((row) => mapPlace(row as PlaceRow)),
        presences: (myPresencesRes.data ?? []).map((row) => mapPresence(row as NightlyPresenceRow)),
      };

      payload.presences = payload.presences.filter((presence) => presence.nightKey === nightKey);

      return { ok: true, data: payload };
    },
    async fetchDiscover(filters: PlaceFilters) {
      const client = supabase;
      if (!client) return { ok: false, message: 'Backend non configurato: usa demo locale.' };

      const { data, error } = await client.rpc('get_places', {
        p_query: filters.query || null,
        p_city: filters.city || null,
        p_province: filters.province || null,
        p_region: filters.region || null,
        p_country: filters.country || null,
      });

      if (error) return { ok: false, message: pickMessage(error.message) };

      const rows = (data ?? []) as RemotePlaceRow[];
      const places = rows.map((row) => mapPlaceWithPresence(row));

      return { ok: true, data: places };
    },
    async setPresence(placeId: string) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };
      const { error } = await supabase.rpc('set_presence', { p_place_id: placeId });
      if (error) return { ok: false, message: pickMessage(error.message) };
      return { ok: true, data: undefined, message: 'Presenza aggiornata.' };
    },
    async acceptFriendRequest(friendshipId: string) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return { ok: false, message: 'Sessione non valida.' };

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .eq('addressee_id', userId);

      if (error) return { ok: false, message: pickMessage(error.message) };
      return { ok: true, data: undefined };
    },
    async createPlace(draft: AdminPlaceDraft) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };
      const latitude = Number(draft.latitude);
      const longitude = Number(draft.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return { ok: false, message: 'Coordinate non valide.' };
      }

      const { data, error } = await supabase
        .from('places')
        .insert({
          name: draft.name.trim(),
          category: draft.category.trim() || 'Luogo',
          description: draft.description.trim(),
          city: draft.city.trim(),
          province: draft.province.trim(),
          region: draft.region.trim(),
          country: draft.country.trim(),
          latitude,
          longitude,
          timezone: 'Europe/Rome',
          hero_color: '#F77B35',
          vibe_tags: ['new', 'admin pick'],
          is_active: true,
        })
        .select('id, name, category, description, city, province, region, country, latitude, longitude, timezone, hero_color, vibe_tags, image_url, image_credit, source_url, popularity_score, is_active')
        .single();

      if (error) return { ok: false, message: pickMessage(error.message) };
      return { ok: true, data: mapPlace(data as PlaceRow) };
    },
    async togglePlace(placeId: string, isActive: boolean) {
      if (!supabase) return { ok: false, message: 'Backend non configurato: usa demo locale.' };
      const { error } = await supabase.from('places').update({ is_active: isActive }).eq('id', placeId);
      if (error) return { ok: false, message: pickMessage(error.message) };
      return { ok: true, data: undefined };
    },
  };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    nickname: row.nickname,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    avatarColor: row.avatar_color,
    ageConfirmed: row.age_confirmed,
    role: row.role,
    friendCode: row.friend_code,
  };
}

function mapFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapBlock(row: BlockRow): Block {
  return {
    id: row.id,
    blockerId: row.blocker_id,
    blockedId: row.blocked_id,
    createdAt: row.created_at,
  };
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id ?? undefined,
    placeId: row.place_id ?? undefined,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    city: row.city,
    province: row.province,
    region: row.region,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    heroColor: row.hero_color,
    vibeTags: row.vibe_tags ?? [],
    imageUrl: row.image_url ?? undefined,
    imageCredit: row.image_credit ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    popularityScore: row.popularity_score,
    isActive: row.is_active,
  };
}

function mapPresence(row: NightlyPresenceRow): NightlyPresence {
  return {
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    nightKey: row.night_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVisibleAvatars(input: unknown): VisibleAvatar[] {
  if (!Array.isArray(input)) return [];

  const avatars: VisibleAvatar[] = [];

  for (const value of input) {
    if (!value || typeof value !== 'object') continue;

    const item = value as {
      id?: unknown;
      nickname?: unknown;
      displayName?: unknown;
      avatarColor?: unknown;
      avatarUrl?: unknown;
    };

    if (typeof item.id !== 'string' || typeof item.nickname !== 'string' || typeof item.displayName !== 'string') {
      continue;
    }

    avatars.push({
      id: item.id,
      nickname: item.nickname,
      displayName: item.displayName,
      avatarColor: typeof item.avatarColor === 'string' ? item.avatarColor : '#C7FF56',
      avatarUrl: typeof item.avatarUrl === 'string' ? item.avatarUrl : undefined,
    });
  }

  return avatars;
}

function toCount(value: number | string): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapPlaceWithPresence(row: RemotePlaceRow): PlaceWithPresence {
  const visibleAvatars = mapVisibleAvatars(row.visible_avatars);
  const friendCount = Math.max(toCount(row.friend_count), visibleAvatars.length);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    city: row.city,
    province: row.province,
    region: row.region,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    heroColor: row.hero_color,
    vibeTags: row.vibe_tags ?? [],
    imageUrl: row.image_url ?? undefined,
    imageCredit: row.image_credit ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    popularityScore: row.popularity_score,
    isActive: true,
    totalCount: toCount(row.total_count),
    friendCount,
    visibleAvatars,
    isUserHere: row.is_user_here,
    heatLevel: row.heat_level,
  };
}
