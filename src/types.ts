export type GeometryShape =
  | 'hexagon'
  | 'hexagonal-pyramid'
  | 'pentagon'
  | 'pentagonal-pyramid'
  | 'dodecahedron'
  | 'icosahedron'
  | 'torus-knot'
  | 'octagon'
  | 'triangle'
  | 'triangular-prism'
  | 'triangular-pyramid'
  | 'cube'
  | 'sphere'
  | 'torus'
  | 'cylinder'
  | 'octahedron';

export type GridPatternType = 'hexagonal' | 'triangular' | 'square' | 'radial';

export interface CubeSceneParams {
  // Texture
  patternType: GridPatternType;
  tiling: number;
  gridDivisions: number;
  gridLineWidth: number;
  dotRadius: number;
  lineColor: string;
  dotColor: string;
  baseColor: string;

  // Material
  bumpScale: number;
  roughness: number;
  metalness: number;
  wireframe: boolean;

  // Geometry
  geometryType: GeometryShape;

  // Vector Solution Overlays
  showVectorEdges: boolean;
  vectorEdgeColor: string;
  vectorEdgeOpacity: number;
  showNormalVectors: boolean;
  normalVectorLength: number;
  normalVectorColor: string;
  showAxesVectors: boolean;
  axesVectorLength: number;
  showVertexNodes: boolean;
  vertexNodeSize: number;
  vertexNodeColor: string;

  // Lighting
  ambientIntensity: number;
  ambientColor: string;
  pointLightIntensity: number;
  pointLightColor: string;
  fillLightIntensity: number;
  fillLightColor: string;

  // Motion
  autoRotate: boolean;
  rotationSpeedX: number;
  rotationSpeedY: number;

  // Background
  backgroundColor: string;
  showParticles: boolean;
}

export interface PresetTheme {
  id: string;
  name: string;
  lineColor: string;
  dotColor: string;
  baseColor: string;
  pointLightColor: string;
  fillLightColor: string;
  backgroundColor: string;
  bumpScale: number;
  metalness: number;
  roughness: number;
}
