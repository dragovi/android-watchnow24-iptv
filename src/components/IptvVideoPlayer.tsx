import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { IptvChannel, PlayerPreferences } from "../types";
import { Play, Pause, RotateCcw, Volume2, Maximize, Minimize, Settings as SettingsIcon, Layers, Laptop, ShieldAlert, MonitorPlay, ListCollapse } from "lucide-react";

interface IptvVideoPlayerProps {
  channel: IptvChannel;
  secondaryChannel?: IptvChannel | null;
  preferences: PlayerPreferences;
  onClose?: () => void;
  onToggleMultiScreen?: () => void;
  isMultiScreenActive?: boolean;
  onSelectSecondaryChannel?: (channel: IptvChannel) => void;
  allChannelsList?: IptvChannel[];
}

export default function IptvVideoPlayer({
  channel,
  secondaryChannel,
  preferences,
  onClose,
  onToggleMultiScreen,
  isMultiScreenActive = false,
  onSelectSecondaryChannel,
  allChannelsList = [],
}: IptvVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isSecondaryPlaying, setIsSecondaryPlaying] = useState(true);

  const [volume, setVolume] = useState(80);
  const [brightness, setBrightness] = useState(100);

  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [secondaryBuffering, setSecondaryBuffering] = useState(false);
  const [videoStats, setVideoStats] = useState({ format: "AUTO", bitrate: "0 Kbps", bufferHealth: "0.0s", dropped: 0 });

  const hlsRef = useRef<Hls | null>(null);
  const secondaryHlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls overlay
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Primary Video Stream Initializer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setBuffering(true);
    let hlsInstance: Hls | null = null;
    
    // API Base detection for Android
    const API_BASE = window.location.hostname === "localhost" ? "" : "https://android-watchnow24-iptv-obc9c4mvf-dragovics-projects-617f1d15.vercel.app";

    // Always proxy URLs to bypass mixed block and CORS
    const proxiedChannelUrl = channel.url.startsWith("http")
      ? `${API_BASE}/api/iptv/proxy?url=${encodeURIComponent(channel.url)}`
      : channel.url;

    if (Hls.isSupported() && channel.url.toLowerCase().includes(".m3u8")) {
      hlsInstance = new Hls({
        maxBufferLength: preferences.bufferSizeMs / 1000,
        enableWorker: true,
        lowLatencyMode: true,
        // Intercept all HLS requests to the proxy to avoid CORS/Mixed content on segments
        xhrSetup: function(xhr: any, url: string) {
          if (url.startsWith("http") && !url.includes("/api/iptv/proxy")) {
            xhr.open("GET", `${API_BASE}/api/iptv/proxy?url=${encodeURIComponent(url)}`, true);
          }
        }
      });

      hlsRef.current = hlsInstance;
      hlsInstance.loadSource(proxiedChannelUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        setBuffering(false);
      });

      hlsInstance.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
        // Calculate dynamic live streams specifications
        const level = hlsInstance?.levels[hlsInstance.currentLevel];
        const currentBitrate = level ? Math.round(level.bitrate / 1000) : 4500;
        const buffered = video.buffered;
        let bufLen = 0;
        if (buffered.length) {
          bufLen = buffered.end(buffered.length - 1) - video.currentTime;
        }

        setVideoStats(prev => ({
          ...prev,
          format: "HLS / IPTV",
          bitrate: `${currentBitrate} Kbps`,
          bufferHealth: `${bufLen.toFixed(1)}s`
        }));
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Fatal network error in stream, trying recovery...");
              hlsInstance?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Fatal media error, recovering...");
              hlsInstance?.recoverMediaError();
              break;
            default:
              console.log("Fatal HLS error:", data.details);
              hlsInstance?.destroy();
              if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = proxiedChannelUrl;
                video.load();
                video.play().catch(e => console.error("Native play failed", e));
              }
              break;
          }
        }
      });
    } else {
      // Standard MP4 stream or native browser support
      video.src = proxiedChannelUrl;
      video.load();
      video.play().then(() => {
        setIsPlaying(true);
        setBuffering(false);
      }).catch(() => {
        setIsPlaying(false);
        setBuffering(false);
      });

      setVideoStats(prev => ({
        ...prev,
        format: channel.url.endsWith(".mp4") ? "MP4 Direct" : "HTML5 Web-Stream",
        bitrate: "6000 Kbps",
        bufferHealth: "Dynamic"
      }));
    }

    const handleWaiting = () => setBuffering(true);
    const handlePlaying = () => setBuffering(false);

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      hlsRef.current = null;
    };
  }, [channel.id, channel.url, preferences.bufferSizeMs]);

  // Secondary Video Stream Initializer (Multi-Screen)
  useEffect(() => {
    if (!isMultiScreenActive || !secondaryChannel) {
      if (secondaryHlsRef.current) {
        secondaryHlsRef.current.destroy();
        secondaryHlsRef.current = null;
      }
      return;
    }

    const video = secondaryVideoRef.current;
    if (!video) return;

    setSecondaryBuffering(true);
    let hlsInstance: Hls | null = null;
    
    // Detect if we are on Android
    const isAndroid = /android/i.test(navigator.userAgent);

    const proxiedChannelUrl = isAndroid
      ? secondaryChannel.url
      : (secondaryChannel.url.startsWith("http") ? `/api/iptv/proxy?url=${encodeURIComponent(secondaryChannel.url)}` : secondaryChannel.url);

    if (Hls.isSupported() && secondaryChannel.url.toLowerCase().includes(".m3u8")) {
      hlsInstance = new Hls({
        maxBufferLength: preferences.bufferSizeMs / 1000,
        enableWorker: true,
        xhrSetup: function(xhr: any, url: string) {
          if (!isAndroid && url.startsWith("http") && !url.includes("/api/iptv/proxy")) {
            xhr.open("GET", `/api/iptv/proxy?url=${encodeURIComponent(url)}`, true);
          }
        }
      });

      secondaryHlsRef.current = hlsInstance;
      hlsInstance.loadSource(proxiedChannelUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsSecondaryPlaying(true)).catch(() => setIsSecondaryPlaying(false));
        setSecondaryBuffering(false);
      });

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.log("Fatal HLS error on secondary screen:", data.details);
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = proxiedChannelUrl;
            video.load();
            video.play().catch(e => console.error(e));
          }
        }
      });
    } else {
      video.src = proxiedChannelUrl;
      video.load();
      video.play().then(() => {
        setIsSecondaryPlaying(true);
        setSecondaryBuffering(false);
      }).catch(() => {
        setIsSecondaryPlaying(false);
        setSecondaryBuffering(false);
      });
    }

    const handleWaiting = () => setSecondaryBuffering(true);
    const handlePlaying = () => setSecondaryBuffering(false);

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      secondaryHlsRef.current = null;
    };
  }, [isMultiScreenActive, secondaryChannel?.id, secondaryChannel?.url, preferences.bufferSizeMs]);

  // Handle local properties changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleSecondaryPlay = () => {
    if (secondaryVideoRef.current && secondaryChannel) {
      if (isSecondaryPlaying) {
        secondaryVideoRef.current.pause();
        setIsSecondaryPlaying(false);
      } else {
        secondaryVideoRef.current.play();
        setIsSecondaryPlaying(true);
      }
    }
  };

  const restartStream = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleFullScreen = () => {
    const parentContainer = videoRef.current?.parentElement;
    if (parentContainer) {
      if (!document.fullscreenElement) {
        parentContainer.requestFullscreen().catch(err => {
          console.error("Fullscreen error:", err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error("Picture-in-Picture error:", err);
      }
    }
  };

  return (
    <div
      id="video_player_container"
      className="relative w-full h-[520px] bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl group transition-all duration-300"
      style={{ filter: `brightness(${brightness}%)` }}
    >
      {/* Dynamic Player Screens: Standard or Dual Layout */}
      <div className="absolute inset-0 flex w-full h-full">
        {/* PLAYER 1 */}
        <div className={`relative h-full transition-all duration-500 overflow-hidden ${isMultiScreenActive ? "w-1/2 border-r border-white/5" : "w-full"}`}>
          <video
            ref={videoRef}
            aria-label="IPTV Main stream feed"
            className="w-full h-full object-contain bg-black"
            playsInline
            muted={false}
          />

          {/* Watermark Logo */}
          <div className="absolute top-4 right-4 z-10 opacity-30 pointer-events-none select-none">
             <img src="/assets/logo.png" alt="Watermark" className="w-12 h-12 object-contain" />
          </div>

          {/* Loader Overlay */}
          {buffering && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-20">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#800020]/40 border-t-[#E50914] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-amber-900/40 border-t-amber-400 animate-spin [animation-duration:1.5s]"></div>
              </div>
              <p className="mt-4 text-xs font-mono text-zinc-300 tracking-widest animate-pulse">
                BUFFERING {preferences.bufferSizeMs}MS...
              </p>
            </div>
          )}

          {/* Main stream labels */}
          <div className="absolute top-4 left-4 z-20 glass text-[10px] uppercase font-mono px-2.5 py-1 rounded-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse"></span>
            <span className="text-zinc-300">LIVE FEED:</span>
            <span className="text-amber-400 font-bold">{channel.name}</span>
          </div>
        </div>

        {/* PLAYER 2 (Multi Screen Secondary Content) */}
        {isMultiScreenActive && (
          <div className="relative w-1/2 h-full overflow-hidden bg-zinc-950">
            {secondaryChannel ? (
              <>
                <video
                  ref={secondaryVideoRef}
                  aria-label="IPTV Secondary stream feed"
                  className="w-full h-full object-contain"
                  playsInline
                />

                {secondaryBuffering && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-20">
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-amber-400 animate-spin"></div>
                    <p className="mt-2 text-[10px] font-mono text-zinc-400 tracking-wider">SYNCING SECOND SCREEN...</p>
                  </div>
                )}

                {/* Secondary controls overlay directly inside screen 2 */}
                <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 bg-black/80 px-2 py-1 rounded-md border border-zinc-800">
                  <button
                    onClick={toggleSecondaryPlay}
                    className="p-1 text-zinc-300 hover:text-white transition-colors"
                  >
                    {isSecondaryPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>
                  <span className="text-[9px] font-mono text-zinc-400 max-w-[100px] truncate">
                    {secondaryChannel.name}
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/60 p-6 text-center text-zinc-400 border-l border-dashed border-zinc-800">
                <Laptop className="w-10 h-10 text-zinc-600 mb-2 animate-bounce" />
                <p className="text-xs font-medium text-zinc-300">Secondary Screen Empty</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
                  Select a live stream below to initialize picture-in-picture dual surveillance.
                </p>

                {/* Mini instant select list */}
                {allChannelsList.length > 0 && (
                  <div className="mt-4 w-full max-w-[220px]">
                    <p className="text-[9px] font-mono uppercase text-zinc-500 text-left mb-1.5 font-bold tracking-wider">
                      QUICK LINK CHANNELS:
                    </p>
                    <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 text-left custom-scrollbar scrollbar-thin">
                      {allChannelsList.slice(0, 5).map(ch => (
                        <button
                          key={`sub-${ch.id}`}
                          onClick={() => onSelectSecondaryChannel && onSelectSecondaryChannel(ch)}
                          className="w-full truncate text-[10px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded px-2 py-1 text-left text-zinc-300 hover:text-amber-400 transition-all block"
                        >
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md text-[10px] uppercase font-mono px-2.5 py-1 rounded-md border border-zinc-700 flex items-center gap-2">
              <Layers className="w-3 h-3 text-amber-500" />
              <span className="text-zinc-300">SCREEN 2</span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Floating Control Panel Overlay (Aesthetic Glassmorphism) */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 flex flex-col justify-between p-4 z-10 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top Header Controls bar */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2.5 items-center glass px-3.5 py-1.5 rounded-xl">
            <img src={channel.logo} alt={channel.name} className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <p className="text-zinc-100 font-medium text-xs tracking-tight">{channel.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-zinc-400">{channel.group}</span>
                {channel.rating && (
                  <span className="text-[9px] text-amber-400 font-bold bg-amber-400/10 px-1 rounded">
                    ★ {channel.rating}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Show system diagnostics */}
            <div className="hidden sm:flex flex-col text-right font-mono text-[9px] glass px-3 py-1.5 rounded-lg text-zinc-400">
              <div>PROTOCOL: <span className="text-emerald-400 font-bold">{videoStats.format}</span></div>
              <div>BUFF RATE: <span className="text-amber-500">{videoStats.bitrate}</span> | HEALTH: <span className="text-cyan-400">{videoStats.bufferHealth}</span></div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-black/70 hover:bg-red-950/40 transition-colors rounded-xl border border-white/5 text-zinc-300 hover:text-[#E50914]"
                aria-label="Close player"
              >
                <Layers className="w-4 h-4 rotate-45" />
              </button>
            )}
          </div>
        </div>

        {/* Center Buffer Alarm */}
        {!buffering && !isPlaying && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/75 p-4 rounded-full border border-zinc-800/50 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all" onClick={togglePlay}>
            <Play className="w-8 h-8 text-amber-400 translate-x-0.5" />
          </div>
        )}

        {/* Bottom Panel controls */}
        <div className="space-y-3.5">
          {/* Audio and Subtitle bar / Brightness & Volume control tracks */}
          <div className="flex flex-col gap-2 glass p-2.5 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brightness slider controller */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-zinc-400 w-16 text-right">BRIGHTNESS</span>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-[10px] font-mono text-amber-400 font-bold w-8">{brightness}%</span>
              </div>

              {/* Volume range slider */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-zinc-400 w-16 text-right">VOLUME</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                />
                <span className="text-[10px] font-mono text-red-400 font-bold w-8">{volume}%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            {/* Primary controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 rounded-xl transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                onClick={restartStream}
                className="p-2 bg-zinc-950/70 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5"
                title="Restart stream buffer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 glass px-2.5 py-1 rounded-lg text-zinc-300">
                <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-mono font-medium">{volume}%</span>
              </div>

              {/* Hardware Acceleration Indicator badge */}
              {preferences.hardwareAcceleration && (
                <div className="hidden sm:flex text-[9px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 items-center gap-1">
                  <Laptop className="w-3 h-3" /> HW ACCEL
                </div>
              )}
            </div>

            {/* Layout Mode controls (Multi-screen toggler) */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMultiScreen}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  isMultiScreenActive
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                }`}
                title="Toggle dual screen monitor view"
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                {isMultiScreenActive ? "DUAL: ACTIVE" : "MULTI-SCREEN"}
              </button>

              <button
                onClick={togglePiP}
                className="p-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors"
                title="Picture in Picture Mode"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={toggleFullScreen}
                className="p-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
