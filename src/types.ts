export type UserRole = 'user' | 'admin';
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type ReportStatus = 'open' | 'reviewed' | 'resolved';
export type Surface = 'discover' | 'friends' | 'admin';
export type DiscoveryMode = 'list' | 'map';
export type AuthMode = 'otp' | 'demo';
export type DataSource = 'supabase' | 'mock';
export type SyncStatus = 'idle' | 'syncing' | 'error';
export type MotionPreference = 'full' | 'reduced';
export type FontPreset = 'editorial' | 'legacy';

export type Profile = {
  id: string;
  nickname: string;
  displayName: string;
  avatarColor: string;
  avatarUrl?: string;
  ageConfirmed: boolean;
  role: UserRole;
  friendCode: string;
};

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
};

export type Block = {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

export type Place = {
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
  heroColor: string;
  vibeTags: string[];
  imageUrl?: string;
  imageCredit?: string;
  sourceUrl?: string;
  popularityScore?: number;
  isActive: boolean;
};

export type NightlyPresence = {
  id: string;
  userId: string;
  placeId: string;
  nightKey: string;
  createdAt: string;
  updatedAt: string;
};

export type Report = {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  placeId?: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
};

export type VisibleAvatar = Pick<Profile, 'id' | 'nickname' | 'displayName' | 'avatarColor' | 'avatarUrl'>;

export type PlaceWithPresence = Place & {
  totalCount: number;
  friendCount: number;
  visibleAvatars: VisibleAvatar[];
  isUserHere: boolean;
  heatLevel: 'quiet' | 'warming' | 'hot' | 'wild';
  distanceKm?: number;
};

export type PlaceMedia = {
  uri?: string;
  credit: string;
  sourceUrl?: string;
  fallbackAsset: 'icon' | 'splash';
  brand: {
    name: string;
    category: string;
    heroColor: string;
  };
};

export type PlaceViewModel = PlaceWithPresence & {
  media: PlaceMedia;
};

export type PlaceFilters = {
  query: string;
  city: string;
  province: string;
  region: string;
  country: string;
};

export type AdminPlaceDraft = {
  name: string;
  category: string;
  city: string;
  province: string;
  region: string;
  country: string;
  latitude: string;
  longitude: string;
  description: string;
};

export type AppErrorState = {
  scope: 'auth' | 'discover' | 'presence' | 'friends' | 'admin' | 'network';
  message: string;
} | null;
