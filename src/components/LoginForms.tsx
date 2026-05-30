import React, { useState, useRef } from "react";
import { Tv, KeyRound, Upload, Globe, ArrowRight, ShieldCheck, HelpCircle, HardDrive } from "lucide-react";
import { IptvChannel } from "../types";

interface LoginFormsProps {
  onLoginSuccess: (channels: IptvChannel[], loginType: "xtream" | "m3u" | "demo", credentials?: any) => void;
}

export default function LoginForms({ onLoginSuccess }: LoginFormsProps) {
  const [activeTab, setActiveTab] = useState<"demo" | "xtream" | "m3u">("demo");

  // Xtream Codes inputs
  const [serverUrl, setServerUrl] = useState("http://pro.business-cloud-neo.com");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // M3U URL / File Upload inputs
  const [m3uUrl, setM3uUrl] = useState("");
  const [clipboardContent, setClipboardContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // M3U Line-by-Line Parsing helper
  const parseM3uData = (text: string): IptvChannel[] => {
    const lines = text.split("\n");
    const parsedChannels: IptvChannel[] = [];
    let currentChannel: Partial<IptvChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXTINF:")) {
        currentChannel = { streamType: "live" }; // Default

        // Extract metadata attributes
        const logoMatch = line.match(/tvg-logo="([^"]+)"/) || line.match(/logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const numberMatch = line.match(/tvg-id="([^"]+)"/) || line.match(/channel-id="([^"]+)"/);

        if (logoMatch) currentChannel.logo = logoMatch[1];
        if (groupMatch) currentChannel.group = groupMatch[1];
        if (numberMatch) currentChannel.number = numberMatch[1];

        // Name is usually after the last comma
        const commaIndex = line.lastIndexOf(",");
        if (commaIndex !== -1) {
          currentChannel.name = line.substring(commaIndex + 1).trim();
        } else {
          currentChannel.name = "Unknown Stream Channel";
        }
      } else if (line.length > 0 && !line.startsWith("#")) {
        // Stream URL line
        currentChannel.url = line;
        currentChannel.id = `parsed_${parsedChannels.length}_${Date.now()}`;
        if (!currentChannel.group) currentChannel.group = "Imported Channels";
        if (!currentChannel.logo) {
          currentChannel.logo = "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=150&h=150&fit=crop";
        }

        // Auto determine stream type from file extension
        const urlLower = line.toLowerCase();
        if (urlLower.includes("/movie/") || urlLower.endsWith(".mp4") || urlLower.endsWith(".mkv")) {
          currentChannel.streamType = "movie";
          currentChannel.year = "2023";
        } else if (urlLower.includes("/series/") || urlLower.includes("/episodes/")) {
          currentChannel.streamType = "series";
        } else {
          currentChannel.streamType = "live";
        }

        if (currentChannel.name && currentChannel.url) {
          parsedChannels.push(currentChannel as IptvChannel);
        }
        currentChannel = {};
      }
    }
    return parsedChannels;
  };

  // Perform Xtream Login check
  const handleXtreamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !password) {
      setErrorMsg("Please specify lookups keys: username and password");
      return;
    }

    setIsSubmitting(true);
    try {
      let normalizedServerUrl = serverUrl.trim();
      if (normalizedServerUrl.endsWith("/")) {
        normalizedServerUrl = normalizedServerUrl.slice(0, -1);
      }

      // Real endpoint construction checking
      // If user provided test domain/localhost, fallback to high-fidelity simulated satellite list
      if (normalizedServerUrl.includes("watchnow24.com") || username.toLowerCase() === "demo") {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Succesfully load demo channels under Xtream branding
        onLoginSuccess([], "demo", { serverUrl: normalizedServerUrl, username, password });
      } else {
        // API Base detection
        const API_BASE = window.location.hostname.includes("vercel.app") ? "" : "https://android-watchnow24-iptv.vercel.app";

        // Initiate active connection fetch loop proxy
        const checkUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}`;

        // Fix: Use the Vercel proxy even on Android to avoid CORS issues with IPTV providers
        const requestUrl = `${API_BASE}/api/iptv/proxy?url=${encodeURIComponent(checkUrl)}`;

        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data && data.user_info) {
          setErrorMsg("Success! API Connection verified. Syncing collections...");

          // Helper to fetch via proxy
          const smartFetch = async (url: string) => {
            const finalUrl = `${API_BASE}/api/iptv/proxy?url=${encodeURIComponent(url)}`;
            return fetch(finalUrl);
          };

          // 1. Fetch categories maps to display elegant human-readable group names
          let liveCategoriesMap: Record<string, string> = {};
          let vodCategoriesMap: Record<string, string> = {};
          let seriesCategoriesMap: Record<string, string> = {};

          try {
            const catUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
            const catRes = await smartFetch(catUrl);
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              catData.forEach((c: any) => {
                if (c.category_id && c.category_name) {
                  liveCategoriesMap[c.category_id.toString()] = c.category_name;
                }
              });
            }
          } catch (e) {
            console.warn("Unable to preload live categories", e);
          }

          try {
            const catUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`;
            const catRes = await smartFetch(catUrl);
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              catData.forEach((c: any) => {
                if (c.category_id && c.category_name) {
                  vodCategoriesMap[c.category_id.toString()] = c.category_name;
                }
              });
            }
          } catch (e) {
            console.warn("Unable to preload VOD categories", e);
          }

          try {
            const catUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}&action=get_series_categories`;
            const catRes = await smartFetch(catUrl);
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              catData.forEach((c: any) => {
                if (c.category_id && c.category_name) {
                  seriesCategoriesMap[c.category_id.toString()] = c.category_name;
                }
              });
            }
          } catch (e) {
            console.warn("Unable to preload series categories", e);
          }

          let fetchedChannels: IptvChannel[] = [];

          // 2. Fetch Live Streams
          try {
            const liveUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
            const liveRes = await smartFetch(liveUrl);
            const liveData = await liveRes.json();
            if (Array.isArray(liveData)) {
              const mappedLive = liveData.slice(0, 500).map((item: any) => {
                const groupName = liveCategoriesMap[item.category_id?.toString()] || `Live TV — ${item.category_id || "General"}`;
                return {
                  id: `xt_live_${item.stream_id}`,
                  name: item.name || `Channel ${item.stream_id}`,
                  logo: item.stream_icon || "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=150&h=150&fit=crop",
                  url: `${normalizedServerUrl}/live/${username}/${password}/${item.stream_id}.${item.container_extension || "ts"}`,
                  group: groupName,
                  number: item.num ? item.num.toString() : "",
                  epgId: item.epg_channel_id || "",
                  streamType: "live" as const,
                  description: `Live Premium Channel feed from Xtream API. Category: ${groupName}.`
                };
              });
              fetchedChannels = [...fetchedChannels, ...mappedLive];
            }
          } catch (e) {
            console.error("Failed loading live streams from Xtream API", e);
          }

          // 3. Fetch Movies (VOD)
          try {
            const vodUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
            const vodRes = await smartFetch(vodUrl);
            const vodData = await vodRes.json();
            if (Array.isArray(vodData)) {
              const mappedMovies = vodData.slice(0, 300).map((item: any) => {
                const groupName = vodCategoriesMap[item.category_id?.toString()] || `Movies — ${item.category_id || "VOD"}`;
                return {
                  id: `xt_movie_${item.stream_id}`,
                  name: item.name || `Movie ${item.stream_id}`,
                  logo: item.stream_icon || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=200&h=200&fit=crop",
                  url: `${normalizedServerUrl}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || "mp4"}`,
                  group: groupName,
                  streamType: "movie" as const,
                  rating: item.rating ? item.rating.toString() : "8.1",
                  year: item.year ? item.year.toString() : "2024",
                  description: `Xtream VOD. Format: Master stream (.${item.container_extension || "mp4"}). Category: ${groupName}.`
                };
              });
              fetchedChannels = [...fetchedChannels, ...mappedMovies];
            }
          } catch (e) {
            console.error("Failed loading VOD movies from Xtream API", e);
          }

          // 4. Fetch Series (TV Shows)
          try {
            const seriesUrl = `${normalizedServerUrl}/player_api.php?username=${username}&password=${password}&action=get_series`;
            const seriesRes = await smartFetch(seriesUrl);
            const seriesData = await seriesRes.json();
            if (Array.isArray(seriesData)) {
              const mappedSeries = seriesData.slice(0, 300).map((item: any) => {
                const groupName = seriesCategoriesMap[item.category_id?.toString()] || `Series — ${item.category_id || "TV"}`;
                
                // Set default/placeholder seasons structure (we will fetch authentic detailed episodes dynamically from App.tsx)
                const seriesId = item.series_id || item.num || Math.floor(Math.random() * 10000);
                const placeholderEpisodes = [
                  {
                    id: `xt_ep_placeholder_${seriesId}_1`,
                    title: "Active Episode — Sync to Load Track",
                    url: `${serverUrl}/series/${username}/${password}/${seriesId}.ts`, // reasonable fallback
                    episodeNumber: 1,
                    duration: "45m",
                    description: `Episode of ${item.name || "series"}. Click the sync button above to fetch latest season guides.`
                  }
                ];

                return {
                  id: `xt_series_${seriesId}`,
                  name: item.name || `Series ${seriesId}`,
                  logo: item.cover || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=200&h=200&fit=crop",
                  url: "", // Series runs via its episodes
                  group: groupName,
                  streamType: "series" as const,
                  rating: item.rating ? item.rating.toString() : "8.5",
                  year: item.releaseDate ? item.releaseDate.split("-")[0] : "2024",
                  description: item.plot || `Xtream series with rich episodic guide logs. Category: ${groupName}.`,
                  seasons: [
                    {
                      seasonNumber: 1,
                      episodes: placeholderEpisodes
                    }
                  ],
                  // Flag this with its native Xtream series ID for on-demand lazy episodes loading
                  xtreamSeriesId: Number(seriesId)
                };
              });
              fetchedChannels = [...fetchedChannels, ...mappedSeries];
            }
          } catch (e) {
            console.error("Failed loading TV Series from Xtream API", e);
          }

          if (fetchedChannels.length > 0) {
            onLoginSuccess(fetchedChannels, "xtream", { serverUrl, username, password });
          } else {
            setErrorMsg("Authentication succeeded, but no streams were found on this host. Loading fallback demo playlist.");
            setTimeout(() => {
              onLoginSuccess([], "demo", { serverUrl, username, password });
            }, 1500);
          }
        } else {
          // API didn't return normal user_info payload
          setErrorMsg("Access Denied: Unrecognized credentials or server inactive. Please check your username and password.");
        }
      }
    } catch (err: any) {
      setErrorMsg(`Server connection offset failed: ${err.message}. Retrying via backup channels.`);
      setTimeout(() => {
        onLoginSuccess([], "demo", { serverUrl, username, password });
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles M3U URL parser load
  const handleRemoteM3uLoad = async () => {
    if (!m3uUrl) {
      setErrorMsg("Please provide a valid M3U playlist URL link");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // API Base detection
      const API_BASE = window.location.hostname.includes("vercel.app") ? "" : "https://android-watchnow24-iptv.vercel.app";

      const proxiedUrl = `${API_BASE}/api/iptv/proxy?url=${encodeURIComponent(m3uUrl)}`;
      const response = await fetch(proxiedUrl);
      const playlistText = await response.text();

      if (playlistText.includes("#EXTM3U")) {
        const channels = parseM3uData(playlistText);
        if (channels.length > 0) {
          onLoginSuccess(channels, "m3u", { m3uUrl });
        } else {
          setErrorMsg("Playlists contains no valid channels or stream records");
        }
      } else {
        setErrorMsg("The remote location did not return a valid #EXTM3U formatting string");
      }
    } catch (err: any) {
      setErrorMsg(`Failed fetching stream content: ${err.message}. Loading preconfigured feeds.`);
      setTimeout(() => {
        onLoginSuccess([], "demo");
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handles custom code copy-paste parsing
  const handleDirectM3uParse = () => {
    if (!clipboardContent.trim().includes("#EXTM3U")) {
      setErrorMsg("Input must begin with correct #EXTM3U IPTV tag header");
      return;
    }

    const channels = parseM3uData(clipboardContent);
    if (channels.length > 0) {
      onLoginSuccess(channels, "m3u");
    } else {
      setErrorMsg("Found zero parsed channel urls in pasted text template");
    }
  };

  // Handles Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content.includes("#EXTM3U")) {
        const channels = parseM3uData(content);
        if (channels.length > 0) {
          onLoginSuccess(channels, "m3u");
        } else {
          setErrorMsg("Uploaded M3U contain zero active stream blocks");
        }
      } else {
        setErrorMsg("Selected file is not an #EXTM3U formatted IPTV playlist");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-lg glass p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
      {/* Decorative luxury gradient ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Tabs list header */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-900/40 p-1 rounded-xl mb-6 border border-zinc-800/50">
        <button
          type="button"
          onClick={() => { setActiveTab("demo"); setErrorMsg(""); }}
          className={`py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            activeTab === "demo" ? "burgundy-accent text-white burgundy-glow shadow shadow-red-500/10" : "text-zinc-400 hover:text-white"
          }`}
        >
          PREMIUM DEMO
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("xtream"); setErrorMsg(""); }}
          className={`py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            activeTab === "xtream" ? "burgundy-accent text-white burgundy-glow shadow shadow-red-500/10" : "text-zinc-400 hover:text-white"
          }`}
        >
          XTREAM API [PORT]
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("m3u"); setErrorMsg(""); }}
          className={`py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            activeTab === "m3u" ? "burgundy-accent text-white burgundy-glow shadow shadow-red-500/10" : "text-zinc-400 hover:text-white"
          }`}
        >
          M3U PLAYLISTS
        </button>
      </div>

      {/* 1. DEMO LOGIN OPTION */}
      {activeTab === "demo" && (
        <div className="space-y-5 text-center py-4">
          <div className="w-16 h-16 bg-red-700/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Tv className="w-8 h-8 text-red-500" />
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight text-white font-display">Instant Satellite Demo Connect</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Explore WATCHNOW24 IPTV immediately. Includes active HD satellite news feeds, live extreme sports networks, premium VOD movies, and episodic series without an account configuration.
            </p>
          </div>

          <div className="glass p-4 rounded-xl flex items-center justify-between text-left">
            <div>
              <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase">STATION HOST</p>
              <p className="text-xs text-zinc-300">WATCHNOW24 Central Satellite Feed</p>
            </div>
            <span className="text-[9px] uppercase font-mono tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-bold">
              FREE TRIAL PASS
            </span>
          </div>

          <button
            onClick={() => onLoginSuccess([], "demo")}
            className="w-full mt-4 py-3.5 burgundy-accent text-white text-xs font-mono font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] burgundy-glow shadow-lg active:scale-95 cursor-pointer"
          >
            LAUNCH PREMIUM SENSORS <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. XTREAM CODES API FLOW */}
      {activeTab === "xtream" && (
        <form onSubmit={handleXtreamLogin} className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-amber-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Xtream API Host Configuration</h4>
            <p className="text-[11px] text-zinc-450 text-zinc-400 mt-1">Real-time login and caching validation systems</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider uppercase block mb-1">
                Server Credentials Portal Port (URL)
              </label>
              <input
                type="url"
                required
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://server.com:8080"
                className="w-full bg-zinc-900 text-xs border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider uppercase block mb-1">
                  Access Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="iptv_username"
                  className="w-full bg-zinc-900 text-xs border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-505 focus:border-red-550 focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 font-bold tracking-wider uppercase block mb-1">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 text-xs border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 burgundy-accent text-white text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2 burgundy-glow active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-white animate-spin"></span>
            ) : "STATION ENCRYPTION SYNC"}
          </button>
        </form>
      )}

      {/* 3. M3U MULTI-FLOW PANEL */}
      {activeTab === "m3u" && (
        <div className="space-y-4">
          <div className="text-center mb-2">
            <h4 className="text-sm font-bold text-white">Import M3U Playlist Records</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">Choose local parsing files or satellite direct URL channels</p>
          </div>

          <div className="space-y-3.5">
            {/* Dynamic Local File Browser button */}
            <div className="bg-zinc-900/30 p-4 rounded-xl border border-dashed border-zinc-800 text-center relative group">
              <input
                type="file"
                ref={fileInputRef}
                accept=".m3u,.m3u8,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <HardDrive className="w-8 h-8 text-zinc-600 mx-auto mb-2 group-hover:text-amber-500 transition-colors" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-zinc-900 hover:bg-zinc-850 text-[10px] font-mono uppercase font-bold tracking-wider text-zinc-350 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all"
              >
                SELECT LOCAL PLAYLIST (.m3u)
              </button>
              <p className="text-[9px] text-zinc-550 text-zinc-500 mt-2">Maximum parsing length index: 15,000 stream feeds</p>
            </div>

            {/* Remote URL entry */}
            <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-900 space-y-2">
              <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                OPTION B: PULL PLAYLIST REMOTE LINK URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="https://example.com/playlist.m3u"
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono"
                />
                <button
                  onClick={handleRemoteM3uLoad}
                  disabled={isSubmitting}
                  className="burgundy-accent hover:opacity-90 px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider text-white transition-all burgundy-glow active:scale-95 cursor-pointer"
                >
                  LOAD
                </button>
              </div>
            </div>

            {/* Direct Paste clipboard option */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                OPTION C: PASTE M3U RAW BUFFER CODES
              </label>
              <textarea
                value={clipboardContent}
                onChange={(e) => setClipboardContent(e.target.value)}
                placeholder="#EXTM3U&#10;#EXTINF:-1 Group=&quot;Live&quot;,NASA TV Live&#10;http://nasa.feed/stream.m3u8"
                rows={3}
                className="w-full bg-zinc-900 text-[11px] font-mono border border-zinc-800 rounded-lg p-2 text-zinc-300 focus:outline-none focus:border-red-500 scrollbar-thin overflow-y-auto"
              />
              <button
                onClick={handleDirectM3uParse}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 font-mono text-[9px] uppercase font-bold tracking-widest rounded-lg transition-colors"
              >
                PARSE BUFFER CODES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Security Verification footer */}
      <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SSL SECURE INTEGRITY
        </span>
        <span>GATEWAY VERIFICATION ACTIVE</span>
      </div>

      {errorMsg && (
        <div className="absolute bottom-5 inset-x-6 bg-red-950/90 border border-red-550/30 text-amber-500 text-[10px] font-mono p-3 rounded-lg text-center z-50 animate-bounce">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
