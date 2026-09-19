import { CubeSceneParams, PresetTheme } from './types';

export const DEFAULT_PARAMS: CubeSceneParams = {
  // Texture
  patternType: 'hexagonal',
  tiling: 2,
  gridDivisions: 6,
  gridLineWidth: 3.5,
  dotRadius: 3.5,
  lineColor: '#00ffff',
  dotColor: '#38bdf8',
  baseColor: '#0d1117',

  // Material
  bumpScale: 0.1,
  roughness: 0.28,
  metalness: 0.75,
  wireframe: false,

  // Geometry
  geometryType: 'hexagon',

  // Vector Solution Overlays
  showVectorEdges: true,
  vectorEdgeColor: '#38bdf8',
  vectorEdgeOpacity: 0.85,
  showNormalVectors: false,
  normalVectorLength: 0.35,
  normalVectorColor: '#f43f5e',
  showAxesVectors: false,
  axesVectorLength: 2.2,
  showVertexNodes: true,
  vertexNodeSize: 0.05,
  vertexNodeColor: '#00ffff',

  // Lights
  ambientIntensity: 0.5,
  ambientColor: '#ffffff',
  pointLightIntensity: 2.0,
  pointLightColor: '#00e5ff',
  fillLightIntensity: 1.2,
  fillLightColor: '#7c3aed',

  // Motion
  autoRotate: true,
  rotationSpeedX: 0.005,
  rotationSpeedY: 0.007,

  // Background
  backgroundColor: '#0b0b0f',
  showParticles: true,
};

export const PRESETS: PresetTheme[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Cyan',
    lineColor: '#00ffff',
    dotColor: '#38bdf8',
    baseColor: '#0d1117',
    pointLightColor: '#00e5ff',
    fillLightColor: '#7c3aed',
    backgroundColor: '#0b0b0f',
    bumpScale: 0.08,
    metalness: 0.7,
    roughness: 0.3,
  },
  {
    id: 'matrix',
    name: 'Matrix Emerald',
    lineColor: '#10b981',
    dotColor: '#34d399',
    baseColor: '#04150c',
    pointLightColor: '#34d399',
    fillLightColor: '#064e3b',
    backgroundColor: '#030e08',
    bumpScale: 0.1,
    metalness: 0.8,
    roughness: 0.25,
  },
  {
    id: 'solar',
    name: 'Solar Amber',
    lineColor: '#f59e0b',
    dotColor: '#fcd34d',
    baseColor: '#181005',
    pointLightColor: '#fbbf24',
    fillLightColor: '#dc2626',
    backgroundColor: '#0e0a04',
    bumpScale: 0.09,
    metalness: 0.75,
    roughness: 0.28,
  },
  {
    id: 'synthwave',
    name: 'Synthwave Violet',
    lineColor: '#ec4899',
    dotColor: '#f472b6',
    baseColor: '#160822',
    pointLightColor: '#d946ef',
    fillLightColor: '#3b82f6',
    backgroundColor: '#0c0414',
    bumpScale: 0.08,
    metalness: 0.65,
    roughness: 0.32,
  },
  {
    id: 'obsidian',
    name: 'Obsidian Platinum',
    lineColor: '#e2e8f0',
    dotColor: '#ffffff',
    baseColor: '#0f172a',
    pointLightColor: '#f8fafc',
    fillLightColor: '#475569',
    backgroundColor: '#080c14',
    bumpScale: 0.06,
    metalness: 0.85,
    roughness: 0.2,
  },
  {
    id: 'blueprint',
    name: 'Blueprint Cobalt',
    lineColor: '#38bdf8',
    dotColor: '#93c5fd',
    baseColor: '#082f49',
    pointLightColor: '#38bdf8',
    fillLightColor: '#1d4ed8',
    backgroundColor: '#041d33',
    bumpScale: 0.07,
    metalness: 0.5,
    roughness: 0.4,
  },
];
