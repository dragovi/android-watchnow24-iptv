/**
 * Custom Types for WATCHNOW24 IPTV Platform
 */

export type AppTheme = "obsidian-dark" | "crimson-burgundy" | "royal-gold";

export interface AccountInfo {
  username: string;
  serverUrl: string;
  status: "Active" | "Expired" | "Trial";
  expiryDate: string;
  maxConnections: number;
  activeConnections: number;
}

export interface IptvChannel {
  id: string;
  name: string;
  logo: string;
  url: string;
  group: string; // Category Group
  number?: string;
  epgId?: string;
  streamType: "live" | "movie" | "series";
  // VOD / Series metadata
  year?: string;
  rating?: string;
  duration?: string;
  director?: string;
  cast?: string;
  description?: string;
  backdrop?: string;
  seasons?: Season[];
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  url: string;
  logo?: string;
  duration?: string;
  episodeNumber: number;
  description?: string;
}

export interface EpgProgram {
  channelId: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  category?: string;
}

export interface SpeedTestResult {
  downloadSpeed: number; // in Mbps
  uploadSpeed: number; // in Mbps
  ping: number; // in ms
  jitter: number; // in ms
  phase: "idle" | "pinging" | "downloading" | "uploading" | "finished";
  progress: number; // 0 to 100
}

export interface VpnNode {
  id: string;
  country: string;
  city: string;
  flag: string;
  ip: string;
  ping: number;
  load: number; // % loads
  premium: boolean;
}

export interface ParentalControlConfig {
  isEnabled: boolean;
  pinCode: string;
  blockedCategories: string[];
}

export interface PlayerPreferences {
  bufferSizeMs: number; // e.g. 5000ms
  autoReconnect: boolean;
  hardwareAcceleration: boolean;
  externalPlayer: boolean;
  subtitleSize: number; // px
  preferredProtocol?: "m3u8" | "ts" | "rtmp";
  primaryDns?: string;
  language?: "fr" | "en" | "es";
}
