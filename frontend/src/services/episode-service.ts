import { isMockMode } from "@/lib/config";
import type { EpisodeDetail, EpisodeListItem } from "@/types/api";
import { apiFetch, ENDPOINTS } from "./api";
import { mockGetEpisodeById, mockGetEpisodes } from "./mock-handlers";

export function getEpisodes(): Promise<EpisodeListItem[]> {
  return isMockMode ? mockGetEpisodes() : apiFetch(ENDPOINTS.episodes());
}

export function getEpisodeById(episodeId: string): Promise<EpisodeDetail> {
  return isMockMode ? mockGetEpisodeById(episodeId) : apiFetch(ENDPOINTS.episode(episodeId));
}
