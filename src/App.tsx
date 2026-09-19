/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GridCubeCanvas } from './components/GridCubeCanvas';
import { HeaderHUD } from './components/HeaderHUD';

export default function App() {
  const [guiVisible, setGuiVisible] = useState<boolean>(true);
  const [stats, setStats] = useState<{ fps: number; polyCount: number; cameraPos: string }>({
    fps: 60,
    polyCount: 384,
    cameraPos: '(0.0, 0.0, 4.0)',
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input element (like lil-gui text/color inputs)
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setGuiVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-[#0b0b0f] overflow-hidden">
      {/* 3D Canvas */}
      <GridCubeCanvas
        guiVisible={guiVisible}
        onToggleGui={() => setGuiVisible((prev) => !prev)}
        onStatsUpdate={setStats}
      />

      {/* Top Left HUD */}
      <HeaderHUD
        fps={stats.fps}
        polyCount={stats.polyCount}
        cameraPos={stats.cameraPos}
        guiVisible={guiVisible}
        onToggleGui={() => setGuiVisible((prev) => !prev)}
      />
    </main>
  );
}
