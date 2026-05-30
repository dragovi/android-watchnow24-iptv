import React from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Undo2, Home, Volume1, VolumeX, Radio } from "lucide-react";

export default function VirtualTvRemote() {
  const triggerKeyEvent = (key: string) => {
    // Dispatch authentic keydown event directly into the active browser page DOM
    const event = new KeyboardEvent("keydown", {
      key: key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-zinc-950 p-4 rounded-3xl border border-zinc-800 shadow-2xl w-48 text-center flex flex-col justify-between select-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-12 bg-red-900/10 rounded-full blur-xl"></div>

      {/* Controller header */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-1 bg-zinc-800 rounded-full mb-3"></div>
        <div className="flex justify-between items-center w-full px-2.5">
          <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500 font-extrabold flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-red-500 animate-ping" /> TELECOM-OS
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow shadow-red-500/55"></div>
        </div>
      </div>

      {/* D-Pad controls Ring */}
      <div className="my-6 relative w-36 h-36 mx-auto bg-zinc-900/90 rounded-full border border-zinc-800 shadow-inner flex items-center justify-center">
        {/* Navigation buttons */}
        <button
          onClick={() => triggerKeyEvent("ArrowUp")}
          className="absolute top-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all p-1.5 rounded-full"
          title="Arrow Up"
        >
          <ArrowUp className="w-5 h-5 text-zinc-450" />
        </button>

        <button
          onClick={() => triggerKeyEvent("ArrowLeft")}
          className="absolute left-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all p-1.5 rounded-full"
          title="Arrow Left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => triggerKeyEvent("Enter")}
          className="w-14 h-14 bg-gradient-to-tr from-burgundy-950/70 to-zinc-850 hover:from-amber-600 hover:to-amber-500 hover:text-zinc-950 border border-zinc-700/60 shadow-md text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center active:scale-90 transition-transform tracking-widest uppercase"
          title="Enter / OK"
        >
          OK
        </button>

        <button
          onClick={() => triggerKeyEvent("ArrowRight")}
          className="absolute right-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all p-1.5 rounded-full"
          title="Arrow Right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => triggerKeyEvent("ArrowDown")}
          className="absolute bottom-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all p-1.5 rounded-full"
          title="Arrow Down"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Quick Action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Back option */}
        <button
          onClick={() => triggerKeyEvent("Escape")}
          className="flex flex-col items-center justify-center py-2.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
          title="Back / Escape key"
        >
          <Undo2 className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] font-mono uppercase tracking-widest font-semibold">Back</span>
        </button>

        {/* Home option */}
        <button
          onClick={() => triggerKeyEvent("Home")}
          className="flex flex-col items-center justify-center py-2.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
          title="Home View"
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[8px] font-mono uppercase tracking-widest font-semibold">Home</span>
        </button>
      </div>

      {/* Volume / Audio togglers */}
      <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850 border-zinc-800 flex justify-between items-center gap-1.5 text-zinc-400">
        <button
          onClick={() => triggerKeyEvent("-")}
          className="p-1 hover:bg-zinc-800 rounded hover:text-white font-mono font-bold"
          title="Volume Down"
        >
          VOL-
        </button>
        <Volume1 className="w-3.5 h-3.5 text-zinc-500" />
        <button
          onClick={() => triggerKeyEvent("+")}
          className="p-1 hover:bg-zinc-800 rounded hover:text-white font-mono font-bold"
          title="Volume Up"
        >
          VOL+
        </button>
      </div>

      <div className="text-[8px] font-mono text-zinc-600 mt-3 uppercase tracking-wider">
        WATCHNOW24 SMART D-PAD
      </div>
    </div>
  );
}
