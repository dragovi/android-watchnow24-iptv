/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AppTheme, AccountInfo, IptvChannel, ParentalControlConfig, PlayerPreferences, EpgProgram, Season } from "./types";
import { DEMO_ACCOUNT_INFO, DEMO_CHANNELS, DEMO_VPN_NODES } from "./data";
import Sidebar from "./components/Sidebar";
import LoginForms from "./components/LoginForms";
import IptvVideoPlayer from "./components/IptvVideoPlayer";
import SpeedTestSection from "./components/SpeedTestSection";
import VpnSection from "./components/VpnSection";
import ParentalControlModal from "./components/ParentalControlModal";
import VirtualTvRemote from "./components/VirtualTvRemote";
import AiAssistant from "./components/AiAssistant";
import { Tv, Play, Search, Heart, History, Sparkles, Sliders, Shield, AlertTriangle, Monitor, Calendar, Check, Info, Radio, Star, ChevronRight, Lock, Key } from "lucide-react";

// Configuration de l'API Base URL pour Android (Vercel)
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? ""
  : "https://android-watchnow24-iptv-obc9c4mvf-dragovics-projects-617f1d15.vercel.app";

export default function App() {
  // 1. Splash Screen countdown loader
  const [viewState, setViewState] = useState<"splash" | "onboarding" | "dashboard">("splash");
  const [splashProgress, setSplashProgress] = useState(0);

  // 2. Main app structures
  const [activeSection, setActiveSection] = useState<string>("home");
  const [playlistChannels, setPlaylistChannels] = useState<IptvChannel[]>(DEMO_CHANNELS);
  const [originalSyncType, setOriginalSyncType] = useState<"demo" | "xtream" | "m3u">("demo");
  const [credentials, setCredentials] = useState<any>(DEMO_ACCOUNT_INFO);

  // 3. User local preferences with LocalStorage synchronization
  const [favorites, setFavorites] = useState<string[]>(() => {
    const cached = localStorage.getItem("wn24_favorites");
    return cached ? JSON.parse(cached) : ["news_hq", "movies_gold"];
  });

  const [historyList, setHistoryList] = useState<string[]>(() => {
    const cached = localStorage.getItem("wn24_history");
    return cached ? JSON.parse(cached) : ["sports_pro"];
  });

  const [parentalConfig, setParentalConfig] = useState<ParentalControlConfig>(() => {
    const cached = localStorage.getItem("wn24_parental");
    return cached ? JSON.parse(cached) : { isEnabled: false, pinCode: "0000", blockedCategories: ["18+ Adult Channels"] };
  });

  const [playerPreferences, setPlayerPreferences] = useState<PlayerPreferences>(() => {
    const cached = localStorage.getItem("wn24_player_pref");
    return cached ? JSON.parse(cached) : {
      bufferSizeMs: 5000,
      autoReconnect: true,
      hardwareAcceleration: true,
      externalPlayer: false,
      subtitleSize: 14,
      preferredProtocol: "m3u8",
      primaryDns: "1.1.1.1",
      language: "fr"
    };
  });

  const [activeTheme, setActiveTheme] = useState<AppTheme>(() => {
    const cached = localStorage.getItem("wn24_theme");
    return (cached as AppTheme) || "crimson-burgundy";
  });

  // 4. Video Player active variables
  const [currentChannel, setCurrentChannel] = useState<IptvChannel | null>(DEMO_CHANNELS[0]);
  const [secondaryChannel, setSecondaryChannel] = useState<IptvChannel | null>(null);
  const [isMultiScreenActive, setIsMultiScreenActive] = useState(false);

  // 5. Virtual Controller parameters
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [selectedFocusIdx, setSelectedFocusIdx] = useState(0); // Keyboard / TV Remote index

  // 6. Security state validation
  const [parentCategoryUnlocked, setParentCategoryUnlocked] = useState<string | null>(null);
  const [requiresPinCat, setRequiresPinCat] = useState<string | null>(null);
  const [pinUnlockInput, setPinUnlockInput] = useState("");
  const [pinError, setPinError] = useState("");

  // 7. VPN status tracker
  const [vpnConnected, setVpnConnected] = useState(false);
  const [vpnNodeDetails, setVpnNodeDetails] = useState<any>(null);

  // 8. Filters & Search text fields
  const [searchText, setSearchText] = useState("");
  const [channelFilterType, setChannelFilterType] = useState<string>("All");
  const [activeVodCategory, setActiveVodCategory] = useState<string>("All");
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<IptvChannel | null>(null);

  // Cache persistence
  useEffect(() => {
    localStorage.setItem("wn24_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("wn24_history", JSON.stringify(historyList));
  }, [historyList]);

  useEffect(() => {
    localStorage.setItem("wn24_parental", JSON.stringify(parentalConfig));
  }, [parentalConfig]);

  useEffect(() => {
    localStorage.setItem("wn24_theme", activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    localStorage.setItem("wn24_player_pref", JSON.stringify(playerPreferences));
  }, [playerPreferences]);

  const [loadingEpisodesForSeries, setLoadingEpisodesForSeries] = useState<string | null>(null);

  const fetchXtreamEpisodes = async (seriesId: string, xtreamSeriesId: number) => {
    if (!credentials || !credentials.serverUrl || !credentials.username || !credentials.password) return;
    setLoadingEpisodesForSeries(seriesId);
    try {
      const episodesUrl = `${credentials.serverUrl}/player_api.php?username=${credentials.username}&password=${credentials.password}&action=get_series_info&series_id=${xtreamSeriesId}`;
      const res = await fetch(`${API_BASE_URL}/api/iptv/proxy?url=${encodeURIComponent(episodesUrl)}`);
      const details = await res.json();
      
      if (details) {
        let parsedSeasons: Season[] = [];
        
        // Xtream episodes is usually an object where keys are season numbers
        if (details.episodes) {
          Object.keys(details.episodes).forEach((seasonKey) => {
            const seasonNum = parseInt(seasonKey, 10) || 1;
            const rawEpisodes = details.episodes[seasonKey] || [];
            
            const episodesList = rawEpisodes.map((ep: any) => ({
              id: `xt_ep_real_${ep.id || ep.stream_id || Math.random()}`,
              title: ep.title || `Episode ${ep.episode_num || ep.num || ""}`,
              url: `${credentials.serverUrl}/series/${credentials.username}/${credentials.password}/${ep.id || ep.stream_id}.${ep.container_extension || "mp4"}`,
              episodeNumber: Number(ep.episode_num || ep.num || 1),
              duration: ep.info?.duration || ep.duration || "45m",
              description: ep.info?.plot || ep.plot || `Episode ${ep.episode_num || ep.num} of season ${seasonNum}.`
            }));

            parsedSeasons.push({
              seasonNumber: seasonNum,
              episodes: episodesList.sort((a, b) => a.episodeNumber - b.episodeNumber)
            });
          });
        }

        if (parsedSeasons.length > 0) {
          // Update the series episodes in our general playlist!
          setPlaylistChannels((prev) => 
            prev.map((c) => {
              if (c.id === seriesId) {
                return {
                  ...c,
                  seasons: parsedSeasons.sort((a, b) => a.seasonNumber - b.seasonNumber)
                };
              }
              return c;
            })
          );
        }
      }
    } catch (e) {
      console.error("Error loading episode metadata from Xtream API", e);
    } finally {
      setLoadingEpisodesForSeries(null);
    }
  };

  // Initial Boot loader delay (Luxury Splash effects)
  useEffect(() => {
    const interval = setInterval(() => {
      setSplashProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setViewState("onboarding");
          return 100;
        }
        return prev + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Navigation simulation mapping for Virtual remote commands
  useEffect(() => {
    const handleRemoteKeyPresses = (e: KeyboardEvent) => {
      // Direct remote focus cycle when in dashboard Live TV or Home panel
      if (viewState !== "dashboard") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedFocusIdx(prev => Math.min(prev + 1, filteredActiveChannels.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedFocusIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const highlighted = filteredActiveChannels[selectedFocusIdx];
        if (highlighted) {
          handlePlayChannel(highlighted);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setCurrentChannel(null);
      }
    };

    window.addEventListener("keydown", handleRemoteKeyPresses);
    return () => window.removeEventListener("keydown", handleRemoteKeyPresses);
  }, [viewState, selectedFocusIdx, playlistChannels, channelFilterType, searchText]);

  // Onboarding Login sync routing
  const handleAuthOnboardingSuccess = (
    parsedChannels: IptvChannel[],
    loginType: "xtream" | "m3u" | "demo",
    loginSecret?: any
  ) => {
    setOriginalSyncType(loginType);

    if (parsedChannels && parsedChannels.length > 0) {
      setPlaylistChannels(parsedChannels);
      // Auto play first channel of the imported list
      setCurrentChannel(parsedChannels[0]);
    } else {
      // Use fallback built-in premium test channels
      setPlaylistChannels(DEMO_CHANNELS);
      setCurrentChannel(DEMO_CHANNELS[0]);
    }

    if (loginSecret) {
      setCredentials({
        username: loginSecret.username || "M3U_USER_" + Math.floor(Math.random() * 1000),
        serverUrl: loginSecret.serverUrl || loginSecret.m3uUrl || "Direct Payload Connection",
        status: "Active" as const,
        expiryDate: "2027-12-31T23:59:59.000Z",
        maxConnections: 2,
        activeConnections: 1,
      });
    }

    setViewState("dashboard");
  };

  // Play controls targeting parental block validation
  const handlePlayChannel = (channel: IptvChannel) => {
    const isCategoryBlocked = parentalConfig.isEnabled && parentalConfig.blockedCategories.includes(channel.group);

    if (isCategoryBlocked && parentCategoryUnlocked !== channel.group) {
      setRequiresPinCat(channel.group);
      setPinError("");
      setPinUnlockInput("");
      return;
    }

    // Set channel
    if (isMultiScreenActive) {
      setSecondaryChannel(channel);
    } else {
      setCurrentChannel(channel);
    }

    // Log to recents
    setHistoryList(prev => {
      const filtered = prev.filter(id => id !== channel.id);
      return [channel.id, ...filtered].slice(0, 15);
    });
  };

  const verifyCategoryPin = () => {
    if (pinUnlockInput === parentalConfig.pinCode) {
      if (requiresPinCat) {
        setParentCategoryUnlocked(requiresPinCat);
        const blockedTargetChannel = playlistChannels.find(c => c.group === requiresPinCat);
        if (blockedTargetChannel) {
          if (isMultiScreenActive) setSecondaryChannel(blockedTargetChannel);
          else setCurrentChannel(blockedTargetChannel);
        }
      }
      setRequiresPinCat(null);
      setPinError("");
    } else {
      setPinError("INCORRECT SECURITY PIN");
    }
  };

  // Favorites Toggler
  const toggleFavoriteChannelState = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(elem => elem !== id) : [...prev, id]
    );
  };

  // Log backups simulation
  const triggerPlaylistBackupRestore = () => {
    alert("Configuration database backup stored in LocalStorage of the current platform browser container successfully.");
  };

  // Categories parsing list
  const channelCategories = Array.from(new Set(playlistChannels.map(c => c.group)));

  // Filter lists based on type and inputs
  const filteredActiveChannels = playlistChannels.filter(ch => {
    const matchSearch = ch.name.toLowerCase().includes(searchText.toLowerCase()) || 
                        ch.group.toLowerCase().includes(searchText.toLowerCase());

    const isLiveSection = activeSection === "live-tv" && ch.streamType === "live";
    const isMoviesSection = activeSection === "vod" && ch.streamType === "movie";
    const isSeriesSection = activeSection === "series" && ch.streamType === "series";
    const isCatchupSection = activeSection === "catchup" && ch.streamType === "live"; // Simulates replay schedule

    const currentSectionMatch = isLiveSection || isMoviesSection || isSeriesSection || isCatchupSection || activeSection === "home";
    if (!currentSectionMatch) return false;

    // Apply category specific filters
    if (activeSection === "live-tv" && channelFilterType !== "All" && ch.group !== channelFilterType) return false;
    if (activeSection === "vod" && activeVodCategory !== "All" && ch.group !== activeVodCategory) return false;

    return matchSearch;
  });

  // Get themes styling tokens
  const getThemeColorClass = () => {
    if (activeTheme === "crimson-burgundy") {
      return {
        bg: "bg-[#0A0A0A]",
        sidebar: "glass bg-black/40",
        accent: "text-[#E50914]",
        borderAccent: "border-white/5 hover:border-[#E50914]/40",
        button: "burgundy-accent hover:opacity-90 transition-all text-white burgundy-glow active:scale-95 cursor-pointer",
        gradientBg: "from-[#0A0A0A] via-black to-zinc-950"
      };
    }
    if (activeTheme === "royal-gold") {
      return {
        bg: "bg-[#080806]",
        sidebar: "bg-[#11110E]",
        accent: "text-amber-400",
        borderAccent: "border-amber-400/30",
        button: "bg-amber-600 hover:bg-amber-500 text-zinc-950",
        gradientBg: "from-amber-950/20 via-zinc-950 to-[#0A0A08]"
      };
    }
    // Obsidian Dark (Swiss Slate)
    return {
      bg: "bg-[#060709]",
      sidebar: "bg-[#0E1116]",
      accent: "text-cyan-400",
      borderAccent: "border-cyan-400/30",
      button: "bg-cyan-600 hover:bg-cyan-500 text-zinc-950",
      gradientBg: "from-cyan-950/10 via-zinc-950 to-black"
    };
  };

  const themeTokens = getThemeColorClass();

  return (
    <div className={`min-h-screen ${themeTokens.bg} text-zinc-100 font-sans antialiased flex flex-col justify-between`}>

      {/* --- A. SPLASH SCREEN PANEL --- */}
      {viewState === "splash" && (
        <div className="fixed inset-0 bg-[#070707] flex flex-col items-center justify-center z-50 p-6">
          <div className="absolute inset-0 bg-radial-gradient from-[#71091a]/20 to-transparent pointer-events-none"></div>

          {/* Luxury rotating circular satellite ring */}
          <div className="relative mb-6 animate-logo-pulse">
            <div className="w-32 h-32 rounded-full border-2 border-red-500/10 border-t-red-500 animate-spin flex items-center justify-center">
               <img src="/assets/logo.png" alt="WatchNow24 Logo" className="w-24 h-24 object-contain" />
            </div>
          </div>

          <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-[0.25em] text-white">
            WATCH<span className="text-[#e50914] drop-shadow-[0_0_10px_rgba(229,9,20,0.5)]">NOW24</span>
          </h1>
          <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.4em] text-zinc-500 uppercase mt-4 font-bold select-none">
            PREMIUM IPTV SATELLITE CLIENT
          </p>

          {/* Loading status bar */}
          <div className="w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-12 border border-zinc-850">
            <div
              className="h-full bg-gradient-to-r from-[#71091a] to-[#e50914] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.5)]"
              style={{ width: `${splashProgress}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 font-semibold mt-4">
            INITIALIZING SECURE GATEWAY {splashProgress}%
          </span>
        </div>
      )}


      {/* --- B. ONBOARDING LOGIN FLOW --- */}
      {viewState === "onboarding" && (
        <div className="fixed inset-0 bg-gradient-to-b from-[#1a050a] via-[#070707] to-black overflow-y-auto flex flex-col items-center justify-center p-4 py-8 z-40">
          <div className="mb-8 text-center animate-logo-pulse">
            <div className="flex justify-center items-center gap-3 mb-2">
              <img src="/assets/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              <div className="text-left">
                 <span className="font-display font-bold text-2xl tracking-wider text-white block leading-none">
                  WATCH<span className="text-[#e50914]">NOW24</span>
                </span>
                <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase font-extrabold">IPTV PREMIUM</span>
              </div>
            </div>
          </div>

          <LoginForms onLoginSuccess={handleAuthOnboardingSuccess} />

          <div className="mt-8 text-center text-[10px] font-mono text-zinc-600 max-w-[320px]">
            Fully optimized for Android smart television controls, touch gestures, and remote D-pads. Supported code parsing: #EXTM3U list links, Xtream portal players.
          </div>
        </div>
      )}


      {/* --- C. CORE MAIN DASHBOARD SCREEN (SIDEBAR + MAIN COMPONENT VIEWS) --- */}
      {viewState === "dashboard" && (
        <div className="flex-1 w-full flex h-screen overflow-hidden text-zinc-200">

          {/* Responsive Layout Left Sidebar */}
          <Sidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            accountStatus={credentials.status}
            vpnConnected={vpnConnected}
            activeTheme={activeTheme}
            openRemote={() => setIsRemoteOpen(!isRemoteOpen)}
            isRemoteOpen={isRemoteOpen}
            language={playerPreferences.language}
          />

          {/* Primary View content container with dynamic custom themes backgrounds */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#0F0E13] via-zinc-950 to-[#050505] relative custom-scrollbar select-none">
            <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-red-950/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Global Header Bar matching Sleek Interface Theme */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-white/5 z-10">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight uppercase font-display select-none flex items-center gap-2">
                  WatchNow<span className="text-[#e50914]">24</span>{" "}
                  <span className="text-[11px] ml-2 font-semibold bg-[#e50914]/10 text-[#e50914] px-2 py-0.5 rounded border border-[#e50914]/20">PREMIUM IPTV</span>
                </h1>
                <p className="text-[10px] text-white/40 tracking-widest mt-1 font-semibold uppercase">
                  {activeSection === "home" ? "ULTRA-FLUID STREAMING EXPERIENCE" : `PORTAL ZONE / ${activeSection.replace("-", " ").toUpperCase()}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                {/* Search box inline for premium look */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search channels, VOD..."
                    className="w-full bg-zinc-900/50 border border-white/5 text-xs rounded-xl pl-9 pr-4 py-2 text-white focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/30 placeholder-zinc-500"
                  />
                </div>

                {/* Secure VPN status pill */}
                <div className="glass px-4 py-1.5 rounded-full flex items-center space-x-2.5 text-xs">
                  <div className={`w-2 h-2 ${vpnConnected ? "bg-green-500 animate-pulse" : "bg-amber-500 animate-pulse"} rounded-full`}></div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#FFFFFF]/80 uppercase">
                    {vpnConnected ? `SECURE VPN: ${vpnNodeDetails?.name || "ACTIVE"}` : "SECURE VPN: BYPASSED"}
                  </span>
                </div>

                {/* Profile card block */}
                <div className="flex items-center space-x-3 bg-white/3 border border-white/5 px-3.5 py-1.5 rounded-xl">
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-white leading-tight">Welcome, {credentials.username || "Jean-Luc"}</p>
                    <p className="text-[9px] font-mono text-white/40 leading-none mt-0.5 font-semibold">Premium Active</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 p-0.5 bg-zinc-900/50 flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-tr from-burgundy-900 to-red-650 rounded-full flex items-center justify-center font-bold text-[10px] text-white">
                      JL
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Streaming Player Active Overlay Canvas */}
            {currentChannel && activeSection !== "vpn" && activeSection !== "speedtest" && (
              <div className="mb-6">
                <IptvVideoPlayer
                  channel={currentChannel}
                  secondaryChannel={secondaryChannel}
                  preferences={playerPreferences}
                  onClose={() => setCurrentChannel(null)}
                  onToggleMultiScreen={() => setIsMultiScreenActive(!isMultiScreenActive)}
                  isMultiScreenActive={isMultiScreenActive}
                  onSelectSecondaryChannel={setSecondaryChannel}
                  allChannelsList={playlistChannels.filter(c => c.streamType === "live")}
                />
              </div>
            )}


            {/* ======================= i. DASHBOARD HOME VIEW ======================= */}
            {activeSection === "home" && (
              <div className="space-y-6">
                {/* Core Account bento metrics card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-tr from-burgundy-950/30 via-zinc-900/60 to-zinc-900/10 p-5 rounded-xl border border-zinc-800/80">
                    <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1">
                      USER IDENTITY
                    </p>
                    <h4 className="text-sm font-semibold truncate text-zinc-200">{credentials.username}</h4>
                    <p className="text-[10px] font-mono text-zinc-500 truncate mt-1">Host Check: {credentials.serverUrl}</p>
                    <div className="mt-3.5 flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">EXPIRES:</span>
                      <span className="text-amber-400 font-bold">2027-12-31</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1">
                        SATELLITE SOURCE
                      </p>
                      <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-cyan-400" />
                        WATCHNOW24 GATEWAY
                      </h4>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-500">CONN LIMITS:</span>
                      <span className="text-emerald-400 font-extrabold">4 ACTIVATED</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/80 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider mb-1">
                        INTEGRATED HARDWARE
                      </p>
                      <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-400" />
                        EXOPLAYER-3 ENGINE
                      </h4>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-500">BUFFER SETTINGS:</span>
                      <span className="text-zinc-305 text-zinc-400">{playerPreferences.bufferSizeMs}ms Low-Delay</span>
                    </div>
                  </div>
                </div>

                {/* Horizontal Favorites List shelf */}
                {favorites.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" /> FAVORITES CHANNELS ({favorites.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {playlistChannels
                        .filter(ch => favorites.includes(ch.id))
                        .map(ch => (
                          <div
                            key={`fav-${ch.id}`}
                            onClick={() => handlePlayChannel(ch)}
                            className="bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-[#e50914]/40 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.03] text-center relative group glossy-card premium-border"
                          >
                            <img src={ch.logo} alt={ch.name} className="w-12 h-12 object-cover rounded-lg mx-auto mb-2" />
                            <h4 className="text-[11px] truncate font-medium text-zinc-200">{ch.name}</h4>
                            <span className="text-[9px] font-mono text-zinc-500 block truncate mt-0.5">{ch.group}</span>

                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavoriteChannelState(ch.id); }}
                              className="absolute top-2 right-2 text-red-550 hidden group-hover:block p-1"
                            >
                              ✕
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECENTLY VIEWED ROW */}
                {historyList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-cyan-400" /> RECENTLY WATCHED
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 select-none custom-scrollbar scrollbar-thin">
                      {playlistChannels
                        .filter(ch => historyList.includes(ch.id))
                        .map(ch => (
                          <div
                            key={`rec-${ch.id}`}
                            onClick={() => handlePlayChannel(ch)}
                            className="min-w-[150px] max-w-[150px] bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02]"
                          >
                            <img src={ch.logo} alt={ch.name} className="w-10 h-10 object-cover rounded-lg mb-2" />
                            <h4 className="text-[11px] truncate font-medium text-zinc-200">{ch.name}</h4>
                            <span className="text-[8px] font-mono text-zinc-500 block truncate">{ch.group}</span>
                          </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard Channels grid quick summary */}
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-widest mb-3">
                    ALL RECONFIGURED INTEGRATIONS
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {playlistChannels.slice(0, 6).map(ch => {
                      const isFav = favorites.includes(ch.id);
                      return (
                        <div
                          key={`hq-${ch.id}`}
                          onClick={() => handlePlayChannel(ch)}
                          className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          <div className="flex gap-2 w-10/12 items-center">
                            <img src={ch.logo} alt={ch.name} className="w-10 h-10 object-cover rounded-lg" />
                            <div className="truncate">
                              <h4 className="text-xs font-semibold text-zinc-100 truncate">{ch.name}</h4>
                              <p className="text-[9px] font-mono text-zinc-500 truncate">{ch.group}</p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavoriteChannelState(ch.id); }}
                            className="p-1 hover:bg-zinc-800 rounded-lg"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? "text-red-500 fill-red-500" : "text-zinc-600"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {/* ======================= ii. LIVE TV CHANNELS VIEW ======================= */}
            {activeSection === "live-tv" && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Horizontal responsive category picker on top or left drawer */}
                <div className="w-full lg:w-3/12 xl:w-64 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-900 space-y-1">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">
                    NETWORK GROUPS
                  </h4>
                  <button
                    onClick={() => setChannelFilterType("All")}
                    className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      channelFilterType === "All" ? "bg-red-900/40 text-red-400 font-bold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    ALL BROADCAST CHANNELS
                  </button>
                  {channelCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setChannelFilterType(cat)}
                      className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-mono font-medium truncate transition-all ${
                        channelFilterType === cat ? "bg-red-900/40 text-red-00 text-red-400 font-bold border-l-2 border-red-500" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Focused Channels items Grid list */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredActiveChannels.map((ch, idx) => {
                      const isHighlightedByRemote = idx === selectedFocusIdx;
                      const isFav = favorites.includes(ch.id);

                      return (
                        <div
                          key={`lc-${ch.id}`}
                          onClick={() => handlePlayChannel(ch)}
                          className={`bg-zinc-900/30 hover:bg-zinc-900 border rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between ${
                            isHighlightedByRemote
                              ? "ring-2 ring-red-505 ring-red-500 bg-red-950/5 border-red-500/40"
                              : "border-zinc-800"
                          }`}
                        >
                          <div className="flex gap-2.5 items-start mb-2">
                            <img src={ch.logo} alt={ch.name} className="w-11 h-11 object-cover rounded-lg border border-zinc-800" />
                            <div className="truncate">
                              <span className="text-[9px] font-mono bg-zinc-800/60 px-1 font-bold text-amber-500 rounded">
                                СH {ch.number || "0"}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate mt-1">{ch.name}</h4>
                            </div>
                          </div>

                          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                            {ch.description || "Active interactive satellite feed connected via port."}
                          </p>

                          {/* Quick details & Fav switcher */}
                          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                            <span>ONLINE 4K</span>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavoriteChannelState(ch.id); }}
                                className="p-1 hover:bg-zinc-800 rounded"
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFav ? "text-red-500 fill-red-500" : "text-zinc-600"}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredActiveChannels.length === 0 && (
                    <div className="p-8 text-center text-zinc-500 border border-zinc-800/60 rounded-xl bg-zinc-900/10">
                      Found zero channels matching search indicators. Try resetting category.
                    </div>
                  )}

                  {/* SIMULATED LIVE EPG TIMELINE GRID */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 mt-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-400">
                        <Calendar className="w-4 h-4 text-amber-500" /> ACTIVE ELECTRONIC PROGRAM GUIDE (EPG)
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">AUTO-SYNC ZONE: Europe/UTC</span>
                    </div>

                    <div className="space-y-2 select-none">
                      {/* EPG timeline entries */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono text-zinc-500 font-bold bg-zinc-900/30 p-1 rounded uppercase tracking-widest">
                        <span>CHANNEL INTRO</span>
                        <span>08:00 AM — 10:00 AM (ON AIR)</span>
                        <span>10:00 AM — 12:00 PM</span>
                        <span>12:00 PM — 04:00 PM</span>
                      </div>

                      {playlistChannels.slice(0, 4).map(ch => (
                        <div key={`epg-${ch.id}`} className="grid grid-cols-4 gap-2 items-center bg-zinc-900/20 px-2 py-1.5 rounded text-xs border border-zinc-900">
                          <div className="flex items-center gap-1.5 truncate">
                            <img src={ch.logo} alt={ch.name} className="w-5 h-5 rounded object-cover" />
                            <span className="font-mono text-[10px] max-w-[120px] truncate text-zinc-300">{ch.name}</span>
                          </div>
                          <div className="bg-red-950/20 border border-red-550/25 p-1 rounded text-[10px] truncate text-center text-red-400">
                            ★ Direct News Coverage
                          </div>
                          <div className="bg-zinc-950 p-1 rounded text-[10px] truncate text-zinc-500 text-center">
                            World Documentaries
                          </div>
                          <div className="bg-zinc-950 p-1 rounded text-[10px] truncate text-zinc-500 text-center">
                            Prime Series Marathon
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* ======================= iii. MOVIES / VOD VIEW ======================= */}
            {activeSection === "vod" && (
              <div className="space-y-6">
                {/* Horizontal Categories */}
                <div className="flex lg:flex pr-1 py-1 overflow-x-auto gap-2 custom-scrollbar select-none">
                  <button
                    onClick={() => setActiveVodCategory("All")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex-shrink-0 ${
                      activeVodCategory === "All" ? "bg-red-800 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ALL MOVIES
                  </button>
                  {Array.from(new Set(playlistChannels.filter(c => c.streamType === "movie").map(c => c.group))).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveVodCategory(cat)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex-shrink-0 ${
                        activeVodCategory === cat ? "bg-red-800 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredActiveChannels.map(movie => (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovieDetail(movie)}
                      className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 cursor-pointer hover:scale-[1.03] transition-all group flex flex-col justify-between glossy-card premium-border"
                    >
                      {/* Movie HD Poster image */}
                      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img
                          src={movie.logo}
                          alt={movie.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-60"></div>

                        {/* Top corner Rating indicator */}
                        {movie.rating && (
                          <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-md px-2 py-1 rounded text-[9px] font-mono text-amber-400 font-bold border border-zinc-800 flex items-center gap-1">
                            ★ {movie.rating}
                          </div>
                        )}
                        {movie.year && (
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300">
                            {movie.year}
                          </div>
                        )}
                      </div>

                      {/* Info Panel footer */}
                      <div className="p-3">
                        <h4 className="text-xs font-bold text-white truncate">{movie.name}</h4>
                        <span className="text-[9px] font-mono text-zinc-500 block truncate mt-0.5">{movie.group}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredActiveChannels.length === 0 && (
                  <p className="text-center text-zinc-500 py-10">We found zero cinematic matching results.</p>
                )}
              </div>
            )}


            {/* ======================= iv. EPISODIC SERIES VIEW ======================= */}
            {activeSection === "series" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlistChannels
                  .filter(c => c.streamType === "series")
                  .map(series => (
                    <div
                      key={series.id}
                      className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl overflow-hidden flex flex-col justify-between glossy-card premium-border"
                    >
                      <div className="flex gap-4">
                        <img
                          src={series.logo}
                          alt={series.name}
                          className="w-20 h-28 object-cover rounded-lg border border-zinc-800 flex-shrink-0"
                        />
                        <div className="space-y-1 truncate">
                          <h4 className="text-sm font-bold text-white truncate">{series.name}</h4>
                          <span className="text-[9px] uppercase font-mono tracking-wider bg-amber-400/10 text-amber-400 px-2 py-0.5 font-bold rounded">
                            COMPLETED OUT: SERIES
                          </span>
                          <p className="text-[10px] text-zinc-500">Rating: {series.rating || "8.9"}/10</p>
                          <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed mt-1 whitespace-normal">
                            {series.description}
                          </p>
                        </div>
                      </div>

                      {/* Episode select list trigger panel */}
                      <div className="mt-4 pt-4 border-t border-zinc-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase block">
                            AVAILABLE EPISODES EP:
                          </span>
                          {series.xtreamSeriesId && (
                            <button
                              onClick={() => fetchXtreamEpisodes(series.id, series.xtreamSeriesId!)}
                              disabled={loadingEpisodesForSeries === series.id}
                              className="text-[9px] bg-red-650/10 hover:bg-red-550/20 text-red-400 font-mono font-extrabold uppercase px-2 py-1 rounded border border-red-500/10 hover:border-red-500/30 transition-all cursor-pointer flex items-center gap-1"
                            >
                              {loadingEpisodesForSeries === series.id ? (
                                <span className="animate-spin text-red-500 inline-block h-2 w-2 border-2 border-current border-t-transparent rounded-full mr-1"></span>
                              ) : null}
                              {series.seasons?.[0]?.episodes?.[0]?.id.includes("placeholder") ? "Synchroniser" : "Actualiser"}
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {series.seasons?.flatMap(s => 
                            (s.episodes || []).map(ep => ({ ...ep, seasonNumber: s.seasonNumber }))
                          ).map(ep => (
                            <button
                              key={ep.id}
                              onClick={() => {
                                // Assemble temporary channel object representing specific episode
                                const epChannel: IptvChannel = {
                                  id: ep.id,
                                  name: `${series.name} — S${ep.seasonNumber < 10 ? "0" + ep.seasonNumber : ep.seasonNumber}E${ep.episodeNumber < 10 ? "0" + ep.episodeNumber : ep.episodeNumber}: ${ep.title}`,
                                  logo: series.logo,
                                  url: ep.url,
                                  group: `SERIES EPISODES: ${series.name}`,
                                  streamType: "series",
                                  description: ep.description || "Episodic narrative showcase loop."
                                };
                                handlePlayChannel(epChannel);
                              }}
                              className="w-full bg-zinc-900 hover:bg-zinc-850 p-2 text-xs rounded border border-zinc-800 block text-left truncate hover:border-red-500 transition-colors"
                            >
                              <div className="flex justify-between items-center text-zinc-350">
                                <span>S{ep.seasonNumber}E{ep.episodeNumber}: {ep.title}</span>
                                <span className="text-[9px] font-mono text-zinc-500">{ep.duration}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            )}


            {/* ======================= v. CATCHUP / REPLAY VIEW ======================= */}
            {activeSection === "catchup" && (
              <div className="space-y-6">
                <div className="p-5 bg-zinc-900/40 rounded-xl border border-zinc-850 border-zinc-800">
                  <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                    24h Catch-Up Scheduler Simulation
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                    Missing live broadcasts? Our storage caching automatically stores the last 24 hours of buffer frames. Highlight any program from yesterday to stream direct-replay.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-550 block font-bold tracking-widest">
                    YESTERDAY'S AIR PLAYLISTS RECORDS:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {playlistChannels.slice(0, 4).map(ch => (
                      <div
                        key={`catch-${ch.id}`}
                        onClick={() => {
                          const catchChannel: IptvChannel = {
                            ...ch,
                            name: `[REPLAY] ${ch.name}`,
                            group: "Catch-up Replay Feeds",
                          };
                          handlePlayChannel(catchChannel);
                        }}
                        className="p-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex gap-3 items-center truncate">
                          <img src={ch.logo} alt={ch.name} className="w-12 h-12 rounded object-cover" />
                          <div className="truncate">
                            <span className="text-[9px] font-mono text-red-400 bg-red-450/10 px-1 rounded">
                              REPLAY RECORD
                            </span>
                            <h4 className="text-xs font-semibold text-zinc-250 text-white truncate mt-1">{ch.name}</h4>
                            <p className="text-[10px] text-zinc-500 truncate">Previous program: Sports &amp; Global Recap</p>
                          </div>
                        </div>

                        <button className="p-2 hover:bg-zinc-800 rounded-lg text-emerald-400">
                          <Play className="w-4 h-4 fill-emerald-500/20" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* ======================= vi. AI ASSISTANT VIEW ======================= */}
            {activeSection === "ai-assistant" && (
              <div className="space-y-4">
                <AiAssistant />
              </div>
            )}


            {/* ======================= vii. INTEG VPN SHIELD SECTOR ======================= */}
            {activeSection === "vpn" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-zinc-900/20 p-4 rounded-xl border border-zinc-800">
                  <Shield className="w-6 h-6 text-red-500" />
                  <div>
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                      DNS IPS PROTECTION &amp; GEOLOCATION BYPASS
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Maintain complete safety. Encrypts stream handshakes, defending your local ISP accounts against direct tracking or speed throttling.
                    </p>
                  </div>
                </div>

                <VpnSection
                  onStatusChange={(isConnected, activeNode) => {
                    setVpnConnected(isConnected);
                    setVpnNodeDetails(activeNode);
                  }}
                />
              </div>
            )}


            {/* ======================= viii. SPEED TEST AREA ======================= */}
            {activeSection === "speedtest" && (
              <div className="space-y-4">
                <SpeedTestSection />
              </div>
            )}


            {/* ======================= ix. SETTINGS / CONFIG PREFERENCES ======================= */}
            {activeSection === "settings" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none animate-fadeIn">
                {/* 1. Account specifications card */}
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-400 uppercase">
                    IPTV ACCOUNT PROPERTIES
                  </h3>

                  <div className="space-y-2.5">
                    <div className="flex justify-between py-2 border-b border-zinc-900 text-xs">
                      <span className="text-zinc-500">Access Key:</span>
                      <span className="text-zinc-300 font-mono font-bold select-all">{credentials.username}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-900 text-xs">
                      <span className="text-zinc-500">Broadcaster Port:</span>
                      <span className="text-zinc-300 font-mono truncate max-w-[200px]">{credentials.serverUrl}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-900 text-xs text-emerald-400">
                      <span>Gateway Account Status:</span>
                      <span className="font-bold border border-emerald-500/25 px-1 bg-emerald-500/10 rounded">ACTIVE SUBSCRIBER</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-zinc-900 text-xs">
                      <span className="text-zinc-500">Connections Activated:</span>
                      <span className="text-zinc-300 font-mono">1 / {credentials.maxConnections} Session</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewState("onboarding")}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-bold text-red-400 uppercase rounded-xl transition-all"
                  >
                    DISCONNECT &amp; LOGOUT KEYS
                  </button>
                </div>

                {/* 2. Visual design preferences themes switcher */}
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-400 uppercase">
                    CUSTOM WATCHNOW24 CORPO THEMES
                  </h3>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Obsidian slate */}
                    <div
                      onClick={() => setActiveTheme("obsidian-dark")}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        activeTheme === "obsidian-dark" ? "border-cyan-400 bg-cyan-950/10 text-cyan-400" : "border-zinc-800 hover:bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-cyan-400 mx-auto mb-2"></div>
                      <span className="text-[10px] font-mono font-bold uppercase block">Obsidian Slate</span>
                    </div>

                    {/* Crimson burgundy */}
                    <div
                      onClick={() => setActiveTheme("crimson-burgundy")}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        activeTheme === "crimson-burgundy" ? "border-red-500 bg-burgundy-950/10 text-red-400" : "border-zinc-800 hover:bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#3f0916] border border-red-500 mx-auto mb-2"></div>
                      <span className="text-[10px] font-mono font-bold uppercase block">Crimson Burgundy</span>
                    </div>

                    {/* Royal gold */}
                    <div
                      onClick={() => setActiveTheme("royal-gold")}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        activeTheme === "royal-gold" ? "border-amber-400 bg-amber-950/10 text-amber-400" : "border-zinc-800 hover:bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-400 mx-auto mb-2"></div>
                      <span className="text-[10px] font-mono font-bold uppercase block">Royal Gold</span>
                    </div>
                  </div>

                  {/* Buffer preference size selections */}
                  <div className="space-y-2 pt-3">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold block">BUFFERS SIZE LATENCY PRESETS:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1500, 5000, 10000].map(latency => (
                        <button
                          key={latency}
                          onClick={() => setPlayerPreferences(prev => ({ ...prev, bufferSizeMs: latency }))}
                          className={`py-1.5 rounded text-[10px] font-mono font-semibold ${
                            playerPreferences.bufferSizeMs === latency
                              ? "bg-red-800 text-white"
                              : "bg-zinc-900 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {latency === 1500 ? "Low Delay (1.5s)" : latency === 5000 ? "Stable (5.0s)" : "Safe Stream (10s)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Hardware acceleration & Advanced Settings */}
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-400 uppercase">
                    HARDWARE DECODING & ADVANCED
                  </h3>

                  <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-850">
                    <div>
                      <p className="text-xs font-bold text-zinc-250">GL-VIRTUAL HARDWARE ACCELERATION</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Leverages WebGL rendering canvas to optimize buffer rate frames</p>
                    </div>
                    <button
                      onClick={() => setPlayerPreferences(prev => ({ ...prev, hardwareAcceleration: !prev.hardwareAcceleration }))}
                      className={`w-10 h-6 rounded-full p-1 transition-all ${playerPreferences.hardwareAcceleration ? "bg-emerald-600" : "bg-zinc-800"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${playerPreferences.hardwareAcceleration ? "translate-x-4" : "translate-x-0"}`}></div>
                    </button>
                  </div>

                  {/* VRAI INPUT: Language select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-550 text-zinc-500 font-bold block uppercase">
                      SYSTEM INTERFACE LANGUAGE:
                    </label>
                    <select
                      value={playerPreferences.language || "fr"}
                      onChange={(e) => setPlayerPreferences(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    >
                      <option value="en">English (Anglais)</option>
                      <option value="fr">Français (French)</option>
                      <option value="es">Español (Spanish)</option>
                    </select>
                  </div>

                  {/* VRAI INPUT: Container Stream Protocol select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-550 text-zinc-500 font-bold block uppercase">
                      DEFAULT CONTAINER STREAM PROTOCOL:
                    </label>
                    <select
                      value={playerPreferences.preferredProtocol || "m3u8"}
                      onChange={(e) => setPlayerPreferences(prev => ({ ...prev, preferredProtocol: e.target.value as any }))}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    >
                      <option value="m3u8">HLS Stream Feed (.m3u8)</option>
                      <option value="ts">MPEG-TS Live Broadcast (.ts)</option>
                      <option value="rtmp">Real-Time Messaging Protocol (.rtmp)</option>
                    </select>
                  </div>

                  {/* VRAI INPUT: Secure DNS Resolver */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-550 text-zinc-500 font-bold block uppercase">
                      SECURE DNS GATEWAY RESOLVER:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1.1.1.1"
                      value={playerPreferences.primaryDns || ""}
                      onChange={(e) => setPlayerPreferences(prev => ({ ...prev, primaryDns: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div className="flex gap-2.5 justify-end pt-2">
                    <button
                      onClick={triggerPlaylistBackupRestore}
                      className="bg-zinc-900 hover:bg-zinc-850 text-[10px] font-mono uppercase font-bold tracking-wider text-zinc-350 border border-zinc-800 px-3.5 py-2.5 rounded-xl transition-all"
                    >
                      STORE SYSTEM BACKUP
                    </button>
                  </div>
                </div>

                {/* 4. Parental PIN configuration box within preferences */}
                <ParentalControlModal
                  config={parentalConfig}
                  onSave={setParentalConfig}
                  categories={["Live TV - News & Global", "Live TV - Sports & Extreme", "Imported Channels", "18+ Adult Channels"]}
                />
              </div>
            )}
          </main>

          {/* --- SLIDING TV REMOTE EMULATION CONTROL OVERLAY --- */}
          {isRemoteOpen && (
            <div className="w-52 bg-zinc-950/95 border-l border-zinc-900 h-full p-3 flex flex-col justify-center items-center transition-all animate-slideLeft">
              <VirtualTvRemote />
              <button
                onClick={() => setIsRemoteOpen(false)}
                className="mt-4 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
              >
                COLLAPSE DPAD
              </button>
            </div>
          )}

        </div>
      )}


      {/* --- MOVIE DESCRIPTION DETAILS DRAWER / MODAL --- */}
      {selectedMovieDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-zinc-950 rounded-2xl w-full max-w-2xl border border-zinc-800 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-l from-burgundy-950/20 to-transparent pointer-events-none"></div>

            {/* Backdrop image banner */}
            <div className="h-60 relative">
              <img
                src={selectedMovieDetail.backdrop || selectedMovieDetail.logo}
                alt={selectedMovieDetail.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedMovieDetail(null)}
                className="absolute top-4 right-4 bg-black/70 hover:bg-zinc-800 text-white rounded-full p-2.5 border border-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Movie particulars content descriptions */}
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  4K ULTRA HD
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{selectedMovieDetail.year}</span>
                <span className="text-[10px] font-mono text-zinc-500">{selectedMovieDetail.duration}</span>
                {selectedMovieDetail.rating && (
                  <span className="text-[10px] font-mono text-amber-400">★ {selectedMovieDetail.rating}</span>
                )}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 leading-none font-display">
                  {selectedMovieDetail.name}
                </h1>
                <p className="text-[10px] uppercase font-mono text-zinc-500 font-bold">{selectedMovieDetail.group}</p>
              </div>

              <p className="text-[12px] leading-relaxed text-zinc-350 text-zinc-300">
                {selectedMovieDetail.description}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-3 text-[11px] font-mono border-t border-zinc-900 text-zinc-500">
                <div>DIRECTOR: <span className="text-zinc-300 font-bold">{selectedMovieDetail.director || "Unknown"}</span></div>
                <div>CASTS: <span className="text-zinc-300 truncate block">{selectedMovieDetail.cast || "Interactive Screen Actors"}</span></div>
              </div>

              {/* Media launcher buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handlePlayChannel(selectedMovieDetail);
                    setSelectedMovieDetail(null);
                  }}
                  className="px-6 py-3 bg-red-800 hover:bg-red-700 font-mono text-xs font-bold uppercase tracking-wider text-white rounded-xl transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> STREAM CINEMATIC
                </button>

                <button
                  onClick={() => setSelectedMovieDetail(null)}
                  className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 font-mono text-xs font-semibold uppercase text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
                >
                  COLLAPSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* --- RE-VERIFY SECURITY PIN SCREEN --- */}
      {requiresPinCat && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 z-50 select-none animate-fadeIn">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-red-900/30 max-w-xs text-center space-y-4">
            <Lock className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-widest">VAULT DECRYPT PROTECTION</h3>
              <p className="text-[11px] text-zinc-500 mt-1">This network category is protected via parental code filters.</p>
            </div>

            <div className="max-w-[180px] mx-auto space-y-3">
              <input
                type="password"
                maxLength={4}
                value={pinUnlockInput}
                onChange={(e) => setPinUnlockInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full bg-zinc-900 text-center text-xl tracking-widest font-mono border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRequiresPinCat(null)}
                  className="w-1/2 bg-zinc-900 text-[10px] font-mono py-2 rounded text-zinc-400 hover:text-white uppercase font-bold border border-zinc-800"
                >
                  CANCEL
                </button>
                <button
                  onClick={verifyCategoryPin}
                  className="w-1/2 bg-red-700 hover:bg-red-650 text-[10px] font-mono py-2 rounded text-white uppercase font-bold"
                >
                  AUTHENTICATE
                </button>
              </div>
            </div>

            {pinError && <p className="text-[10px] text-red-400 font-mono font-bold animate-pulse">{pinError}</p>}
          </div>
        </div>
      )}

    </div>
  );
}
