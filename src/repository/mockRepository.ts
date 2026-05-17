import { blocks, createMockPresences, currentUser, friendships, places, profiles, reports } from '../data/mock';
import { projectPlacesWithPresence } from '../services/placeProjection';
import type { AppRepository, BootstrapPayload, RepositoryResult } from './types';
import type { AdminPlaceDraft, Friendship, Place, PlaceFilters, Report } from '../types';

type MockState = {
  places: Place[];
  friendships: Friendship[];
  reports: Report[];
};

function createInitialState(): MockState {
  return {
    places: places.map((place) => ({ ...place })),
    friendships: friendships.map((friendship) => ({ ...friendship })),
    reports: reports.map((report) => ({ ...report })),
  };
}

export function createMockRepository(): AppRepository {
  const state = createInitialState();

  const bootstrap = async (nightKey: string): Promise<RepositoryResult<BootstrapPayload>> => ({
    ok: true,
    data: {
      currentUser,
      profiles,
      friendships: state.friendships,
      blocks,
      reports: state.reports,
      places: state.places,
      presences: createMockPresences(nightKey, state.places),
    },
  });

  return {
    kind: 'mock',
    otpEnabled: false,
    async sendPhoneOtp() {
      return { ok: false, message: 'Backend non configurato: usa demo locale.' };
    },
    async verifyPhoneOtp() {
      return { ok: false, message: 'Backend non configurato: usa demo locale.' };
    },
    bootstrap,
    async fetchDiscover(filters: PlaceFilters, nightKey: string) {
      const projected = projectPlacesWithPresence({
        places: state.places,
        profiles,
        friendships: state.friendships,
        blocks,
        presences: createMockPresences(nightKey, state.places),
        viewerId: currentUser.id,
        nightKey,
        filters,
      });

      return { ok: true, data: projected };
    },
    async setPresence() {
      return { ok: true, data: undefined, message: 'Presenza demo aggiornata.' };
    },
    async acceptFriendRequest(friendshipId: string) {
      state.friendships = state.friendships.map((friendship) =>
        friendship.id === friendshipId ? { ...friendship, status: 'accepted' } : friendship,
      );
      return { ok: true, data: undefined };
    },
    async createPlace(draft: AdminPlaceDraft) {
      const latitude = Number(draft.latitude);
      const longitude = Number(draft.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return { ok: false, message: 'Coordinate non valide.' };
      }

      const created: Place = {
        id: `place-${Date.now()}`,
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
        heroColor: '#F77B35',
        vibeTags: ['new', 'admin pick'],
        isActive: true,
      };

      state.places = [created, ...state.places];
      return { ok: true, data: created };
    },
    async togglePlace(placeId: string, isActive: boolean) {
      state.places = state.places.map((place) => (place.id === placeId ? { ...place, isActive } : place));
      return { ok: true, data: undefined };
    },
  };
}
