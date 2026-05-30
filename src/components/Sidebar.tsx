import React from "react";
import { Home, Tv, Film, Clapperboard, RefreshCw, Activity, Gauge, Settings, ShieldCheck, ShieldAlert, User, Keyboard, Sparkles } from "lucide-react";
import { AppTheme } from "../types";

interface SidebarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  accountStatus: "Active" | "Expired" | "Trial";
  vpnConnected: boolean;
  activeTheme: AppTheme;
  openRemote: () => void;
  isRemoteOpen: boolean;
  language?: "fr" | "en" | "es";
}

export default function Sidebar({
  activeSection,
  onSelectSection,
  accountStatus,
  vpnConnected,
  activeTheme,
  openRemote,
  isRemoteOpen,
  language = "en"
}: SidebarProps) {
  // Theme color accents
  const getThemeAccent = () => {
    if (activeTheme === "crimson-burgundy") return "text-[#E50914] hover:bg-white/5";
    if (activeTheme === "royal-gold") return "text-amber-400 hover:bg-amber-900/20";
    return "text-cyan-400 hover:bg-zinc-800/40";
  };

  const getActiveBg = (section: string) => {
    if (activeSection === section) {
      if (activeTheme === "crimson-burgundy") return "active-nav text-white shadow-[0_0_15px_rgba(229,9,20,0.15)]";
      if (activeTheme === "royal-gold") return "bg-amber-950/40 border-l-4 border-amber-400 text-amber-300";
      return "bg-zinc-800/60 border-l-4 border-cyan-400 text-cyan-300";
    }
    return "text-zinc-400 hover:text-white hover:bg-[#FFFFFF]/5 border-l-4 border-transparent";
  };

  const getNavLabel = (id: string, defaultLabel: string) => {
    if (language === "fr") {
      switch (id) {
        case "home": return "ACCUEIL";
        case "live-tv": return "TÉLÉ DIRECT";
        case "vod": return "FILMS VOD";
        case "series": return "SÉRIES TV";
        case "catchup": return "REPLAY";
        case "ai-assistant": return "ASSISTANT IA";
        case "vpn": return "VPN SÉCURISÉ";
        case "speedtest": return "VITESSE";
        case "settings": return "RÉGLAGES";
        default: return defaultLabel;
      }
    }
    if (language === "es") {
      switch (id) {
        case "home": return "ACCESO PRINCIPAL";
        case "live-tv": return "TELEVISIÓN EN VIVO";
        case "vod": return "PELÍCULAS (VOD)";
        case "series": return "SERIES COMPLETAS";
        case "catchup": return "REPRODUCIR REPLAY";
        case "ai-assistant": return "ASISTENTE IA";
        case "vpn": return "VPN SEGURA";
        case "speedtest": return "PRUEBA DE VELOCIDAD";
        case "settings": return "PRÉFÉRENCES GENERAL";
        default: return defaultLabel;
      }
    }
    return defaultLabel;
  };

  const navItems = [
    { id: "home", defaultLabel: "HOME HUB", icon: Home },
    { id: "live-tv", defaultLabel: "LIVE TV", icon: Tv },
    { id: "vod", defaultLabel: "MOVIES (VOD)", icon: Film },
    { id: "series", defaultLabel: "TV SERIES", icon: Clapperboard },
    { id: "catchup", defaultLabel: "CATCH-UP", icon: RefreshCw },
    { id: "ai-assistant", defaultLabel: "AI ASSISTANT", icon: Sparkles, badge: "NEW" },
    { id: "vpn", defaultLabel: "INTEGRATED VPN", icon: Activity, badge: vpnConnected ? "SECURE" : "OFF" },
    { id: "speedtest", defaultLabel: "SPEED TEST", icon: Gauge },
    { id: "settings", defaultLabel: "PREFERENCES", icon: Settings },
  ];

  return (
    <div className="w-64 glass flex flex-col justify-between h-full py-6 select-none flex-shrink-0 z-10">
      {/* Branding Header Area */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <img src="/assets/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-display font-extrabold text-sm tracking-widest text-white">
            WATCH<span className="text-[#E50914]">NOW24</span>
          </span>
        </div>
        <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-500 pl-9">
          PREMIUM IPTV PLAYER
        </p>
      </div>

      {/* Primary Navigation Hub */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 custom-scrollbar">
        {navItems.map(item => {
          const IconComponent = item.icon;
          const translatedLabel = getNavLabel(item.id, item.defaultLabel);
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-lg font-mono text-[10px] font-bold tracking-wider transition-all text-left ${getActiveBg(item.id)}`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className="w-4 h-4" />
                <span>{translatedLabel}</span>
              </div>
              {item.badge && (
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  item.badge === "SECURE" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account Info Quick Glance footer */}
      <div className="px-4 mt-6 pt-5 border-t border-zinc-900 space-y-4">
        {/* Virtual Remote Toggler button */}
        <button
          onClick={openRemote}
          className={`w-full flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-850 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-mono font-bold uppercase tracking-widest ${
            isRemoteOpen ? "border-red-500/50 text-red-400" : ""
          }`}
        >
          <Keyboard className="w-4 h-4" />
          {isRemoteOpen 
            ? (language === "fr" ? "FERMER MANETTE" : language === "es" ? "CERRAR MANDO" : "CLOSE REMOTE")
            : (language === "fr" ? "TÉLÉCOMMANDE VIRT." : language === "es" ? "MANDO VIRTUAL" : "TV REMOTE EMUL")
          }
        </button>

        <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-zinc-500">
              {language === "fr" ? "STATUT SUR COMPTE:" : language === "es" ? "ESTADO DE CUENTA:" : "ACCOUNT STATUS:"}
            </span>
            <span className={`font-bold uppercase ${accountStatus === "Active" ? "text-emerald-400" : "text-amber-500"}`}>
              {accountStatus === "Active" 
                ? (language === "fr" ? "ACTIF" : language === "es" ? "ACTIVO" : "ACTIVE")
                : accountStatus
              }
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono mt-1 w-full">
            <span className="text-zinc-400 truncate">
              {language === "fr" ? "DÉSYNCHRONISER:" : language === "es" ? "DESASIGNAR EPG:" : "RE-SYNC METERS:"}
            </span>
            <span className="text-zinc-500">AUTO-EPG</span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[9px] font-mono text-zinc-650 text-zinc-650">
            WATCHNOW24 ENGINE V2.5a
          </span>
        </div>
      </div>
    </div>
  );
}
