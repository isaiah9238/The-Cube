import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { CubeSceneParams, GeometryShape, GridPatternType } from '../types';
import { DEFAULT_PARAMS, PRESETS } from '../presets';

export interface ShapeDefinition {
  id: GeometryShape;
  label: string;
  icon: string;
  category: 'continuous' | 'prisms' | 'pyramids' | 'platonic' | 'curved';
  desc: string;
}

export const ALL_SHAPES: ShapeDefinition[] = [
  // Continuous & Minimal Surfaces
  { id: 'mobius-strip', label: 'Möbius Strip', icon: '♾️', category: 'continuous', desc: 'Non-orientable continuous single-sided ribbon' },
  { id: 'klein-bottle', label: 'Klein Bottle', icon: '🍾', category: 'continuous', desc: 'Figure-8 continuous 4D immersion' },
  { id: 'enneper-surface', label: 'Enneper Surface', icon: '𑁍', category: 'continuous', desc: 'Self-intersecting minimal surface with H=0' },
  { id: 'catenoid', label: 'Catenoid', icon: '⧗', category: 'continuous', desc: 'Continuous minimal surface of revolution' },
  { id: 'hyperbolic-paraboloid', label: 'Saddle (HyPar)', icon: '∿', category: 'continuous', desc: 'Continuous doubly ruled saddle surface' },
  { id: 'monkey-saddle', label: 'Monkey Saddle', icon: '☘', category: 'continuous', desc: 'Tri-directional continuous saddle z=x³-3xy²' },

  // Prisms & Polygons
  { id: 'hexagon', label: 'Hexagon', icon: '⬡', category: 'prisms', desc: '6-sided regular hexagonal prism' },
  { id: 'pentagon', label: 'Pentagon', icon: '⬠', category: 'prisms', desc: '5-sided regular pentagonal prism' },
  { id: 'octagon', label: 'Octagon', icon: '⯃', category: 'prisms', desc: '8-sided regular octagonal prism' },
  { id: 'triangle', label: '3D Triangle', icon: '▲', category: 'prisms', desc: 'Equilateral deltahedron tetrahedron' },
  { id: 'triangular-prism', label: 'Tri Prism', icon: '⏢', category: 'prisms', desc: '3-sided extruded prism' },
  { id: 'cube', label: 'Cube', icon: '▣', category: 'prisms', desc: '6-sided regular hexahedron' },
  { id: 'cylinder', label: 'Cylinder', icon: '⌸', category: 'prisms', desc: 'Smooth cylindrical prism' },

  // Pyramids
  { id: 'hexagonal-pyramid', label: 'Hex Pyramid', icon: '⬡▲', category: 'pyramids', desc: '6-sided pyramid with apex' },
  { id: 'pentagonal-pyramid', label: 'Pent Pyramid', icon: '⬠▲', category: 'pyramids', desc: '5-sided pyramid with apex' },
  { id: 'triangular-pyramid', label: 'Tri Pyramid', icon: '▲▲', category: 'pyramids', desc: '3-sided pyramid with apex' },

  // Platonic & Geodesic Solids
  { id: 'dodecahedron', label: 'Dodecahedron', icon: '⬡', category: 'platonic', desc: '12 pentagonal faces (Platonic solid)' },
  { id: 'icosahedron', label: 'Icosahedron', icon: '◈', category: 'platonic', desc: '20 triangular faces (Geodesic)' },
  { id: 'octahedron', label: 'Octahedron', icon: '◇', category: 'platonic', desc: '8 triangular faces (Platonic solid)' },

  // Curved & Knots
  { id: 'torus-knot', label: 'Torus Knot', icon: '꩜', category: 'curved', desc: 'Complex (2,3) mathematical cyber knot' },
  { id: 'torus', label: 'Torus', icon: '◎', category: 'curved', desc: 'Smooth geometric ring torus' },
  { id: 'sphere', label: 'Sphere', icon: '○', category: 'curved', desc: 'Symmetrical 3D UV sphere' },
];

export const PATTERN_LIST: { id: GridPatternType; label: string; icon: string }[] = [
  { id: 'hexagonal', label: 'Honeycomb', icon: '⬡' },
  { id: 'triangular', label: 'Delta Tri', icon: '▲' },
  { id: 'radial', label: 'Radial Radar', icon: '◎' },
  { id: 'square', label: 'Square Grid', icon: '⊞' },
];

interface GridCubeCanvasProps {
  onStatsUpdate?: (stats: { fps: number; polyCount: number; cameraPos: string }) => void;
  guiVisible: boolean;
  onToggleGui: () => void;
}

export const GridCubeCanvas: React.FC<GridCubeCanvasProps> = ({
  onStatsUpdate,
  guiVisible,
  onToggleGui,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const guiContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    cube: THREE.Mesh;
    geometry: THREE.BufferGeometry;
    material: THREE.MeshStandardMaterial;
    gridTexture: THREE.CanvasTexture;
    bumpTexture: THREE.CanvasTexture;
    ambientLight: THREE.AmbientLight;
    pointLight: THREE.PointLight;
    fillLight: THREE.PointLight;
    pointLightHelper?: THREE.Mesh;
    fillLightHelper?: THREE.Mesh;
    particleSystem?: THREE.Points;
    vectorEdgesMesh: THREE.LineSegments;
    normalVectorsMesh: THREE.LineSegments;
    axesVectorsMesh: THREE.AxesHelper;
    vertexNodesPoints: THREE.Points;
    params: CubeSceneParams;
    gui: GUI;
    updateTextures: () => void;
    updateGeometry: (type: GeometryShape) => void;
    updateVectorOverlays: () => void;
    applyPreset: (presetId: string) => void;
    resetDefaults: () => void;
    takeScreenshot: () => void;
    exportVectorSVG: () => void;
  } | null>(null);

  const [activePreset, setActivePreset] = useState<string>('cyberpunk');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [wireframeActive, setWireframeActive] = useState<boolean>(false);
  const [selectedShape, setSelectedShape] = useState<GeometryShape>('hexagon');
  const [patternType, setPatternType] = useState<GridPatternType>('hexagonal');
  const [shapeCategory, setShapeCategory] = useState<'all' | 'continuous' | 'prisms' | 'pyramids' | 'platonic' | 'curved'>('all');
  const [showShapeMenu, setShowShapeMenu] = useState<boolean>(false);

  // Vector Solution states
  const [vectorEdgesActive, setVectorEdgesActive] = useState<boolean>(true);
  const [normalVectorsActive, setNormalVectorsActive] = useState<boolean>(false);
  const [axesVectorsActive, setAxesVectorsActive] = useState<boolean>(false);
  const [vertexNodesActive, setVertexNodesActive] = useState<boolean>(true);
  const [showVectorDrawer, setShowVectorDrawer] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, and Renderer Setup
    const scene = new THREE.Scene();
    const params: CubeSceneParams = { ...DEFAULT_PARAMS };
    scene.background = new THREE.Color(params.backgroundColor);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 15;

    // 2. Procedural Texture Generator with 4 Lattice Types
    function generateCanvasTexture(isBump = false): THREE.CanvasTexture {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (!ctx) return new THREE.CanvasTexture(canvas);

      // Base fill
      ctx.fillStyle = isBump ? '#000000' : params.baseColor;
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = isBump ? '#ffffff' : params.lineColor;
      ctx.lineWidth = params.gridLineWidth;
      ctx.fillStyle = isBump ? '#ffffff' : params.dotColor;

      if (params.patternType === 'hexagonal') {
        const divisions = Math.max(2, Math.min(16, params.gridDivisions));
        const R = size / (divisions * 1.5);
        const deltaX = Math.sqrt(3) * R;
        const deltaY = 1.5 * R;

        const cols = Math.ceil(size / deltaX) + 2;
        const rows = Math.ceil(size / deltaY) + 2;

        ctx.beginPath();
        for (let r = -1; r <= rows; r++) {
          const cy = r * deltaY;
          const xOffset = r % 2 !== 0 ? deltaX / 2 : 0;

          for (let c = -1; c <= cols; c++) {
            const cx = c * deltaX + xOffset;

            for (let i = 0; i < 6; i++) {
              const angle = Math.PI / 6 + (i * Math.PI) / 3;
              const x = cx + R * Math.cos(angle);
              const y = cy + R * Math.sin(angle);
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            const firstAngle = Math.PI / 6;
            ctx.lineTo(cx + R * Math.cos(firstAngle), cy + R * Math.sin(firstAngle));
          }
        }
        ctx.stroke();

        if (params.dotRadius > 0) {
          ctx.beginPath();
          for (let r = -1; r <= rows; r++) {
            const cy = r * deltaY;
            const xOffset = r % 2 !== 0 ? deltaX / 2 : 0;
            for (let c = -1; c <= cols; c++) {
              const cx = c * deltaX + xOffset;
              if (cx >= -R && cx <= size + R && cy >= -R && cy <= size + R) {
                ctx.moveTo(cx + params.dotRadius, cy);
                ctx.arc(cx, cy, params.dotRadius, 0, Math.PI * 2);
              }
            }
          }
          ctx.fill();
        }
      } else if (params.patternType === 'triangular') {
        const divisions = Math.max(3, Math.min(24, params.gridDivisions));
        const stepY = size / divisions;
        const stepX = stepY * (2 / Math.sqrt(3));
        const cols = Math.ceil(size / stepX) + 4;
        const rows = Math.ceil(size / stepY) + 2;

        ctx.beginPath();
        for (let y = 0; y <= size + stepY; y += stepY) {
          ctx.moveTo(0, y);
          ctx.lineTo(size, y);
        }

        const diagCount = Math.ceil((size + size / Math.sqrt(3)) / stepX) + 4;
        for (let i = -diagCount; i <= diagCount; i++) {
          const startX = i * stepX;
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX + size / Math.sqrt(3), size);
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX - size / Math.sqrt(3), size);
        }
        ctx.stroke();

        if (params.dotRadius > 0) {
          ctx.beginPath();
          for (let r = 0; r <= rows; r++) {
            const y = r * stepY;
            const xOffset = (r % 2) * (stepX / 2);
            for (let c = -2; c <= cols; c++) {
              const x = c * stepX + xOffset;
              if (x >= 0 && x <= size && y >= 0 && y <= size) {
                ctx.moveTo(x + params.dotRadius, y);
                ctx.arc(x, y, params.dotRadius, 0, Math.PI * 2);
              }
            }
          }
          ctx.fill();
        }
      } else if (params.patternType === 'radial') {
        const divisions = Math.max(3, Math.min(18, params.gridDivisions));
        const cx = size / 2;
        const cy = size / 2;
        const maxR = size * 0.48;
        const ringStep = maxR / divisions;
        const spokeCount = Math.max(8, Math.min(32, divisions * 2));

        ctx.beginPath();
        for (let i = 1; i <= divisions; i++) {
          const r = i * ringStep;
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }

        for (let s = 0; s < spokeCount; s++) {
          const angle = (s * 2 * Math.PI) / spokeCount;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        }
        ctx.stroke();

        if (params.dotRadius > 0) {
          ctx.beginPath();
          for (let i = 1; i <= divisions; i++) {
            const r = i * ringStep;
            for (let s = 0; s < spokeCount; s++) {
              const angle = (s * 2 * Math.PI) / spokeCount;
              const px = cx + r * Math.cos(angle);
              const py = cy + r * Math.sin(angle);
              ctx.moveTo(px + params.dotRadius, py);
              ctx.arc(px, py, params.dotRadius, 0, Math.PI * 2);
            }
          }
          ctx.fill();
        }
      } else {
        const divisions = Math.max(2, Math.min(32, params.gridDivisions));
        const step = size / divisions;

        ctx.beginPath();
        for (let i = 0; i <= size; i += step) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, size);
          ctx.moveTo(0, i);
          ctx.lineTo(size, i);
        }
        ctx.stroke();

        if (params.dotRadius > 0) {
          ctx.beginPath();
          for (let x = 0; x <= size; x += step) {
            for (let y = 0; y <= size; y += step) {
              ctx.moveTo(x + params.dotRadius, y);
              ctx.arc(x, y, params.dotRadius, 0, Math.PI * 2);
            }
          }
          ctx.fill();
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(params.tiling, params.tiling);

      if (!isBump) {
        if ('colorSpace' in texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
        } else if ('encoding' in texture) {
          (texture as unknown as { encoding: number }).encoding = 3001;
        }
      }

      return texture;
    }

    let gridTexture = generateCanvasTexture(false);
    let bumpTexture = generateCanvasTexture(true);

    // 3. Geometry Construction Factory
    function create3DTriangleGeometry(size = 2.4): THREE.BufferGeometry {
      const a = size;
      const v0 = [0, a * Math.sqrt(2 / 3) * 0.75, 0];
      const v1 = [-a / 2, -a * Math.sqrt(2 / 3) * 0.25, a / (2 * Math.sqrt(3))];
      const v2 = [a / 2, -a * Math.sqrt(2 / 3) * 0.25, a / (2 * Math.sqrt(3))];
      const v3 = [0, -a * Math.sqrt(2 / 3) * 0.25, -a / Math.sqrt(3)];

      const positions: number[] = [
        ...v0, ...v1, ...v2,
        ...v0, ...v2, ...v3,
        ...v0, ...v3, ...v1,
        ...v1, ...v3, ...v2,
      ];

      const uvs: number[] = [
        0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
      ];

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.computeVertexNormals();

      return geo;
    }

    // Parametric Continuous Surface Generator
    function createParametricSurfaceGeometry(
      func: (u: number, v: number, target: THREE.Vector3) => void,
      slices = 72,
      stacks = 72
    ): THREE.BufferGeometry {
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const temp = new THREE.Vector3();

      for (let i = 0; i <= stacks; i++) {
        const v = i / stacks;
        for (let j = 0; j <= slices; j++) {
          const u = j / slices;
          func(u, v, temp);
          positions.push(temp.x, temp.y, temp.z);
          uvs.push(u, v);
        }
      }

      for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
          const a = i * (slices + 1) + j;
          const b = (i + 1) * (slices + 1) + j;
          const c = (i + 1) * (slices + 1) + (j + 1);
          const d = i * (slices + 1) + (j + 1);

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setIndex(indices);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      return geo;
    }

    // 1. Möbius Strip (Single-sided continuous ribbon with 180° twist)
    function createMobiusStripGeometry(): THREE.BufferGeometry {
      return createParametricSurfaceGeometry((u, v, target) => {
        const uRad = u * Math.PI * 2;
        const w = (v - 0.5) * 1.05;
        const R = 1.35;
        const halfU = uRad / 2;
        const cosHalfU = Math.cos(halfU);
        const sinHalfU = Math.sin(halfU);
        const cosU = Math.cos(uRad);
        const sinU = Math.sin(uRad);

        const x = (R + w * cosHalfU) * cosU;
        const y = (R + w * cosHalfU) * sinU;
        const z = w * sinHalfU;
        target.set(x, z, y);
      }, 96, 32);
    }

    // 2. Klein Bottle (Continuous 4D immersion figure-8 surface)
    function createKleinBottleGeometry(): THREE.BufferGeometry {
      return createParametricSurfaceGeometry((u, v, target) => {
        const uRad = u * Math.PI * 2;
        const vRad = v * Math.PI * 2;
        const r = 1.3;
        const cosU = Math.cos(uRad);
        const sinU = Math.sin(uRad);
        const cosU2 = Math.cos(uRad / 2);
        const sinU2 = Math.sin(uRad / 2);
        const sinV = Math.sin(vRad);
        const sin2V = Math.sin(2 * vRad);

        const x = (r + cosU2 * sinV - sinU2 * sin2V) * cosU;
        const y = (r + cosU2 * sinV - sinU2 * sin2V) * sinU;
        const z = sinU2 * sinV + cosU2 * sin2V;
        target.set(x * 0.85, z * 1.05, y * 0.85);
      }, 80, 80);
    }

    // 3. Enneper Surface (Self-intersecting continuous minimal surface H=0)
    function createEnneperGeometry(): THREE.BufferGeometry {
      return createParametricSurfaceGeometry((u, v, target) => {
        const uVal = (u - 0.5) * 2.3;
        const vVal = (v - 0.5) * 2.3;
        const u2 = uVal * uVal;
        const v2 = vVal * vVal;

        const x = uVal - (uVal * u2) / 3 + uVal * v2;
        const y = vVal - (vVal * v2) / 3 + vVal * u2;
        const z = u2 - v2;
        target.set(x * 0.6, z * 0.6, y * 0.6);
      }, 64, 64);
    }

    // 4. Catenoid (Continuous minimal surface of revolution)
    function createCatenoidGeometry(): THREE.BufferGeometry {
      return createParametricSurfaceGeometry((u, v, target) => {
        const uRad = u * Math.PI * 2;
        const vVal = (v - 0.5) * 2.3;
        const c = 0.72;
        const cosh = Math.cosh(vVal / c);
        const x = c * cosh * Math.cos(uRad);
        const z = c * cosh * Math.sin(uRad);
        const y = vVal * 1.15;
        target.set(x * 0.75, y, z * 0.75);
      }, 72, 48);
    }

    // 5. Hyperbolic Paraboloid (Continuous doubly ruled saddle)
    function createHyperbolicParaboloidGeometry(): THREE.BufferGeometry {
      return createParametricSurfaceGeometry((u, v, target) => {
        const xVal = (u - 0.5) * 2.4;
        const zVal = (v - 0.5) * 2.4;
        const a = 1.3;
        const b = 1.3;
        const y = ((xVal * xVal) / (a * a) - (zVal * zVal) / (b * b)) * 0.75;
        target.set(xVal * 0.85, y, zVal * 0.85);
      }, 64, 64);
    }

    // 6. Monkey Saddle (Tri-directional continuous saddle z = x³ - 3xy²)
    function createMonkeySaddleGeometry(): THREE.BufferGeometry {
      return createParametricSurfaceGeometry((u, v, target) => {
        const xVal = (u - 0.5) * 2.4;
        const zVal = (v - 0.5) * 2.4;
        const y = (Math.pow(xVal, 3) - 3 * xVal * Math.pow(zVal, 2)) * 0.32;
        target.set(xVal * 0.85, y, zVal * 0.85);
      }, 64, 64);
    }

    function createGeometry(type: GeometryShape): THREE.BufferGeometry {
      switch (type) {
        // Continuous Surfaces
        case 'mobius-strip':
          return createMobiusStripGeometry();
        case 'klein-bottle':
          return createKleinBottleGeometry();
        case 'enneper-surface':
          return createEnneperGeometry();
        case 'catenoid':
          return createCatenoidGeometry();
        case 'hyperbolic-paraboloid':
          return createHyperbolicParaboloidGeometry();
        case 'monkey-saddle':
          return createMonkeySaddleGeometry();

        // Prisms & Polygons
        case 'hexagon':
          return new THREE.CylinderGeometry(1.6, 1.6, 2.2, 6);
        case 'hexagonal-pyramid':
          return new THREE.ConeGeometry(1.6, 2.4, 6);
        case 'pentagon':
          return new THREE.CylinderGeometry(1.6, 1.6, 2.2, 5);
        case 'pentagonal-pyramid':
          return new THREE.ConeGeometry(1.6, 2.4, 5);
        case 'octagon':
          return new THREE.CylinderGeometry(1.6, 1.6, 2.2, 8);
        case 'dodecahedron':
          return new THREE.DodecahedronGeometry(1.4, 0);
        case 'icosahedron':
          return new THREE.IcosahedronGeometry(1.4, 0);
        case 'octahedron':
          return new THREE.OctahedronGeometry(1.4, 0);
        case 'triangle':
          return create3DTriangleGeometry(2.4);
        case 'triangular-prism':
          return new THREE.CylinderGeometry(1.5, 1.5, 2.2, 3);
        case 'triangular-pyramid':
          return new THREE.ConeGeometry(1.6, 2.4, 3);
        case 'torus-knot':
          return new THREE.TorusKnotGeometry(1.0, 0.34, 128, 32);
        case 'cube':
          return new THREE.BoxGeometry(2, 2, 2, 8, 8, 8);
        case 'sphere':
          return new THREE.SphereGeometry(1.35, 32, 32);
        case 'torus':
          return new THREE.TorusGeometry(1.1, 0.45, 24, 64);
        case 'cylinder':
          return new THREE.CylinderGeometry(1, 1, 2, 32);
        default:
          return new THREE.CylinderGeometry(1.6, 1.6, 2.2, 6);
      }
    }

    const geometry = createGeometry(params.geometryType);
    const material = new THREE.MeshStandardMaterial({
      map: gridTexture,
      bumpMap: bumpTexture,
      bumpScale: params.bumpScale,
      roughness: params.roughness,
      metalness: params.metalness,
      wireframe: params.wireframe,
      side: THREE.DoubleSide,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    // ==========================================
    // 4. VECTOR SOLUTION: Mathematical Vector Overlays
    // ==========================================
    // 4a. Vector Edges (Feature edges calculated with crease threshold)
    function buildEdgesGeometry(geo: THREE.BufferGeometry) {
      return new THREE.EdgesGeometry(geo, 15);
    }
    const vectorEdgesMesh = new THREE.LineSegments(
      buildEdgesGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: params.vectorEdgeColor,
        transparent: true,
        opacity: params.vectorEdgeOpacity,
        linewidth: 2,
      })
    );
    vectorEdgesMesh.visible = params.showVectorEdges;
    cube.add(vectorEdgesMesh);

    // 4b. Surface Normal Vectors Generator (Directional arrows radiating from surface)
    function buildNormalsGeometry(geo: THREE.BufferGeometry, length: number): THREE.BufferGeometry {
      const posAttr = geo.attributes.position;
      const normAttr = geo.attributes.normal;
      if (!posAttr || !normAttr) return new THREE.BufferGeometry();

      const lines: number[] = [];
      const count = posAttr.count;
      const step = count > 300 ? Math.ceil(count / 140) : 1;

      for (let i = 0; i < count; i += step) {
        const px = posAttr.getX(i);
        const py = posAttr.getY(i);
        const pz = posAttr.getZ(i);
        const nx = normAttr.getX(i);
        const ny = normAttr.getY(i);
        const nz = normAttr.getZ(i);

        lines.push(px, py, pz);
        lines.push(px + nx * length, py + ny * length, pz + nz * length);
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
      return lineGeo;
    }

    const normalVectorsMesh = new THREE.LineSegments(
      buildNormalsGeometry(geometry, params.normalVectorLength),
      new THREE.LineBasicMaterial({
        color: params.normalVectorColor,
        transparent: true,
        opacity: 0.85,
      })
    );
    normalVectorsMesh.visible = params.showNormalVectors;
    cube.add(normalVectorsMesh);

    // 4c. Basis Coordinate Vector Axes (X: Red, Y: Green, Z: Blue)
    const axesVectorsMesh = new THREE.AxesHelper(params.axesVectorLength);
    axesVectorsMesh.visible = params.showAxesVectors;
    cube.add(axesVectorsMesh);

    // 4d. Vertex Nodes (Points of high mathematical curvature / vertices)
    function buildVertexNodesGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
      const posAttr = geo.attributes.position;
      if (!posAttr) return new THREE.BufferGeometry();

      const map = new Map<string, [number, number, number]>();
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
        if (!map.has(key)) {
          map.set(key, [x, y, z]);
        }
      }

      const positions: number[] = [];
      map.forEach(([x, y, z]) => {
        positions.push(x, y, z);
      });

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      return pGeo;
    }

    const vertexNodesPoints = new THREE.Points(
      buildVertexNodesGeometry(geometry),
      new THREE.PointsMaterial({
        color: params.vertexNodeColor,
        size: params.vertexNodeSize,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    vertexNodesPoints.visible = params.showVertexNodes;
    cube.add(vertexNodesPoints);

    // Update all vector overlays when geometry or settings change
    function updateVectorOverlays() {
      // Rebuild edges
      vectorEdgesMesh.geometry.dispose();
      vectorEdgesMesh.geometry = buildEdgesGeometry(cube.geometry);
      (vectorEdgesMesh.material as THREE.LineBasicMaterial).color.set(params.vectorEdgeColor);
      (vectorEdgesMesh.material as THREE.LineBasicMaterial).opacity = params.vectorEdgeOpacity;
      vectorEdgesMesh.visible = params.showVectorEdges;

      // Rebuild normals
      normalVectorsMesh.geometry.dispose();
      normalVectorsMesh.geometry = buildNormalsGeometry(cube.geometry, params.normalVectorLength);
      (normalVectorsMesh.material as THREE.LineBasicMaterial).color.set(params.normalVectorColor);
      normalVectorsMesh.visible = params.showNormalVectors;

      // Update axes
      axesVectorsMesh.visible = params.showAxesVectors;

      // Rebuild vertices
      vertexNodesPoints.geometry.dispose();
      vertexNodesPoints.geometry = buildVertexNodesGeometry(cube.geometry);
      (vertexNodesPoints.material as THREE.PointsMaterial).color.set(params.vertexNodeColor);
      (vertexNodesPoints.material as THREE.PointsMaterial).size = params.vertexNodeSize;
      vertexNodesPoints.visible = params.showVertexNodes;
    }

    // ==========================================
    // 5. VECTOR EXPORTER: Pure SVG Vector Graphics
    // ==========================================
    function exportVectorSVG() {
      const w = Math.round(renderer.domElement.clientWidth || 1200);
      const h = Math.round(renderer.domElement.clientHeight || 800);

      cube.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);

      const edgesGeo = vectorEdgesMesh.geometry;
      const posAttr = edgesGeo.attributes.position;
      const linesSvg: string[] = [];

      if (posAttr && posAttr.count >= 2) {
        const p1 = new THREE.Vector3();
        const p2 = new THREE.Vector3();

        for (let i = 0; i < posAttr.count; i += 2) {
          p1.fromBufferAttribute(posAttr, i).applyMatrix4(cube.matrixWorld).project(camera);
          p2.fromBufferAttribute(posAttr, i + 1).applyMatrix4(cube.matrixWorld).project(camera);

          if (p1.z <= 1 && p2.z <= 1) {
            const x1 = ((p1.x * 0.5 + 0.5) * w).toFixed(2);
            const y1 = ((-p1.y * 0.5 + 0.5) * h).toFixed(2);
            const x2 = ((p2.x * 0.5 + 0.5) * w).toFixed(2);
            const y2 = ((-p2.y * 0.5 + 0.5) * h).toFixed(2);

            linesSvg.push(
              `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${params.vectorEdgeColor}" stroke-width="2.2" stroke-linecap="round" opacity="${params.vectorEdgeOpacity}" />`
            );
          }
        }
      }

      // Normal vectors export
      const normalsSvg: string[] = [];
      if (params.showNormalVectors) {
        const normPos = normalVectorsMesh.geometry.attributes.position;
        if (normPos) {
          const np1 = new THREE.Vector3();
          const np2 = new THREE.Vector3();
          for (let i = 0; i < normPos.count; i += 2) {
            np1.fromBufferAttribute(normPos, i).applyMatrix4(cube.matrixWorld).project(camera);
            np2.fromBufferAttribute(normPos, i + 1).applyMatrix4(cube.matrixWorld).project(camera);
            if (np1.z <= 1 && np2.z <= 1) {
              const x1 = ((np1.x * 0.5 + 0.5) * w).toFixed(2);
              const y1 = ((-np1.y * 0.5 + 0.5) * h).toFixed(2);
              const x2 = ((np2.x * 0.5 + 0.5) * w).toFixed(2);
              const y2 = ((-np2.y * 0.5 + 0.5) * h).toFixed(2);
              normalsSvg.push(
                `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${params.normalVectorColor}" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.8" />`
              );
            }
          }
        }
      }

      // Vertex nodes export
      const verticesSvg: string[] = [];
      if (params.showVertexNodes) {
        const vertPos = vertexNodesPoints.geometry.attributes.position;
        if (vertPos) {
          const vp = new THREE.Vector3();
          for (let i = 0; i < vertPos.count; i++) {
            vp.fromBufferAttribute(vertPos, i).applyMatrix4(cube.matrixWorld).project(camera);
            if (vp.z <= 1) {
              const vx = ((vp.x * 0.5 + 0.5) * w).toFixed(2);
              const vy = ((-vp.y * 0.5 + 0.5) * h).toFixed(2);
              verticesSvg.push(
                `<circle cx="${vx}" cy="${vy}" r="3.5" fill="${params.vertexNodeColor}" stroke="#ffffff" stroke-width="0.8" />`
              );
            }
          }
        }
      }

      const svgData = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <!-- 3D Vector Solution Export: Shape=${params.geometryType} | Pattern=${params.patternType} -->
  <rect width="100%" height="100%" fill="${params.backgroundColor}" />
  <g id="surface-normals">${normalsSvg.join('\n    ')}</g>
  <g id="vector-edges">${linesSvg.join('\n    ')}</g>
  <g id="vertex-nodes">${verticesSvg.join('\n    ')}</g>
</svg>`;

      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3d-vector-${params.geometryType}-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(params.ambientColor, params.ambientIntensity);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(params.pointLightColor, params.pointLightIntensity, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const fillLight = new THREE.PointLight(params.fillLightColor, params.fillLightIntensity, 50);
    fillLight.position.set(-5, -3, 3);
    scene.add(fillLight);

    const orbGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const pointMat = new THREE.MeshBasicMaterial({ color: params.pointLightColor });
    const pointLightHelper = new THREE.Mesh(orbGeo, pointMat);
    pointLightHelper.position.copy(pointLight.position);
    scene.add(pointLightHelper);

    const fillMat = new THREE.MeshBasicMaterial({ color: params.fillLightColor });
    const fillLightHelper = new THREE.Mesh(orbGeo, fillMat);
    fillLightHelper.position.copy(fillLight.position);
    scene.add(fillLightHelper);

    // Floating particles
    const particleCount = 200;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i + 2] = (Math.random() - 0.5) * 16;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: params.lineColor,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    function updateTextures() {
      const newGrid = generateCanvasTexture(false);
      const newBump = generateCanvasTexture(true);

      material.map = newGrid;
      material.bumpMap = newBump;
      material.needsUpdate = true;

      gridTexture.dispose();
      bumpTexture.dispose();
    }

    function updateGeometry(type: GeometryShape) {
      params.geometryType = type;
      cube.geometry.dispose();
      cube.geometry = createGeometry(type);
      setSelectedShape(type);
      updateVectorOverlays();
    }

    // 7. Setup lil-gui Controls
    const gui = new GUI({
      title: 'Scene Controls',
      container: guiContainerRef.current || undefined,
      width: 280,
      autoPlace: !guiContainerRef.current,
    });

    // Vector Solution Folder
    const fVector = gui.addFolder('📐 Vector Solution');
    fVector.add(params, 'showVectorEdges').name('Vector Edges').onChange((val: boolean) => {
      params.showVectorEdges = val;
      setVectorEdgesActive(val);
      updateVectorOverlays();
    });
    fVector.addColor(params, 'vectorEdgeColor').name('Edge Color').onChange(() => updateVectorOverlays());
    fVector.add(params, 'vectorEdgeOpacity', 0.1, 1.0, 0.05).name('Edge Opacity').onChange(() => updateVectorOverlays());

    fVector.add(params, 'showNormalVectors').name('Normal Vectors ⃗N').onChange((val: boolean) => {
      params.showNormalVectors = val;
      setNormalVectorsActive(val);
      updateVectorOverlays();
    });
    fVector.add(params, 'normalVectorLength', 0.1, 1.0, 0.05).name('Normal Length').onChange(() => updateVectorOverlays());
    fVector.addColor(params, 'normalVectorColor').name('Normal Color').onChange(() => updateVectorOverlays());

    fVector.add(params, 'showAxesVectors').name('XYZ Basis Axes').onChange((val: boolean) => {
      params.showAxesVectors = val;
      setAxesVectorsActive(val);
      updateVectorOverlays();
    });

    fVector.add(params, 'showVertexNodes').name('Vertex Anchors ✢').onChange((val: boolean) => {
      params.showVertexNodes = val;
      setVertexNodesActive(val);
      updateVectorOverlays();
    });
    fVector.addColor(params, 'vertexNodeColor').name('Vertex Color').onChange(() => updateVectorOverlays());

    const vectorExportAction = { exportSvg: () => exportVectorSVG() };
    fVector.add(vectorExportAction, 'exportSvg').name('💾 Export Vector (.SVG)');

    // Texture Folder
    const fTexture = gui.addFolder('Texture');
    fTexture.add(params, 'patternType', ['hexagonal', 'triangular', 'radial', 'square']).name('Grid Pattern').onChange((val: GridPatternType) => {
      setPatternType(val);
      updateTextures();
    });
    fTexture.add(params, 'tiling', 1, 16, 1).name('Tiling Density').onChange((val: number) => {
      if (material.map) material.map.repeat.set(val, val);
      if (material.bumpMap) material.bumpMap.repeat.set(val, val);
      if (material.map) material.map.needsUpdate = true;
      if (material.bumpMap) material.bumpMap.needsUpdate = true;
    });
    fTexture.add(params, 'gridDivisions', 2, 32, 1).name('Divisions').onChange(() => updateTextures());
    fTexture.add(params, 'gridLineWidth', 1, 10, 1).name('Line Width').onChange(() => updateTextures());
    fTexture.add(params, 'dotRadius', 0, 8, 0.5).name('Dot Radius').onChange(() => updateTextures());
    fTexture.addColor(params, 'lineColor').name('Line Color').onChange(() => updateTextures());
    fTexture.addColor(params, 'dotColor').name('Dot Color').onChange(() => updateTextures());
    fTexture.addColor(params, 'baseColor').name('Base Color').onChange(() => updateTextures());

    // Material Folder
    const fMaterial = gui.addFolder('Material');
    fMaterial.add(params, 'bumpScale', 0, 0.3, 0.005).name('Bump Scale').onChange((val: number) => {
      material.bumpScale = val;
    });
    fMaterial.add(params, 'roughness', 0, 1, 0.01).name('Roughness').onChange((val: number) => {
      material.roughness = val;
    });
    fMaterial.add(params, 'metalness', 0, 1, 0.01).name('Metalness').onChange((val: number) => {
      material.metalness = val;
    });
    fMaterial.add(params, 'wireframe').name('Wireframe').onChange((val: boolean) => {
      material.wireframe = val;
      setWireframeActive(val);
    });

    // Geometry Folder
    const fGeometry = gui.addFolder('Geometry');
    fGeometry.add(params, 'geometryType', ALL_SHAPES.map((s) => s.id))
      .name('Shape')
      .onChange((val: GeometryShape) => {
        updateGeometry(val);
      });

    // Lighting Folder
    const fLighting = gui.addFolder('Lighting');
    fLighting.add(params, 'ambientIntensity', 0, 2, 0.05).name('Ambient Light').onChange((val: number) => {
      ambientLight.intensity = val;
    });
    fLighting.addColor(params, 'ambientColor').name('Ambient Color').onChange((val: string) => {
      ambientLight.color.set(val);
    });
    fLighting.add(params, 'pointLightIntensity', 0, 5, 0.1).name('Point Light').onChange((val: number) => {
      pointLight.intensity = val;
    });
    fLighting.addColor(params, 'pointLightColor').name('Point Color').onChange((val: string) => {
      pointLight.color.set(val);
      pointMat.color.set(val);
    });
    fLighting.add(params, 'fillLightIntensity', 0, 5, 0.1).name('Fill Light').onChange((val: number) => {
      fillLight.intensity = val;
    });
    fLighting.addColor(params, 'fillLightColor').name('Fill Color').onChange((val: string) => {
      fillLight.color.set(val);
      fillMat.color.set(val);
    });

    // Motion Folder
    const fMotion = gui.addFolder('Motion');
    fMotion.add(params, 'autoRotate').name('Auto Rotate').onChange((val: boolean) => {
      setIsRotating(val);
    });
    fMotion.add(params, 'rotationSpeedX', -0.05, 0.05, 0.001).name('Speed X');
    fMotion.add(params, 'rotationSpeedY', -0.05, 0.05, 0.001).name('Speed Y');

    // Screenshot helper
    function takeScreenshot() {
      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `procedural-shape-${params.geometryType}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }

    // Preset applicator
    function applyPreset(presetId: string) {
      const p = PRESETS.find((preset) => preset.id === presetId);
      if (!p) return;

      params.lineColor = p.lineColor;
      params.dotColor = p.dotColor;
      params.baseColor = p.baseColor;
      params.pointLightColor = p.pointLightColor;
      params.fillLightColor = p.fillLightColor;
      params.backgroundColor = p.backgroundColor;
      params.bumpScale = p.bumpScale;
      params.metalness = p.metalness;
      params.roughness = p.roughness;

      material.bumpScale = p.bumpScale;
      material.metalness = p.metalness;
      material.roughness = p.roughness;

      pointLight.color.set(p.pointLightColor);
      pointMat.color.set(p.pointLightColor);
      fillLight.color.set(p.fillLightColor);
      fillMat.color.set(p.fillLightColor);
      scene.background = new THREE.Color(p.backgroundColor);

      particleMat.color.set(p.lineColor);

      updateTextures();
      gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
      setActivePreset(presetId);
    }

    function resetDefaults() {
      Object.assign(params, DEFAULT_PARAMS);
      applyPreset('cyberpunk');
      updateGeometry(DEFAULT_PARAMS.geometryType);
      params.tiling = DEFAULT_PARAMS.tiling;
      if (material.map) material.map.repeat.set(DEFAULT_PARAMS.tiling, DEFAULT_PARAMS.tiling);
      if (material.bumpMap) material.bumpMap.repeat.set(DEFAULT_PARAMS.tiling, DEFAULT_PARAMS.tiling);
      material.wireframe = false;
      setWireframeActive(false);
      setIsRotating(true);
      setVectorEdgesActive(DEFAULT_PARAMS.showVectorEdges);
      setNormalVectorsActive(DEFAULT_PARAMS.showNormalVectors);
      setAxesVectorsActive(DEFAULT_PARAMS.showAxesVectors);
      setVertexNodesActive(DEFAULT_PARAMS.showVertexNodes);
      updateVectorOverlays();
      camera.position.set(0, 0, 4);
      controls.target.set(0, 0, 0);
      controls.update();
      gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    }

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      cube,
      geometry,
      material,
      gridTexture,
      bumpTexture,
      ambientLight,
      pointLight,
      fillLight,
      pointLightHelper,
      fillLightHelper,
      particleSystem,
      vectorEdgesMesh,
      normalVectorsMesh,
      axesVectorsMesh,
      vertexNodesPoints,
      params,
      gui,
      updateTextures,
      updateGeometry,
      updateVectorOverlays,
      applyPreset,
      resetDefaults,
      takeScreenshot,
      exportVectorSVG,
    };

    // 8. Animation Loop with FPS tracking
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Auto rotation
      if (params.autoRotate) {
        cube.rotation.x += params.rotationSpeedX;
        cube.rotation.y += params.rotationSpeedY;
      }

      // Gentle floating animation
      cube.position.y = Math.sin(elapsedTime * 1.2) * 0.08;

      // Rotate background particles
      if (particleSystem) {
        particleSystem.rotation.y = elapsedTime * 0.02;
      }

      // Light orbiting animation for dynamic specular reflections
      const lightRadius = 6;
      pointLight.position.x = Math.sin(elapsedTime * 0.4) * lightRadius;
      pointLight.position.z = Math.cos(elapsedTime * 0.4) * lightRadius;
      pointLightHelper.position.copy(pointLight.position);

      fillLight.position.x = Math.sin(elapsedTime * 0.3 + Math.PI) * 5;
      fillLight.position.y = Math.cos(elapsedTime * 0.2) * 4;
      fillLightHelper.position.copy(fillLight.position);

      controls.update();
      renderer.render(scene, camera);

      // FPS Calculation
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const polyCount = renderer.info.render.triangles;
        const camPos = `(${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`;
        onStatsUpdate?.({ fps, polyCount, cameraPos: camPos });
        frameCount = 0;
        lastTime = currentTime;
      }
    }

    animate();

    // 9. Window Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      gui.destroy();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      gridTexture.dispose();
      bumpTexture.dispose();
      vectorEdgesMesh.geometry.dispose();
      normalVectorsMesh.geometry.dispose();
      vertexNodesPoints.geometry.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // Sync GUI visibility
  useEffect(() => {
    if (sceneRef.current?.gui) {
      if (guiVisible) {
        sceneRef.current.gui.show();
      } else {
        sceneRef.current.gui.hide();
      }
    }
  }, [guiVisible]);

  // Featured quick-pick shapes for instant 1-click access
  const FEATURED_SHAPES: GeometryShape[] = [
    'mobius-strip',
    'klein-bottle',
    'catenoid',
    'hexagon',
    'pentagon',
    'dodecahedron',
    'torus-knot',
    'triangle',
    'cube',
  ];

  const filteredShapes = shapeCategory === 'all'
    ? ALL_SHAPES
    : ALL_SHAPES.filter((s) => s.category === shapeCategory);

  const currentPatternMeta = PATTERN_LIST.find((p) => p.id === patternType) || PATTERN_LIST[0];

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* lil-gui custom container docking in top-right */}
      <div
        ref={guiContainerRef}
        className={`absolute top-4 right-4 z-30 transition-opacity duration-200 ${
          guiVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Vector Solution Popover Drawer */}
      {showVectorDrawer && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-md p-4 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl text-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-cyan-300 tracking-tight flex items-center gap-1.5">
                📐 Vector Solution Tools
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                Active
              </span>
            </div>
            <button
              onClick={() => setShowVectorDrawer(false)}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Direct mathematical overlays including topological boundary vectors, surface normals, XYZ coordinate basis, and resolution-independent SVG vector exporting.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Vector Edges */}
            <button
              onClick={() => {
                if (sceneRef.current) {
                  const newVal = !vectorEdgesActive;
                  sceneRef.current.params.showVectorEdges = newVal;
                  setVectorEdgesActive(newVal);
                  sceneRef.current.updateVectorOverlays();
                  sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
                }
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                vectorEdgesActive
                  ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Vector Edges</div>
                <div className="text-[10px] opacity-70">Topological outline</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${vectorEdgesActive ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`} />
            </button>

            {/* Normal Vectors */}
            <button
              onClick={() => {
                if (sceneRef.current) {
                  const newVal = !normalVectorsActive;
                  sceneRef.current.params.showNormalVectors = newVal;
                  setNormalVectorsActive(newVal);
                  sceneRef.current.updateVectorOverlays();
                  sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
                }
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                normalVectorsActive
                  ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Normal Vectors ⃗N</div>
                <div className="text-[10px] opacity-70">Surface orientation</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${normalVectorsActive ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-700'}`} />
            </button>

            {/* Basis Axes */}
            <button
              onClick={() => {
                if (sceneRef.current) {
                  const newVal = !axesVectorsActive;
                  sceneRef.current.params.showAxesVectors = newVal;
                  setAxesVectorsActive(newVal);
                  sceneRef.current.updateVectorOverlays();
                  sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
                }
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                axesVectorsActive
                  ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">XYZ Basis Axes</div>
                <div className="text-[10px] opacity-70">RGB coordinate arrows</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${axesVectorsActive ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-slate-700'}`} />
            </button>

            {/* Vertex Nodes */}
            <button
              onClick={() => {
                if (sceneRef.current) {
                  const newVal = !vertexNodesActive;
                  sceneRef.current.params.showVertexNodes = newVal;
                  setVertexNodesActive(newVal);
                  sceneRef.current.updateVectorOverlays();
                  sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
                }
              }}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                vertexNodesActive
                  ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">Vertex Anchors ✢</div>
                <div className="text-[10px] opacity-70">Nodes & points</div>
              </div>
              <span className={`w-2 h-2 rounded-full ${vertexNodesActive ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'}`} />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Export 2D vector path illustration:</span>
            <button
              onClick={() => sceneRef.current?.exportVectorSVG()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-md transition-all"
            >
              <span>💾</span> Export Vector (.SVG)
            </button>
          </div>
        </div>
      )}

      {/* All Shapes Popover Drawer */}
      {showShapeMenu && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-2xl p-4 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">3D Geometry Library</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                {ALL_SHAPES.length} Shapes (Continuous & Polyhedra)
              </span>
            </div>
            <button
              onClick={() => setShowShapeMenu(false)}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            >
              ✕ Close
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
            {(['all', 'continuous', 'prisms', 'pyramids', 'platonic', 'curved'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setShapeCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap capitalize ${
                  shapeCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat === 'continuous' ? 'Continuous Surfaces' : cat}
              </button>
            ))}
          </div>

          {/* Shape Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredShapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => {
                  sceneRef.current?.updateGeometry(shape.id);
                  sceneRef.current?.gui.controllersRecursive().forEach((c) => c.updateDisplay());
                  setShowShapeMenu(false);
                }}
                className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                  selectedShape === shape.id
                    ? 'bg-cyan-500/15 border border-cyan-500/80 text-cyan-200'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300'
                }`}
              >
                <span className="text-lg w-6 text-center text-cyan-400 font-mono mt-0.5">{shape.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{shape.label}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{shape.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Overlay Floating Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 px-3 py-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-full shadow-2xl text-slate-200 text-xs font-mono max-w-[96vw]">
        {/* Presets */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
          <span className="text-slate-400 font-sans text-[11px] uppercase tracking-wider pl-1 hidden md:inline">Theme:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => sceneRef.current?.applyPreset(preset.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-sans font-medium transition-all ${
                activePreset === preset.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Vector Solution Hub Button */}
        <div className="flex items-center pr-2 border-r border-slate-800">
          <button
            onClick={() => setShowVectorDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium transition-all ${
              showVectorDrawer || vectorEdgesActive || normalVectorsActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Open Vector Solution Overlay and Tools"
          >
            <span>📐</span>
            <span className="font-semibold">Vector Solution</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          </button>
        </div>

        {/* Grid Pattern Selector */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
          <button
            onClick={() => {
              if (sceneRef.current) {
                const currentIndex = PATTERN_LIST.findIndex((p) => p.id === sceneRef.current?.params.patternType);
                const nextIndex = (currentIndex + 1) % PATTERN_LIST.length;
                const nextPattern = PATTERN_LIST[nextIndex].id;
                sceneRef.current.params.patternType = nextPattern;
                sceneRef.current.updateTextures();
                setPatternType(nextPattern);
                sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium transition-all bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-sm"
            title="Cycle between Honeycomb, Delta Tri, Radial, and Square Grid"
          >
            <span>{currentPatternMeta.icon}</span>
            <span>{currentPatternMeta.label}</span>
          </button>
        </div>

        {/* Featured Quick-Pick Shapes */}
        <div className="hidden lg:flex items-center gap-1 pr-2 border-r border-slate-800">
          {FEATURED_SHAPES.slice(0, 5).map((id) => {
            const item = ALL_SHAPES.find((s) => s.id === id);
            if (!item) return null;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sceneRef.current?.updateGeometry(item.id);
                  sceneRef.current?.gui.controllersRecursive().forEach((c) => c.updateDisplay());
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-colors flex items-center gap-1 ${
                  selectedShape === item.id
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* All Shapes Popover Button */}
        <div className="flex items-center pr-2 border-r border-slate-800">
          <button
            onClick={() => setShowShapeMenu((prev) => !prev)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all flex items-center gap-1 ${
              showShapeMenu
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-cyan-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={`Browse all ${ALL_SHAPES.length} 3D continuous surfaces and polyhedra`}
          >
            <span>{ALL_SHAPES.find((s) => s.id === selectedShape)?.icon || '⬡'}</span>
            <span className="font-semibold">{ALL_SHAPES.find((s) => s.id === selectedShape)?.label || 'Shapes'}</span>
            <span className="text-[10px] opacity-70">▾ ({ALL_SHAPES.length})</span>
          </button>
        </div>

        {/* Action Controls */}
        <button
          onClick={() => {
            if (sceneRef.current) {
              const newVal = !sceneRef.current.params.autoRotate;
              sceneRef.current.params.autoRotate = newVal;
              setIsRotating(newVal);
              sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
            }
          }}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            isRotating ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Auto Rotation"
        >
          {isRotating ? '⏸ Pause' : '▶ Rotate'}
        </button>

        <button
          onClick={() => {
            if (sceneRef.current) {
              const newVal = !sceneRef.current.material.wireframe;
              sceneRef.current.material.wireframe = newVal;
              sceneRef.current.params.wireframe = newVal;
              setWireframeActive(newVal);
              sceneRef.current.gui.controllersRecursive().forEach((c) => c.updateDisplay());
            }
          }}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            wireframeActive ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Wireframe overlay"
        >
          Wireframe
        </button>

        <button
          onClick={() => sceneRef.current?.exportVectorSVG()}
          className="px-2.5 py-1 rounded-md text-cyan-300 hover:text-white hover:bg-cyan-950/60 border border-cyan-800/50 transition-colors"
          title="Download Resolution-Independent 2D Vector (.SVG)"
        >
          Export SVG
        </button>

        <button
          onClick={() => sceneRef.current?.takeScreenshot()}
          className="px-2.5 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Download PNG snapshot"
        >
          PNG
        </button>

        <button
          onClick={() => sceneRef.current?.resetDefaults()}
          className="px-2.5 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset scene to defaults"
        >
          Reset
        </button>

        <button
          onClick={onToggleGui}
          className={`px-2.5 py-1 rounded-md font-sans font-medium transition-colors ${
            guiVisible ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle lil-gui controller panel"
        >
          {guiVisible ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>
    </div>
  );
};
