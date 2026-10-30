import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BallConfig, ViewSection, LightingPreset, ThemeMode } from '../types';
import {
  generateBasketballTextures,
  generateNylonWindingTexture,
  generateCarcassTexture,
  generateBladderTexture,
  evaluateBasketballSeam,
} from '../utils/textures';
import { sound } from '../utils/audio';

interface BasketballCanvasProps {
  config: BallConfig;
  activeSection: ViewSection;
  explosionProgress: number; // 0 (fully constructed) to 1 (fully exploded)
  lightingPreset: LightingPreset;
  themeMode?: ThemeMode;
  windSpeed: number; // 0 to 120 km/h
  ballRpm: number; // 0 to 300
  selectedLayerId: string | null;
  macroLightAngle: number; // 0 to 360 degrees
  bounceTrigger?: number;
  spinTrigger?: number;
  snapshotTrigger?: number;
  onSnapshotReady?: (dataUrl: string) => void;
  // WebXR Props
  isVRPresenting?: boolean;
  onVRStateChange?: (isPresenting: boolean, isSupported: boolean, error?: string | null) => void;
  onRegisterVRToggle?: (toggleFn: () => Promise<void>) => void;
}

/**
 * Generates a procedural studio softbox HDRI environment map using PMREMGenerator
 * so metallic foil stamps, 24K seams, and composite leather pebbles catch realistic reflections.
 */
function createStudioEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x141519);

  // Overhead main warm studio softbox
  const topBox = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 4.2, 3.8), side: THREE.DoubleSide })
  );
  topBox.position.set(3, 10, 4);
  topBox.lookAt(0, 0, 0);
  envScene.add(topBox);

  // Key side strip softbox (crisp specular grazing edge on pebbles)
  const keyStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 4.8, 4.5), side: THREE.DoubleSide })
  );
  keyStrip.position.set(9, 3, 6);
  keyStrip.lookAt(0, 0, 0);
  envScene.add(keyStrip);

  // Cool sky fill softbox on left
  const fillStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 2.2, 3.2), side: THREE.DoubleSide })
  );
  fillStrip.position.set(-10, 2, 4);
  fillStrip.lookAt(0, 0, 0);
  envScene.add(fillStrip);

  // Back rim accent light
  const rimStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.4, 4.0), side: THREE.DoubleSide })
  );
  rimStrip.position.set(0, 5, -10);
  rimStrip.lookAt(0, 0, 0);
  envScene.add(rimStrip);

  // Warm hardwood court bounce from below
  const floorBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.55, 0.25), side: THREE.DoubleSide })
  );
  floorBounce.position.set(0, -10, 0);
  floorBounce.lookAt(0, 0, 0);
  envScene.add(floorBounce);

  const renderTarget = pmremGenerator.fromScene(envScene, 0.04);
  pmremGenerator.dispose();
  return renderTarget.texture;
}

/**
 * Builds a high-density sphere geometry with physical 3D vertex displacement along the
 * regulation 8-panel seam channels, raised leather edge welts, and recessed inflation valve.
 */
function createDisplacedBasketballGeometry(
  radius: number,
  widthSegments: number,
  heightSegments: number,
  channelHalfWidth = 0.0135
): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const posAttr = geo.attributes.position;
  const vertexCount = posAttr.count;

  const valveTheta = (0.665 - 42 / 1024) * Math.PI;
  const valveNx = Math.sin(valveTheta);
  const valveNy = Math.cos(valveTheta);

  for (let i = 0; i < vertexCount; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
    const nx = vx / len;
    const ny = vy / len;
    const nz = vz / len;

    const seam = evaluateBasketballSeam(nx, ny, nz, channelHalfWidth);
    // Physical 3D channel depth (-0.042 units in seam groove, +0.007 on leather welt)
    let radialOffset = seam.profileDisplacement * 0.042;

    // Physical recess for inflation valve
    const dvx = nx - valveNx;
    const dvy = ny - valveNy;
    const dvz = nz;
    const valveDist = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
    if (valveDist < 0.015) {
      radialOffset -= (1.0 - valveDist / 0.015) * 0.032;
    }

    const finalR = radius + radialOffset;
    posAttr.setXYZ(i, nx * finalR, ny * finalR, nz * finalR);
  }

  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Extracts 8 authentic interlocking basketball panel meshes by partitioning a displaced sphere
 * along the exact 8-panel 3D seam boundaries, returning each panel's mesh and outward normal direction.
 */
function createEightBasketballPanels(
  radius: number,
  material: THREE.Material
): { meshes: THREE.Mesh[]; directions: THREE.Vector3[] } {
  const baseGeo = createDisplacedBasketballGeometry(radius, 128, 96, 0.0135);
  const nonIndexed = baseGeo.toNonIndexed();
  const pos = nonIndexed.attributes.position;
  const norm = nonIndexed.attributes.normal;
  const uv = nonIndexed.attributes.uv;
  const triCount = pos.count / 3;

  const panelPositions: number[][] = Array.from({ length: 8 }, () => []);
  const panelNormals: number[][] = Array.from({ length: 8 }, () => []);
  const panelUvs: number[][] = Array.from({ length: 8 }, () => []);
  const panelCentroids: THREE.Vector3[] = Array.from({ length: 8 }, () => new THREE.Vector3());
  const panelCounts: number[] = new Array(8).fill(0);

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const i1 = i0 + 1;
    const i2 = i0 + 2;

    const cx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3;
    const cy = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3;
    const cz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3;
    const clen = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
    const nx = cx / clen;
    const ny = cy / clen;
    const nz = cz / clen;

    const seam = evaluateBasketballSeam(nx, ny, nz, 0.0135);
    // Leave open seam gap between the 8 cut leather panels
    if (seam.distance < 0.011) continue;

    const pIdx = seam.panelIndex;
    panelCentroids[pIdx].add(new THREE.Vector3(nx, ny, nz));
    panelCounts[pIdx]++;

    for (const vIdx of [i0, i1, i2]) {
      panelPositions[pIdx].push(pos.getX(vIdx), pos.getY(vIdx), pos.getZ(vIdx));
      panelNormals[pIdx].push(norm.getX(vIdx), norm.getY(vIdx), norm.getZ(vIdx));
      panelUvs[pIdx].push(uv.getX(vIdx), uv.getY(vIdx));
    }
  }

  baseGeo.dispose();
  nonIndexed.dispose();

  const meshes: THREE.Mesh[] = [];
  const directions: THREE.Vector3[] = [];

  for (let p = 0; p < 8; p++) {
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(panelPositions[p], 3));
    pGeo.setAttribute('normal', new THREE.Float32BufferAttribute(panelNormals[p], 3));
    pGeo.setAttribute('uv', new THREE.Float32BufferAttribute(panelUvs[p], 2));

    const pMat = material.clone();
    (pMat as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide;

    const mesh = new THREE.Mesh(pGeo, pMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    meshes.push(mesh);

    const dir =
      panelCounts[p] > 0
        ? panelCentroids[p].divideScalar(panelCounts[p]).normalize()
        : new THREE.Vector3(p & 1 ? 1 : -1, p & 2 ? 1 : -1, p & 4 ? 1 : -1).normalize();
    directions.push(dir);
  }

  return { meshes, directions };
}

export const BasketballCanvas: React.FC<BasketballCanvasProps> = ({
  config,
  activeSection,
  explosionProgress,
  lightingPreset,
  themeMode = 'day',
  windSpeed,
  ballRpm,
  selectedLayerId,
  macroLightAngle,
  bounceTrigger = 0,
  spinTrigger = 0,
  snapshotTrigger,
  onSnapshotReady,
  onVRStateChange,
  onRegisterVRToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const vrGroupRef = useRef<THREE.Group | null>(null);
  const isVRSupportedRef = useRef(false);

  // Live prop refs so the WebGL animation loop always reads up-to-date state
  const activeSectionRef = useRef<ViewSection>(activeSection);
  const explosionProgressRef = useRef<number>(explosionProgress);
  const selectedLayerIdRef = useRef<string | null>(selectedLayerId);
  const windSpeedRef = useRef<number>(windSpeed);
  const ballRpmRef = useRef<number>(ballRpm);
  const macroLightAngleRef = useRef<number>(macroLightAngle);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);
  useEffect(() => {
    explosionProgressRef.current = explosionProgress;
  }, [explosionProgress]);
  useEffect(() => {
    selectedLayerIdRef.current = selectedLayerId;
  }, [selectedLayerId]);
  useEffect(() => {
    windSpeedRef.current = windSpeed;
  }, [windSpeed]);
  useEffect(() => {
    ballRpmRef.current = ballRpm;
  }, [ballRpm]);
  useEffect(() => {
    macroLightAngleRef.current = macroLightAngle;
  }, [macroLightAngle]);

  // 3D Objects
  const assembledBallRef = useRef<THREE.Mesh | null>(null);
  const explodedGroupRef = useRef<THREE.Group | null>(null);
  const outerPanelsRef = useRef<THREE.Mesh[]>([]);
  const outerPanelDirsRef = useRef<THREE.Vector3[]>([]);
  const windingsGroupRef = useRef<THREE.Group | null>(null);
  const windingsMeshRef = useRef<THREE.Mesh | null>(null);
  const carcassMeshRef = useRef<THREE.Mesh | null>(null);
  const bladderMeshRef = useRef<THREE.Mesh | null>(null);
  const valveRef = useRef<THREE.Group | null>(null);

  // Lighting & Effects
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.SpotLight | null>(null);
  const fillLightRef = useRef<THREE.PointLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const macroTorchRef = useRef<THREE.PointLight | null>(null);
  const courtFloorRef = useRef<THREE.Mesh | null>(null);
  const streamlinesRef = useRef<THREE.Points | null>(null);
  const streamlinePositionsRef = useRef<Float32Array | null>(null);
  const streamlineOriginalsRef = useRef<Float32Array | null>(null);

  // Dynamic Animated Construction & Physics State
  const currentExplosionProgressRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0.0032 });
  const ballPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const bounceAnimationRef = useRef<{ isBouncing: boolean; startTime: number }>({
    isBouncing: false,
    startTime: 0,
  });

  // Interactive Parallax State Ref
  const mouseParallaxRef = useRef({ x: 0, y: 0 });
  const currentParallaxRef = useRef({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState(true);

  // Target camera configurations for each section
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 7.0));
  const targetCamLook = useRef(new THREE.Vector3(0, 0, 0));

  // Update camera framing per active section and deconstruction state
  useEffect(() => {
    const isDeconstructed = explosionProgress > 0.1;
    switch (activeSection) {
      case 'hero':
        targetCamPos.current.set(0, 0, isDeconstructed ? 7.8 : 7.0);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'deconstruction':
        targetCamPos.current.set(0, 0.1, isDeconstructed ? 8.0 : 7.0);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'macro':
        // Close-up 10x topographic inspection framing
        targetCamPos.current.set(0, 0.25, 4.55);
        targetCamLook.current.set(0, 0.18, 0);
        break;
      case 'aerodynamics':
        targetCamPos.current.set(0, 0.1, 7.2);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'customizer':
        targetCamPos.current.set(0, 0, 6.75);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'footer':
        targetCamPos.current.set(0, -0.35, 7.5);
        targetCamLook.current.set(0, -0.2, 0);
        break;
    }
  }, [activeSection, explosionProgress]);

  // Listen to external bounce trigger
  useEffect(() => {
    if (bounceTrigger > 0) {
      bounceAnimationRef.current = {
        isBouncing: true,
        startTime: Date.now(),
      };
    }
  }, [bounceTrigger]);

  // Listen to external spin trigger
  useEffect(() => {
    if (spinTrigger > 0) {
      rotationVelocityRef.current.y = 0.22; // High-speed spin burst
    }
  }, [spinTrigger]);

  // Toggle WebXR Immersive VR Handler
  const toggleVR = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) {
        await session.end();
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
      try {
        const isSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');
        if (!isSupported) {
          onVRStateChange?.(
            false,
            false,
            'WebXR immersive-vr mode is not supported on this browser or hardware.'
          );
          return;
        }

        const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
        const session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit);
        await renderer.xr.setSession(session);
      } catch (err: any) {
        console.warn('WebXR session request failed:', err);
        onVRStateChange?.(
          false,
          isVRSupportedRef.current,
          err?.message || 'Failed to initialize WebXR VR session.'
        );
        throw err;
      }
    } else {
      onVRStateChange?.(false, false, 'WebXR Device API is not available on this browser.');
      throw new Error('WebXR not available');
    }
  }, [onVRStateChange]);

  // Register toggle handler
  useEffect(() => {
    if (onRegisterVRToggle) {
      onRegisterVRToggle(toggleVR);
    }
  }, [onRegisterVRToggle, toggleVR]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(themeMode === 'night' ? 0x121316 : 0xbebec6, 0.018);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with WebXR Support
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Generate Studio Softbox HDRI Environment Map for realistic PBR reflections
    const envTexture = createStudioEnvironmentMap(renderer);
    scene.environment = envTexture;

    // Check VR Support
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
      (navigator as any).xr
        .isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          isVRSupportedRef.current = supported;
          onVRStateChange?.(false, supported);
        })
        .catch(() => {
          isVRSupportedRef.current = false;
          onVRStateChange?.(false, false);
        });
    }

    // VR Spatial Experience Group
    const vrGroup = new THREE.Group();
    vrGroup.visible = false;
    scene.add(vrGroup);
    vrGroupRef.current = vrGroup;

    // 4. Studio Multi-Point Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, themeMode === 'night' ? 0.35 : 0.72);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.SpotLight(0xfff6e5, themeMode === 'night' ? 4.6 : 3.8);
    keyLight.position.set(5.5, 8.0, 6.5);
    keyLight.angle = Math.PI / 3.5;
    keyLight.penumbra = 0.65;
    keyLight.decay = 1.2;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.00015;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.PointLight(0x7dd3fc, 1.6, 25);
    fillLight.position.set(-6.5, -2.5, 4.5);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(0xe2e8f0, themeMode === 'night' ? 2.8 : 1.6);
    rimLight.position.set(-2, 5, -6);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Macro Orbital Raking Torch Light (accentuates pebble micro-grain in Section 03)
    const macroTorch = new THREE.PointLight(0xfff8e7, 0, 12);
    macroTorch.position.set(2.5, 2.2, 3.4);
    scene.add(macroTorch);
    macroTorchRef.current = macroTorch;

    // 5. Hardwood Court Shadow Caster Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: themeMode === 'night' ? 0.45 : 0.24 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -2.42;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    courtFloorRef.current = floorMesh;

    // 6. Build 3D Models
    try {
      buildBasketballMesh(scene, config);
      buildWindTunnelStreamlines(scene);
      setIsLoading(false);

      // On loading, trigger a realistic hardwood bounce sequence immediately
      bounceAnimationRef.current = {
        isBouncing: true,
        startTime: Date.now() + 100,
      };
      setTimeout(() => {
        sound.playBounce(0.85);
      }, 100);
    } catch (err) {
      console.error('Error generating 3D models and procedural textures:', err);
      setIsLoading(false);
    }

    // 7. Animation Loop (WebXR Compliant via setAnimationLoop)
    const clock = new THREE.Clock();

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseParallaxRef.current = { x: nx, y: ny };
    };

    const handleGlobalWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const impulse =
        Math.sign(delta) * Math.min(Math.max(Math.abs(delta) * 0.0006, 0.025), 0.075);
      rotationVelocityRef.current.y += impulse;
      rotationVelocityRef.current.x += (Math.random() - 0.5) * 0.006;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });

    renderer.setAnimationLoop(() => {
      const isPresenting = renderer.xr.isPresenting;
      const elapsedTime = clock.getElapsedTime();

      const curSection = activeSectionRef.current;
      const targetProgress = explosionProgressRef.current;
      const curSelectedLayer = selectedLayerIdRef.current;
      const curWindSpeed = windSpeedRef.current;
      const curBallRpm = ballRpmRef.current;
      const curMacroAngle = macroLightAngleRef.current;

      // Subtle mouse parallax calculation
      const targetPx = mouseParallaxRef.current.x * 0.35;
      const targetPy = mouseParallaxRef.current.y * 0.25;
      currentParallaxRef.current.x += (targetPx - currentParallaxRef.current.x) * 0.045;
      currentParallaxRef.current.y += (targetPy - currentParallaxRef.current.y) * 0.045;

      const px = currentParallaxRef.current.x;
      const py = currentParallaxRef.current.y;

      // Smooth Camera Lerp with subtle mouse parallax shift when not in VR
      if (!isPresenting && cameraRef.current) {
        const camPosWithParallax = new THREE.Vector3(
          targetCamPos.current.x + px * 0.38,
          targetCamPos.current.y + py * 0.28,
          targetCamPos.current.z
        );
        cameraRef.current.position.lerp(camPosWithParallax, 0.055);

        const lookAtWithParallax = new THREE.Vector3(
          targetCamLook.current.x + px * 0.1,
          targetCamLook.current.y + py * 0.1,
          targetCamLook.current.z
        );
        cameraRef.current.lookAt(lookAtWithParallax);
      }

      if (vrGroupRef.current) {
        vrGroupRef.current.visible = isPresenting;
      }

      // Macro Raking Light Positioning (sweeps across pebble micro-domes)
      if (macroTorchRef.current && curSection === 'macro') {
        const rad = ((curMacroAngle + elapsedTime * 18) * Math.PI) / 180;
        macroTorchRef.current.position.set(Math.cos(rad) * 3.0, Math.sin(rad) * 2.4 + 0.5, 3.2);
        macroTorchRef.current.intensity = 4.2;
      } else if (macroTorchRef.current) {
        macroTorchRef.current.intensity = 0;
      }

      // === SMOOTH CONTINUOUS CONSTRUCTION / DECONSTRUCTION INTERPOLATION ===
      currentExplosionProgressRef.current +=
        (targetProgress - currentExplosionProgressRef.current) * 0.042;
      const curProg = currentExplosionProgressRef.current;

      if (explodedGroupRef.current && assembledBallRef.current) {
        if (curProg < 0.006) {
          assembledBallRef.current.visible = true;
          explodedGroupRef.current.visible = false;
        } else {
          assembledBallRef.current.visible = false;
          explodedGroupRef.current.visible = true;

          // 1. Outer 8 Authentic Interlocking Basketball Leather Panels
          outerPanelsRef.current.forEach((panel, idx) => {
            const dir = outerPanelDirsRef.current[idx] || new THREE.Vector3(0, 1, 0);
            const dist = curProg * 1.45;
            panel.position.copy(dir).multiplyScalar(dist);

            const mat = panel.material as THREE.MeshPhysicalMaterial;
            if (curSelectedLayer && curSelectedLayer !== 'layer-outer') {
              mat.opacity = 0.22;
              mat.transparent = true;
            } else {
              mat.opacity = 1.0;
              mat.transparent = false;
            }
          });

          // 2. 4-Ply Polyamide Geodesic Windings Layer
          if (windingsGroupRef.current && windingsMeshRef.current) {
            const wScale = 1.0 + curProg * 0.22;
            windingsGroupRef.current.scale.setScalar(wScale);
            windingsGroupRef.current.rotation.y += 0.0025;
            const wMat = windingsMeshRef.current.material as THREE.MeshStandardMaterial;
            if (curSelectedLayer && curSelectedLayer !== 'layer-windings') {
              wMat.opacity = 0.22;
            } else {
              wMat.opacity = curSelectedLayer === 'layer-windings' ? 1.0 : 0.92;
            }
          }

          // 3. Cushion Response Sponge Carcass ('layer-cushion' or 'layer-carcass')
          if (carcassMeshRef.current) {
            const cScale = 1.0 + curProg * 0.1;
            carcassMeshRef.current.scale.setScalar(cScale);
            const cMat = carcassMeshRef.current.material as THREE.MeshStandardMaterial;
            const isCushionSelected =
              curSelectedLayer === 'layer-cushion' || curSelectedLayer === 'layer-carcass';
            if (curSelectedLayer && !isCushionSelected) {
              cMat.opacity = 0.25;
              cMat.transparent = true;
            } else {
              cMat.opacity = 1.0;
              cMat.transparent = false;
            }
          }

          // 4. Airtight Halobutyl Bladder Core ('layer-core' or 'layer-bladder')
          if (bladderMeshRef.current) {
            const bScale = 1.0 + curProg * 0.02;
            bladderMeshRef.current.scale.setScalar(bScale);
            const bMat = bladderMeshRef.current.material as THREE.MeshStandardMaterial;
            const isCoreSelected =
              curSelectedLayer === 'layer-core' || curSelectedLayer === 'layer-bladder';
            if (curSelectedLayer && !isCoreSelected) {
              bMat.opacity = 0.28;
              bMat.transparent = true;
            } else {
              bMat.opacity = 1.0;
              bMat.transparent = false;
            }
          }
        }
      }

      // Ball Inertia & Dynamic Rotation
      if (assembledBallRef.current && explodedGroupRef.current) {
        if (!isDraggingRef.current) {
          rotationVelocityRef.current.x *= 0.94;
          rotationVelocityRef.current.y *= 0.95;

          if (Math.abs(rotationVelocityRef.current.y) < 0.0028) {
            rotationVelocityRef.current.y =
              Math.sign(rotationVelocityRef.current.y || 1) * 0.0028;
          }

          if (curSection === 'aerodynamics') {
            rotationVelocityRef.current.x = -(curBallRpm / 60) * 0.038;
          }
        }

        assembledBallRef.current.rotation.x += rotationVelocityRef.current.x;
        assembledBallRef.current.rotation.y += rotationVelocityRef.current.y;
        explodedGroupRef.current.rotation.x = assembledBallRef.current.rotation.x;
        explodedGroupRef.current.rotation.y = assembledBallRef.current.rotation.y;

        // Bounce Physics Handler
        if (bounceAnimationRef.current.isBouncing) {
          const bounceElapsed = (Date.now() - bounceAnimationRef.current.startTime) / 1000;
          const bounceDuration = 1.6;
          if (bounceElapsed >= 0 && bounceElapsed < bounceDuration) {
            const freq = 13;
            const decay = 2.8;
            const bounceY =
              Math.abs(Math.cos(bounceElapsed * freq)) * Math.exp(-bounceElapsed * decay) * 2.6;
            ballPositionRef.current.y = bounceY;
          } else if (bounceElapsed >= bounceDuration) {
            bounceAnimationRef.current.isBouncing = false;
            ballPositionRef.current.y = 0;
          }
        } else if (curSection === 'hero') {
          ballPositionRef.current.y = Math.sin(elapsedTime * 1.5) * 0.1;
        } else {
          ballPositionRef.current.y = 0;
        }

        if (isPresenting) {
          const vrBaseY = 1.25 + ballPositionRef.current.y * 0.4;
          assembledBallRef.current.position.set(0, vrBaseY, -1.2);
          explodedGroupRef.current.position.set(0, vrBaseY, -1.2);
        } else {
          const posX = px * 0.2;
          const posY = ballPositionRef.current.y + py * 0.16;
          assembledBallRef.current.position.set(posX, posY, 0);
          explodedGroupRef.current.position.set(posX, posY, 0);

          assembledBallRef.current.rotation.z = -px * 0.05;
          explodedGroupRef.current.rotation.z = -px * 0.05;
        }
      }

      // Streamlines Animation (Wind Tunnel)
      if (
        streamlinesRef.current &&
        streamlinePositionsRef.current &&
        streamlineOriginalsRef.current
      ) {
        if (curSection === 'aerodynamics') {
          streamlinesRef.current.visible = true;
          const positions = streamlinePositionsRef.current;
          const originals = streamlineOriginalsRef.current;
          const speed = (curWindSpeed / 100) * 0.18 + 0.02;
          const spinLift = (curBallRpm / 300) * 0.4;

          const count = positions.length / 3;
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            positions[idx + 2] += speed;

            const x = positions[idx];
            const y = positions[idx + 1];
            const z = positions[idx + 2];
            const dist = Math.sqrt(x * x + y * y + z * z);

            if (dist < 2.8 && dist > 0.1) {
              const pushFactor = (2.8 - dist) * 0.15;
              positions[idx] += (x / dist) * pushFactor;
              positions[idx + 1] += (y / dist) * pushFactor + spinLift * 0.02;
            }

            if (positions[idx + 2] > 6) {
              positions[idx] = originals[idx];
              positions[idx + 1] = originals[idx + 1];
              positions[idx + 2] = originals[idx + 2] - Math.random() * 2;
            }
          }
          streamlinesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          streamlinesRef.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    });

    // 8. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('wheel', handleGlobalWheel);
      envTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Accelerate rotation slightly whenever user navigates sections
  useEffect(() => {
    rotationVelocityRef.current.y += 0.035;
  }, [activeSection]);

  // Update Textures & Material Properties when Ball Config Changes
  useEffect(() => {
    if (!sceneRef.current) return;
    updateTextures(config);
  }, [config]);

  // Lighting Preset Switcher
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !sceneRef.current) return;

    switch (lightingPreset) {
      case 'court-lights':
        keyLightRef.current.color.setHex(0xfff6e5);
        keyLightRef.current.intensity = 4.0;
        keyLightRef.current.position.set(5.5, 8.0, 6.5);
        fillLightRef.current.color.setHex(0x7dd3fc);
        fillLightRef.current.intensity = 1.6;
        break;
      case 'volumetric-gold':
        keyLightRef.current.color.setHex(0xd4af37);
        keyLightRef.current.intensity = 5.2;
        keyLightRef.current.position.set(3, 8, 4);
        fillLightRef.current.color.setHex(0xf59e0b);
        fillLightRef.current.intensity = 2.4;
        break;
      case 'cyber-noir':
        keyLightRef.current.color.setHex(0x38bdf8);
        keyLightRef.current.intensity = 4.2;
        keyLightRef.current.position.set(-6, 5, 5);
        fillLightRef.current.color.setHex(0xa855f7);
        fillLightRef.current.intensity = 3.0;
        break;
      case 'stadium-flood':
        keyLightRef.current.color.setHex(0xffffff);
        keyLightRef.current.intensity = 6.0;
        keyLightRef.current.position.set(0, 10, 8);
        fillLightRef.current.color.setHex(0xe2e8f0);
        fillLightRef.current.intensity = 3.5;
        break;
    }
  }, [lightingPreset]);

  // Handle Day / Night Theme Switch in Three.js
  useEffect(() => {
    if (!sceneRef.current) return;
    const isNight = themeMode === 'night';

    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.setHex(isNight ? 0x121316 : 0xbebec6);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isNight ? 0.35 : 0.72;
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = isNight ? 4.6 : 3.8;
      keyLightRef.current.color.setHex(isNight ? 0xeef2ff : 0xfff8eb);
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = isNight ? 2.8 : 1.6;
      rimLightRef.current.color.setHex(isNight ? 0x94a3b8 : 0x475569);
    }

    if (courtFloorRef.current) {
      const floorMat = courtFloorRef.current.material as THREE.ShadowMaterial;
      floorMat.opacity = isNight ? 0.45 : 0.24;
    }
  }, [themeMode]);

  // Handle Snapshot Exporter
  useEffect(() => {
    if (
      snapshotTrigger &&
      snapshotTrigger > 0 &&
      rendererRef.current &&
      sceneRef.current &&
      cameraRef.current
    ) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      if (onSnapshotReady) {
        onSnapshotReady(dataUrl);
      }
    }
  }, [snapshotTrigger, onSnapshotReady]);

  // Helper: Build the complete 3D models and materials
  const buildBasketballMesh = (scene: THREE.Scene, ballConf: BallConfig) => {
    const tex = generateBasketballTextures(ballConf);
    const nylonTex = generateNylonWindingTexture();
    const carcassTex = generateCarcassTexture();
    const bladderTex = generateBladderTexture();

    const channelWidth = ballConf.gripDensity === 'deep-channel' ? 0.0155 : 0.0135;
    const normalScaleVal = 1.25 * (ballConf.pebbleDepth ?? 0.85);

    // 1. Solid Assembled Ball with True 3D Seam & Valve Vertex Displacement
    const ballGeo = createDisplacedBasketballGeometry(2.1, 192, 144, channelWidth);
    const ballMat = new THREE.MeshPhysicalMaterial({
      map: tex.diffuseMap,
      normalMap: tex.normalMap,
      normalScale: new THREE.Vector2(normalScaleVal, normalScaleVal),
      roughnessMap: tex.roughnessMap,
      metalnessMap: tex.metalnessMap,
      roughness: 1.0,
      metalness: 1.0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.42,
      sheen: 0.22,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color(ballConf.leatherColor),
      envMapIntensity: 1.15,
    });

    const assembledBall = new THREE.Mesh(ballGeo, ballMat);
    assembledBall.castShadow = true;
    assembledBall.receiveShadow = true;
    // Heroic initial angle showcasing the hot-stamp monogram and interlocking 8-panel curves
    assembledBall.rotation.set(0.14, -Math.PI * 0.42, 0);
    scene.add(assembledBall);
    assembledBallRef.current = assembledBall;

    // 2. Exploded Layers Group
    const explodedGroup = new THREE.Group();
    explodedGroup.visible = false;
    explodedGroup.rotation.copy(assembledBall.rotation);
    scene.add(explodedGroup);
    explodedGroupRef.current = explodedGroup;

    // Layer 1: 8 Authentic Interlocking Basketball Leather Panels
    const { meshes: panelMeshes, directions: panelDirs } = createEightBasketballPanels(
      2.11,
      ballMat
    );
    outerPanelsRef.current = panelMeshes;
    outerPanelDirsRef.current = panelDirs;
    panelMeshes.forEach((mesh) => explodedGroup.add(mesh));

    // Layer 2: 4-Ply Polyamide Nylon Windings Sphere + Geodesic Filament Cage (Radius ~1.76)
    const windingsGroup = new THREE.Group();
    const windingsGeo = new THREE.SphereGeometry(1.76, 64, 64);
    const windingsMat = new THREE.MeshStandardMaterial({
      map: nylonTex,
      bumpMap: nylonTex,
      bumpScale: 0.015,
      roughness: 0.55,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92,
    });
    const windingsMesh = new THREE.Mesh(windingsGeo, windingsMat);
    windingsMesh.castShadow = true;
    windingsGroup.add(windingsMesh);

    // Subtle 3D geodesic monofilament wireframe overlay
    const filamentCageGeo = new THREE.IcosahedronGeometry(1.772, 4);
    const filamentCageMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const filamentCage = new THREE.Mesh(filamentCageGeo, filamentCageMat);
    windingsGroup.add(filamentCage);

    explodedGroup.add(windingsGroup);
    windingsGroupRef.current = windingsGroup;
    windingsMeshRef.current = windingsMesh;

    // Layer 3: Cellular Elastomer Cushion Carcass (Radius ~1.46)
    const carcassGeo = createDisplacedBasketballGeometry(1.46, 96, 72, 0.014);
    const carcassMat = new THREE.MeshStandardMaterial({
      map: carcassTex,
      bumpMap: carcassTex,
      bumpScale: 0.018,
      roughness: 0.85,
      metalness: 0.06,
    });
    const carcassMesh = new THREE.Mesh(carcassGeo, carcassMat);
    carcassMesh.castShadow = true;
    explodedGroup.add(carcassMesh);
    carcassMeshRef.current = carcassMesh;

    // Layer 4: Airtight Halobutyl Air Bladder (Radius ~1.16)
    const bladderGeo = new THREE.SphereGeometry(1.16, 64, 64);
    const bladderMat = new THREE.MeshStandardMaterial({
      map: bladderTex,
      roughness: 0.38,
      metalness: 0.12,
    });
    const bladderMesh = new THREE.Mesh(bladderGeo, bladderMat);
    bladderMesh.castShadow = true;
    explodedGroup.add(bladderMesh);
    bladderMeshRef.current = bladderMesh;

    // Precision Brass & Rubber Dual-Equilibrium Inflation Valve Assembly
    const valveGroup = new THREE.Group();
    const collarGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.18, 24);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x121316,
      roughness: 0.5,
      metalness: 0.1,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.set(0, 1.18, 0);
    valveGroup.add(collarMesh);

    const valveStemGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.42, 24);
    const valveStemMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
    });
    const valveStem = new THREE.Mesh(valveStemGeo, valveStemMat);
    valveStem.position.set(0, 1.26, 0);
    valveGroup.add(valveStem);

    explodedGroup.add(valveGroup);
    valveRef.current = valveGroup;
  };

  // Helper: Update Textures & Material Parameters when config changes
  const updateTextures = (newConf: BallConfig) => {
    const tex = generateBasketballTextures(newConf);
    const normalScaleVal = 1.25 * (newConf.pebbleDepth ?? 0.85);

    const applyToMaterial = (mat: THREE.MeshPhysicalMaterial) => {
      mat.map?.dispose();
      mat.normalMap?.dispose();
      mat.roughnessMap?.dispose();
      mat.metalnessMap?.dispose();

      mat.map = tex.diffuseMap;
      mat.normalMap = tex.normalMap;
      mat.normalScale.set(normalScaleVal, normalScaleVal);
      mat.roughnessMap = tex.roughnessMap;
      mat.metalnessMap = tex.metalnessMap;
      mat.sheenColor.set(newConf.leatherColor);
      mat.needsUpdate = true;
    };

    if (assembledBallRef.current) {
      applyToMaterial(assembledBallRef.current.material as THREE.MeshPhysicalMaterial);
    }

    outerPanelsRef.current.forEach((panel) => {
      const mat = panel.material as THREE.MeshPhysicalMaterial;
      mat.map = tex.diffuseMap;
      mat.normalMap = tex.normalMap;
      mat.normalScale.set(normalScaleVal, normalScaleVal);
      mat.roughnessMap = tex.roughnessMap;
      mat.metalnessMap = tex.metalnessMap;
      mat.sheenColor.set(newConf.leatherColor);
      mat.needsUpdate = true;
    });
  };

  // Helper: Build Streamlines Particles
  const buildWindTunnelStreamlines = (scene: THREE.Scene) => {
    const particleCount = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originals = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 4;
      const z = -6 + Math.random() * 12;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      originals[idx] = x;
      originals[idx + 1] = y;
      originals[idx + 2] = -6;

      const isFast = Math.random() > 0.5;
      colors[idx] = isFast ? 0.83 : 0.22;
      colors[idx + 1] = isFast ? 0.68 : 0.74;
      colors[idx + 2] = isFast ? 0.21 : 0.97;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    particles.visible = false;
    scene.add(particles);

    streamlinesRef.current = particles;
    streamlinePositionsRef.current = positions;
    streamlineOriginalsRef.current = originals;
  };

  // User Drag Rotation Handler
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    const rotSpeed = 0.005;
    rotationVelocityRef.current = {
      x: deltaY * rotSpeed,
      y: deltaX * rotSpeed,
    };

    if (assembledBallRef.current) {
      assembledBallRef.current.rotation.y += deltaX * rotSpeed;
      assembledBallRef.current.rotation.x += deltaY * rotSpeed;
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (Math.abs(deltaX) + Math.abs(deltaY) > 25) {
      sound.playWhoosh();
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      id="basketball-3d-viewport"
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Loading Screen Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121316] z-30">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-mono-tech text-[#C4C6D4] uppercase tracking-widest">
            Compiling WebGL Shaders & Constructing Mesh...
          </p>
        </div>
      )}
    </div>
  );
};
