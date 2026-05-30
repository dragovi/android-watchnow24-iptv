import React, { useState } from "react";
import { VpnNode } from "../types";
import { DEMO_VPN_NODES } from "../data";
import { ShieldAlert, ShieldCheck, Power, RefreshCw, Key, Network, Globe, Plus, FolderPlus, Radio } from "lucide-react";

interface VpnSectionProps {
  onStatusChange?: (isConnected: boolean, activeNode: VpnNode | null) => void;
}

export default function VpnSection({ onStatusChange }: VpnSectionProps) {
  const [nodes, setNodes] = useState<VpnNode[]>(DEMO_VPN_NODES);
  const [selectedNode, setSelectedNode] = useState<VpnNode>(DEMO_VPN_NODES[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Secure Settings states
  const [killSwitch, setKillSwitch] = useState(true);
  const [dnsProtection, setDnsProtection] = useState(true);

  // Custom VPN node registration input states (vrai inputs)
  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newFlag, setNewFlag] = useState("🌐");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");
  const [registerErrorMsg, setRegisterErrorMsg] = useState("");

  const toggleConnection = async () => {
    if (isConnected) {
      // Disconnecting process
      setIsConnected(false);
      if (onStatusChange) onStatusChange(false, null);
    } else {
      // Connecting process with active animation loading delay
      setIsConnecting(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnecting(false);
      setIsConnected(true);
      if (onStatusChange) onStatusChange(true, selectedNode);
    }
  };

  const selectNode = (node: VpnNode) => {
    setSelectedNode(node);
    if (isConnected) {
      // Restart connection with new IP
      setIsConnected(false);
      setIsConnecting(true);
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        if (onStatusChange) onStatusChange(true, node);
      }, 1000);
    }
  };

  const refreshPings = () => {
    // Randomize ping fluctuations simulating real network state updates
    setNodes(prev => prev.map(n => ({
      ...n,
      ping: Math.max(5, n.ping + Math.floor(Math.random() * 8) - 4),
      load: Math.min(99, Math.max(5, n.load + Math.floor(Math.random() * 6) - 3))
    })));
  };

  // Real Custom VPN node registration (vrai inputs)
  const handleRegisterNode = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSuccessMsg("");
    setRegisterErrorMsg("");

    if (!newCountry.trim() || !newCity.trim() || !newIp.trim()) {
      setRegisterErrorMsg("Please specify Country, City and target Server IP Address");
      return;
    }

    // IP Validation check
    const ipRegEx = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegEx.test(newIp.trim())) {
      setRegisterErrorMsg("Please enter a valid IPv4 address (e.g. 195.154.22.45)");
      return;
    }

    const newNode: VpnNode = {
      id: "custom_" + Date.now(),
      country: newCountry.trim(),
      city: newCity.trim(),
      flag: newFlag,
      ip: newIp.trim(),
      ping: Math.floor(Math.random() * 35) + 10, // Simulated initial latency
      load: Math.floor(Math.random() * 30) + 10, // Simulated initial load
      premium: false
    };

    setNodes(prev => [newNode, ...prev]);
    setSelectedNode(newNode);
    setRegisterSuccessMsg(`Successfully provisioned server gateway in ${newNode.city}!`);

    // Reset inputs
    setNewCountry("");
    setNewCity("");
    setNewIp("");
    setNewFlag("🌐");

    // Auto-update parent state if already connected
    if (isConnected && onStatusChange) {
      onStatusChange(true, newNode);
    }

    setTimeout(() => {
      setRegisterSuccessMsg("");
    }, 4000);
  };

  return (
    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Absolute design aesthetic background elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-950/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Card: Core Power Control (NordVPN circular feel) */}
        <div className="w-full lg:w-5/12 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80 flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase">
              SECURE BUFFER HOOD
            </span>
            <div className={`p-1.5 rounded-lg border text-[9px] uppercase font-mono px-2.5 font-bold flex items-center gap-1.5 ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              <Network className="w-3.5 h-3.5" />
              {isConnected ? "SECURED IN" : "UNPROTECTED"}
            </div>
          </div>

          {/* Central Power Ring Toggler */}
          <div className="my-6 relative">
            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
              isConnected ? "bg-emerald-500/25 scale-110" : isConnecting ? "bg-cyan-500/20 animate-pulse scale-105" : "bg-red-900/10 scale-90"
            }`}></div>

            <button
              onClick={toggleConnection}
              disabled={isConnecting}
              className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-all active:scale-95 duration-500 cursor-pointer ${
                isConnected
                  ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-200/20 text-white"
                  : isConnecting
                  ? "bg-zinc-900 border-cyan-400/50 text-cyan-400 animate-pulse"
                  : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              <Power className={`w-10 h-10 transition-transform duration-500 ${isConnecting ? "rotate-180" : ""}`} />
              <span className="text-[10px] uppercase font-mono font-bold mt-1.5 tracking-wider">
                {isConnected ? "PROTECTED" : isConnecting ? "SHIELDING" : "CONNECT"}
              </span>
            </button>
          </div>

          {/* Connected state detail logs */}
          <div className="w-full space-y-2 mt-4 text-left">
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex justify-between text-xs font-mono">
              <span className="text-zinc-500">ROUTING TUNNEL:</span>
              <span className="text-zinc-200 font-bold">{selectedNode.country} ({selectedNode.city})</span>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex justify-between text-xs font-mono">
              <span className="text-zinc-500">ENCRYPTED IP:</span>
              <span className="text-emerald-400 font-bold">{isConnected ? selectedNode.ip : "Direct Broadcast IP"}</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Nodes checklist selector & Firewall settings */}
        <div className="w-full lg:w-7/12 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-zinc-400" />
                <h4 className="text-xs font-mono font-bold tracking-wider text-zinc-300">HIGH-SPEED GATEWAYS</h4>
              </div>
              <button
                onClick={refreshPings}
                className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Refresh routing latencies"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of geo instances */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 select-none custom-scrollbar scrollbar-thin">
              {nodes.map(node => {
                const isSelected = selectedNode.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => selectNode(node)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-zinc-900 border-amber-500/40 text-amber-400"
                        : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 whitespace-nowrap truncate">
                      <span className="text-lg">{node.flag}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold font-medium flex items-center gap-1 truncate text-white">
                          <span className="truncate">{node.country}</span>
                          {node.premium && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-500 font-bold px-1 rounded uppercase tracking-widest border border-amber-500/20 flex-shrink-0">
                              PRO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">{node.city}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right font-mono flex-shrink-0">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold">
                          {node.ping}ms
                        </div>
                        <div className="text-[9px] text-zinc-500">STABILITY</div>
                      </div>

                      <div className="w-16">
                        <div className="text-[10px] text-zinc-400 font-semibold">{node.load}%</div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full ${node.load > 70 ? "bg-red-500" : node.load > 40 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${node.load}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Form for Custom Gateway Input ("Vrai input") */}
          <div className="bg-zinc-900/30 p-4 border border-zinc-800 rounded-xl space-y-3">
            <h4 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400" /> REGISTER PERSONAL SPECIALIST VPN PROXY
            </h4>
            
            <form onSubmit={handleRegisterNode} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 block uppercase">Country Name</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    placeholder="e.g. France"
                    className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1.5 rounded text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-550"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 block uppercase">City Location</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Paris"
                    className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1.5 rounded text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-550"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[9px] font-mono text-zinc-500 block uppercase">IPv4 Server Address</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="e.g. 195.154.22.45"
                    className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1.5 rounded text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-550 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 block uppercase">Flag Emoji</label>
                  <select
                    value={newFlag}
                    onChange={(e) => setNewFlag(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 px-2 py-1.5 rounded text-xs text-white focus:outline-none"
                  >
                    <option value="🌐">🌐 Geo-Link</option>
                    <option value="🇫🇷">🇫🇷 FR</option>
                    <option value="🇺🇸">🇺🇸 US</option>
                    <option value="🇨🇦">🇨🇦 CA</option>
                    <option value="🇩🇪">🇩🇪 DE</option>
                    <option value="🇬🇧">🇬🇧 GB</option>
                    <option value="🇪🇸">🇪🇸 ES</option>
                    <option value="🇨🇭">🇨🇭 CH</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-zinc-900 border border-cyan-400/20 hover:border-cyan-400/60 hover:bg-zinc-850 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> PROVISION CONFIG TUNNEL
              </button>
            </form>

            {registerSuccessMsg && (
              <p className="text-[9px] text-emerald-400 font-mono text-center animate-pulse">{registerSuccessMsg}</p>
            )}
            {registerErrorMsg && (
              <p className="text-[9px] text-red-400 font-mono text-center animate-pulse">{registerErrorMsg}</p>
            )}
          </div>

          {/* Firewall Settings Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
            {/* Kill switch toggle */}
            <div className="flex items-center justify-between bg-zinc-900/20 p-3 rounded-lg border border-zinc-805 border-zinc-800">
              <div>
                <h5 className="text-[11px] font-mono text-zinc-300 font-bold uppercase">KILL SWITCH SHIELD</h5>
                <p className="text-[10px] text-zinc-500 mt-0.5">Blocks traffic during disconnects</p>
              </div>
              <button
                onClick={() => setKillSwitch(!killSwitch)}
                className={`w-10 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${
                  killSwitch ? "bg-emerald-600" : "bg-zinc-800"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${killSwitch ? "translate-x-4" : "translate-x-0"}`}></div>
              </button>
            </div>

            {/* DNS Protection toggle */}
            <div className="flex items-center justify-between bg-zinc-900/20 p-3 rounded-lg border border-zinc-805 border-zinc-800">
              <div>
                <h5 className="text-[11px] font-mono text-zinc-300 font-bold uppercase">DNS LEAK DEFENSE</h5>
                <p className="text-[10px] text-zinc-500 mt-0.5">Encrypts ISP server requests</p>
              </div>
              <button
                onClick={() => setDnsProtection(!dnsProtection)}
                className={`w-10 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${
                  dnsProtection ? "bg-emerald-600" : "bg-zinc-800"
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${dnsProtection ? "translate-x-4" : "translate-x-0"}`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
