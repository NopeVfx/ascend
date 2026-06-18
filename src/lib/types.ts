export type Theme = "light" | "dark";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  theme: Theme;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface FeatureScore {
  feature: string;
  score: number; // 0 - 10
  note: string;
}

export interface AnalysisResult {
  psl: number; // 0 - 10, one decimal
  verdict: string;
  features: FeatureScore[];
  strengths: string[];
  ascension: string[];
  tier: "premium" | "standard";
  model: string;
}

export const FRIEND_REQUEST_PENDING: FriendshipStatus = "pending";
