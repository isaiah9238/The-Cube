import React from 'react';
import { Hexagon, Eye, Sparkles, Layers, Sliders } from 'lucide-react';

interface HeaderHUDProps {
  fps: number;
  polyCount: number;
  cameraPos: string;
  guiVisible: boolean;
  onToggleGui: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  fps,
  polyCount,
  cameraPos,
  guiVisible,
  onToggleGui,
}) => {
  return (
    <header className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-2.5">
      {/* Title Badge */}
      <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-xl">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Hexagon className="w-4 h-4 fill-cyan-400/20" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight">3D Polyhedra & Grid Studio</h1>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
              <Sparkles className="w-2.5 h-2.5" /> PBR + Vector
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-normal">Vector Overlays, Surface Normals, Procedural Bump Maps & SVG Export</p>
        </div>
      </div>

      {/* Telemetry / Live Metrics */}
      <div className="pointer-events-auto flex items-center gap-2 font-mono text-[11px] text-slate-400">
        <div className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-200 font-medium">{fps > 0 ? fps : 60}</span>
          <span className="text-slate-400 text-[10px]">FPS</span>
        </div>

        <div className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-lg flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-200">{polyCount || 384}</span>
          <span className="text-slate-400 text-[10px]">Polys</span>
        </div>

        <div className="hidden sm:flex px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-lg items-center gap-1.5">
          <Eye className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-300 text-[10px]">{cameraPos || '(0.0, 0.0, 4.0)'}</span>
        </div>

        <button
          onClick={onToggleGui}
          className="pointer-events-auto px-2.5 py-1 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-lg flex items-center gap-1 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Toggle lil-gui Scene Controls panel"
        >
          <Sliders className="w-3 h-3" />
          <span className="text-[10px]">{guiVisible ? 'Hide GUI' : 'Controls'}</span>
        </button>
      </div>

      {/* Navigation hint */}
      <div className="hidden md:block pointer-events-none text-[10px] text-slate-400 pl-1 font-mono tracking-tight">
        Left-drag to rotate · Scroll to zoom · Right-drag to pan
      </div>
    </header>
  );
};
