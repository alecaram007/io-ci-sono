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
} from '../types';

export type RepositoryResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string };

export type BootstrapPayload = {
  currentUser: Profile;
  profiles: Profile[];
  friendships: Friendship[];
  blocks: Block[];
  reports: Report[];
  places: Place[];
  presences: NightlyPresence[];
};

export interface AppRepository {
  readonly kind: 'mock' | 'supabase';
  readonly otpEnabled: boolean;
  sendPhoneOtp(phone: string): Promise<RepositoryResult>;
  verifyPhoneOtp(phone: string, token: string): Promise<RepositoryResult>;
  bootstrap(nightKey: string): Promise<RepositoryResult<BootstrapPayload>>;
  fetchDiscover(filters: PlaceFilters, nightKey: string): Promise<RepositoryResult<PlaceWithPresence[]>>;
  setPresence(placeId: string): Promise<RepositoryResult>;
  acceptFriendRequest(friendshipId: string): Promise<RepositoryResult>;
  createPlace(draft: AdminPlaceDraft): Promise<RepositoryResult<Place>>;
  togglePlace(placeId: string, isActive: boolean): Promise<RepositoryResult>;
}
