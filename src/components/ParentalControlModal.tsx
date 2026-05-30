import React, { useState } from "react";
import { ParentalControlConfig } from "../types";
import { Lock, Unlock, ShieldAlert, KeyRound, AlertTriangle } from "lucide-react";

interface ParentalControlModalProps {
  config: ParentalControlConfig;
  onSave: (config: ParentalControlConfig) => void;
  categories: string[];
}

export default function ParentalControlModal({ config, onSave, categories }: ParentalControlModalProps) {
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [pinCode, setPinCode] = useState(config.pinCode);
  const [blockedCategories, setBlockedCategories] = useState<string[]>(config.blockedCategories);

  const [inputPin, setInputPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(!config.isEnabled); // If disabled, no need to unlock first
  const [errorMsg, setErrorMsg] = useState("");

  const handleUnlockCheck = () => {
    if (inputPin === config.pinCode) {
      setIsUnlocked(true);
      setErrorMsg("");
    } else {
      setErrorMsg("Incorrect secret PIN. Access denied.");
    }
  };

  const toggleCategoryBlock = (cat: string) => {
    setBlockedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveConfig = () => {
    if (isEnabled && pinCode.length !== 4) {
      setErrorMsg("PIN must be exactly 4 digits");
      return;
    }

    const updatedConfig: ParentalControlConfig = {
      isEnabled,
      pinCode: newPin.length === 4 ? newPin : pinCode,
      blockedCategories: isEnabled ? blockedCategories : [],
    };

    onSave(updatedConfig);
    setErrorMsg("Security configurations applied safely.");
    setTimeout(() => {
      setErrorMsg("");
    }, 2000);
  };

  return (
    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/80 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-red-500 animate-pulse" />
        <h3 className="text-lg font-bold tracking-tight text-white">Parental Security Vault</h3>
      </div>

      {/* Verification overlay if enabled and not currently unlocked */}
      {!isUnlocked && config.isEnabled ? (
        <div className="p-4 bg-zinc-900 rounded-xl border border-red-950/20 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-zinc-200">VAULT LOCK ACTIVE</h4>
            <p className="text-[11px] text-zinc-500 mt-1">Provide your 4-Digit administrative PIN to manage security policies.</p>
          </div>

          <div className="max-w-[180px] mx-auto flex gap-1.5 items-center justify-center">
            <input
              type="password"
              maxLength={4}
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full bg-zinc-950 text-center text-lg tracking-widest font-mono border border-zinc-800 rounded-lg p-2 text-white focus:outline-none focus:border-red-505 focus:border-red-500"
            />
            <button
              onClick={handleUnlockCheck}
              className="bg-red-700 hover:bg-red-600 font-mono text-[10px] uppercase font-bold tracking-wider text-white rounded-lg p-2.5 transition-all"
            >
              UNLOCK
            </button>
          </div>

          {errorMsg && <p className="text-[10px] text-red-400 font-mono">{errorMsg}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Controls toggle */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-850 border-zinc-800">
            <div>
              <p className="text-xs font-bold text-zinc-200">ENABLE GATEKEEPER LOCK</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Encrypts selected categories, preventing loading without PIN verification</p>
            </div>
            <button
              onClick={() => {
                setIsEnabled(!isEnabled);
                if (!isEnabled) {
                  setIsUnlocked(true);
                }
              }}
              className={`w-10 h-6 rounded-full p-1 transition-all ${isEnabled ? "bg-red-600" : "bg-zinc-800"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? "translate-x-4" : "translate-x-0"}`}></div>
            </button>
          </div>

          {isEnabled && (
            <>
              {/* Category block checkers */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest block">
                  BLOCKED NETWORK CATEGORIES:
                </label>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 select-none custom-scrollbar scrollbar-thin">
                  {categories.map(cat => {
                    const isBlocked = blockedCategories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => toggleCategoryBlock(cat)}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isBlocked
                            ? "bg-red-950/20 border-red-900/40 text-red-400"
                            : "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                        }`}
                      >
                        <span>{cat}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${isBlocked ? "border-red-400 bg-red-400/10 font-bold" : "border-zinc-700"}`}>
                          {isBlocked ? "✓" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Set custom PIN */}
              <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex gap-2 items-center">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-200">CHANGE ADMIN PIN CODE</span>
                </div>
                <div className="flex gap-3">
                  <div className="w-1/2">
                    <span className="text-[9px] font-mono text-zinc-500">CURRENT PIN</span>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-center text-xs text-zinc-300 font-mono select-all">
                      {pinCode}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <span className="text-[9px] font-mono text-zinc-500">NEW 4-DIGIT PIN</span>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full bg-zinc-950 text-center border border-zinc-800 rounded-lg p-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Default PIN is 0000
            </span>

            <button
              onClick={handleSaveConfig}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 text-[10px] font-mono uppercase font-bold tracking-wider px-4 py-2 rounded-lg transition-all"
            >
              SAVE VAULT POLICIES
            </button>
          </div>

          {errorMsg && <p className="text-[10px] text-amber-400 text-center font-mono animate-bounce">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
}
