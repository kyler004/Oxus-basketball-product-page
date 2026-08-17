import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BallConfig, ViewSection, LightingPreset, ThemeMode } from '../types';
import { generateBasketballTextures, generateNylonWindingTexture, generateBladderTexture } from '../utils/textures';
import { sound } from '../utils/audio';

interface BasketballCanvasProps {
  config: BallConfig;
  activeSection: ViewSection;
  explosionProgress: number; // 0 to 1
  lightingPreset: LightingPreset;
  themeMode?: ThemeMode;
  windSpeed: number; // 0 to 120 km/h
  ballRpm: number; // 0 to 300
  selectedLayerId: string | null;
  macroLightAngle: number; // 0 to 360 degrees
  onCanvasClick?: () => void;
  onBallBounce?: () => void;
  snapshotTrigger?: number;
  onSnapshotReady?: (dataUrl: string) => void;
  // WebXR Props
  isVRPresenting?: boolean;
  onVRStateChange?: (isPresenting: boolean, isSupported: boolean, error?: string | null) => void;
  onRegisterVRToggle?: (toggleFn: () => Promise<void>) => void;
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

  // 3D Objects
  const assembledBallRef = useRef<THREE.Mesh | null>(null);
  const explodedGroupRef = useRef<THREE.Group | null>(null);
  const outerPanelsRef = useRef<THREE.Mesh[]>([]);
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

  // Interaction State
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0.003 });
  const ballPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const bounceAnimationRef = useRef<{ isBouncing: boolean; startTime: number }>({ isBouncing: false, startTime: 0 });

  const [isLoading, setIsLoading] = useState(true);

  // Target camera configurations for each section
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 7.5));
  const targetCamLook = useRef(new THREE.Vector3(0, 0, 0));

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
          onVRStateChange?.(false, false, 'WebXR immersive-vr mode is not supported on this browser or hardware.');
          return;
        }

        const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
        const session = await (navigator as any).xr.requestSession('immersive-vr', sessionInit);
        await renderer.xr.setSession(session);
      } catch (err: any) {
        console.warn('WebXR session request failed:', err);
        onVRStateChange?.(false, isVRSupportedRef.current, err?.message || 'Failed to initialize WebXR VR session.');
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
    scene.fog = new THREE.FogExp2(0xD9D9DE, 0.02);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 7.5);
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enable WebXR on renderer
    renderer.xr.enabled = true;
    try {
      renderer.xr.setReferenceSpaceType('local-floor');
    } catch {
      // Fallback to default local space
    }

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // WebXR Session Lifecycle Listeners
    renderer.xr.addEventListener('sessionstart', () => {
      sound.playVREnter();
      onVRStateChange?.(true, true, null);
    });

    renderer.xr.addEventListener('sessionend', () => {
      sound.playVRExit();
      onVRStateChange?.(false, isVRSupportedRef.current, null);
    });

    // WebXR VR Controllers & Interaction Rays
    const controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', () => {
      triggerBounce();
    });
    scene.add(controller1);

    const controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', () => {
      triggerBounce();
    });
    scene.add(controller2);

    const rayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -2.5),
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x121316, transparent: true, opacity: 0.65 });
    const rayLine1 = new THREE.Line(rayGeo, rayMat);
    controller1.add(rayLine1);
    const rayLine2 = new THREE.Line(rayGeo.clone(), rayMat);
    controller2.add(rayLine2);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.95);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.SpotLight(0xFFFDF7, 3.4);
    keyLight.position.set(5, 7, 6);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.6;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.PointLight(0xEAEAEF, 1.8, 15);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimGoldLight = new THREE.DirectionalLight(0x2A2B30, 1.2);
    rimGoldLight.position.set(0, 6, -5);
    scene.add(rimGoldLight);
    rimLightRef.current = rimGoldLight;
    const macroTorch = new THREE.PointLight(0xFFFFFF, 0, 10);
    macroTorch.position.set(0, 0, 4);
    scene.add(macroTorch);
    macroTorchRef.current = macroTorch;

    // 5. Contact Shadow Plane
    const courtGeo = new THREE.PlaneGeometry(30, 30);
    const courtMat = new THREE.ShadowMaterial({
      opacity: 0.18,
    });
    const courtFloor = new THREE.Mesh(courtGeo, courtMat);
    courtFloor.rotation.x = -Math.PI / 2;
    courtFloor.position.y = -3.2;
    courtFloor.receiveShadow = true;
    scene.add(courtFloor);
    courtFloorRef.current = courtFloor;

    // Subtle circular line decal
    const ringGeo = new THREE.RingGeometry(2.4, 2.44, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x121316, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -3.19;
    scene.add(ring);

    // VR Spatial Pedestal (Illuminated when in VR mode)
    const vrGroup = new THREE.Group();
    const pedestalGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.08, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      metalness: 0.85,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 0.04, -1.2);
    pedestal.receiveShadow = true;
    vrGroup.add(pedestal);

    const vrGlowRingGeo = new THREE.RingGeometry(0.72, 0.76, 32);
    const vrGlowRingMat = new THREE.MeshBasicMaterial({ color: 0xF27D26, side: THREE.DoubleSide });
    const vrGlowRing = new THREE.Mesh(vrGlowRingGeo, vrGlowRingMat);
    vrGlowRing.rotation.x = -Math.PI / 2;
    vrGlowRing.position.set(0, 0.082, -1.2);
    vrGroup.add(vrGlowRing);

    vrGroup.visible = false;
    scene.add(vrGroup);
    vrGroupRef.current = vrGroup;

    // 6. Build Initial Basketball 3D Structure
    buildBasketballMesh(scene, config);

    // 7. Build Wind Tunnel Streamline Particles
    buildWindTunnelStreamlines(scene);

    setIsLoading(false);

    // Check WebXR Compatibility
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          isVRSupportedRef.current = supported;
          onVRStateChange?.(false, supported, null);
        })
        .catch(() => {
          isVRSupportedRef.current = false;
          onVRStateChange?.(false, false, null);
        });
    } else {
      isVRSupportedRef.current = false;
      onVRStateChange?.(false, false, null);
    }

    // Initial Entrance Bounce
    triggerBounce();

    // 8. Animation Loop (WebXR Compliant via setAnimationLoop)
    let clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const isPresenting = renderer.xr.isPresenting;
      const elapsedTime = clock.getElapsedTime();

      // Smooth Camera Lerp when not presenting in VR headset
      if (!isPresenting && cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.05);
        cameraRef.current.lookAt(targetCamLook.current);
      }

      // VR Spatial Viewport Placement
      if (vrGroupRef.current) {
        vrGroupRef.current.visible = isPresenting;
      }

      // Macro Light Positioning
      if (macroTorchRef.current && activeSection === 'macro') {
        const rad = (macroLightAngle * Math.PI) / 180;
        macroTorchRef.current.position.set(Math.cos(rad) * 2.8, Math.sin(rad) * 2.8, 3.2);
        macroTorchRef.current.intensity = 3.5;
      } else if (macroTorchRef.current) {
        macroTorchRef.current.intensity = 0;
      }

      // Ball Inertia & Rotation
      if (assembledBallRef.current && explodedGroupRef.current) {
        if (!isDraggingRef.current) {
          // Apply velocity decay
          rotationVelocityRef.current.x *= 0.96;
          rotationVelocityRef.current.y *= 0.96;

          // Default slow ambient spin when calm
          if (Math.abs(rotationVelocityRef.current.y) < 0.001) {
            rotationVelocityRef.current.y = 0.0025;
          }

          // If in aerodynamics section, spin based on RPM
          if (activeSection === 'aerodynamics') {
            rotationVelocityRef.current.x = -(ballRpm / 60) * 0.04;
          }
        }

        // Apply rotation to both representations
        assembledBallRef.current.rotation.x += rotationVelocityRef.current.x;
        assembledBallRef.current.rotation.y += rotationVelocityRef.current.y;
        explodedGroupRef.current.rotation.x = assembledBallRef.current.rotation.x;
        explodedGroupRef.current.rotation.y = assembledBallRef.current.rotation.y;

        // Bounce Physics Handler
        if (bounceAnimationRef.current.isBouncing) {
          const bounceElapsed = (Date.now() - bounceAnimationRef.current.startTime) / 1000;
          const bounceDuration = 1.4;
          if (bounceElapsed < bounceDuration) {
            // Damped harmonic bounce equation
            const freq = 14;
            const decay = 3.2;
            const bounceY = Math.abs(Math.cos(bounceElapsed * freq)) * Math.exp(-bounceElapsed * decay) * 2.8;
            ballPositionRef.current.y = bounceY;
          } else {
            bounceAnimationRef.current.isBouncing = false;
            ballPositionRef.current.y = 0;
          }
        } else if (activeSection === 'hero') {
          // Subtle zero-gravity float
          ballPositionRef.current.y = Math.sin(elapsedTime * 1.5) * 0.12;
        } else {
          ballPositionRef.current.y = 0;
        }

        if (isPresenting) {
          // In VR, position ball hovering at comfortable eye-level inspection height (1.25m) right in front of user (z = -1.2m)
          const vrBaseY = 1.25 + ballPositionRef.current.y * 0.4;
          assembledBallRef.current.position.set(0, vrBaseY, -1.2);
          explodedGroupRef.current.position.set(0, vrBaseY, -1.2);
        } else {
          assembledBallRef.current.position.set(0, ballPositionRef.current.y, 0);
          explodedGroupRef.current.position.set(0, ballPositionRef.current.y, 0);
        }
      }

      // Streamlines Animation (Wind Tunnel)
      if (streamlinesRef.current && streamlinePositionsRef.current && streamlineOriginalsRef.current) {
        if (activeSection === 'aerodynamics') {
          streamlinesRef.current.visible = true;
          const positions = streamlinePositionsRef.current;
          const originals = streamlineOriginalsRef.current;
          const speed = (windSpeed / 100) * 0.18 + 0.02;
          const spinLift = (ballRpm / 300) * 0.4;

          const count = positions.length / 3;
          for (let i = 0; i < count; i++) {
            const idx = i * 3;
            // Move along Z towards camera
            positions[idx + 2] += speed;

            // Streamline boundary layer deflection around sphere
            const x = positions[idx];
            const y = positions[idx + 1];
            const z = positions[idx + 2];
            const dist = Math.sqrt(x * x + y * y + z * z);

            // Curve over the sphere if close
            if (dist < 2.8 && dist > 0.1) {
              const pushFactor = (2.8 - dist) * 0.15;
              positions[idx] += (x / dist) * pushFactor;
              positions[idx + 1] += (y / dist) * pushFactor + spinLift * 0.02; // Magnus lift
            }

            // Loop back when passed
            if (positions[idx + 2] > 6) {
              positions[idx] = originals[idx];
              positions[idx + 1] = originals[idx + 1];
              positions[idx + 2] = originals[idx + 2] - (Math.random() * 2);
            }
          }
          streamlinesRef.current.geometry.attributes.position.needsUpdate = true;
        } else {
          streamlinesRef.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    });

    // 9. Resize Observer
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
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Textures when Ball Config Changes
  useEffect(() => {
    if (!sceneRef.current) return;
    updateTextures(config);
  }, [config]);

  // Handle Section Transitions & Camera Choreography
  useEffect(() => {
    switch (activeSection) {
      case 'hero':
        targetCamPos.current.set(0, 0.4, 7.2);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'deconstruction':
        targetCamPos.current.set(3.2, 1.2, 8.5);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'macro':
        // Macro 10x zoom into top quadrant pebble surface
        targetCamPos.current.set(0.6, 1.3, 3.4);
        targetCamLook.current.set(0.2, 0.7, 1.5);
        break;
      case 'aerodynamics':
        // Isometric wind tunnel angle
        targetCamPos.current.set(-5.5, 2.2, 6.0);
        targetCamLook.current.set(0, 0, 0);
        break;
      case 'customizer':
        targetCamPos.current.set(1.8, 0.6, 6.8);
        targetCamLook.current.set(0, 0, 0);
        break;
    }
  }, [activeSection]);

  // Handle Explosion Progress & Layer Highlights
  useEffect(() => {
    const isExploded = explosionProgress > 0.02 || activeSection === 'deconstruction';

    if (assembledBallRef.current) {
      assembledBallRef.current.visible = !isExploded;
    }
    if (explodedGroupRef.current) {
      explodedGroupRef.current.visible = isExploded;

      // Animate explosion distances
      const progress = explosionProgress;

      // Outer panels expand outward
      outerPanelsRef.current.forEach((panel, idx) => {
        const angle = (idx / outerPanelsRef.current.length) * Math.PI * 2;
        const dir = new THREE.Vector3(
          Math.cos(angle) * (idx % 2 === 0 ? 1 : 0.8),
          (idx % 2 === 0 ? 0.7 : -0.7),
          Math.sin(angle) * (idx % 2 === 0 ? 1 : 0.8)
        ).normalize();

        const dist = 0.1 + progress * 2.8;
        panel.position.copy(dir.clone().multiplyScalar(dist));
        panel.scale.setScalar(1 + progress * 0.12);

        // Dim if other layer is explicitly selected
        const mat = panel.material as THREE.MeshStandardMaterial;
        if (selectedLayerId && selectedLayerId !== 'layer-outer') {
          mat.opacity = 0.35;
          mat.transparent = true;
        } else {
          mat.opacity = 1.0;
          mat.transparent = false;
        }
      });

      // Windings Layer
      if (windingsMeshRef.current) {
        const wDist = 0.05 + progress * 1.5;
        windingsMeshRef.current.scale.setScalar(1 + wDist * 0.25);
        const wMat = windingsMeshRef.current.material as THREE.MeshStandardMaterial;
        if (selectedLayerId && selectedLayerId !== 'layer-windings') {
          wMat.opacity = 0.3;
          wMat.transparent = true;
        } else {
          wMat.opacity = selectedLayerId === 'layer-windings' ? 1.0 : 0.85;
          wMat.transparent = true;
        }
      }

      // Carcass Layer
      if (carcassMeshRef.current) {
        const cDist = 0.02 + progress * 0.75;
        carcassMeshRef.current.scale.setScalar(1 + cDist * 0.2);
        const cMat = carcassMeshRef.current.material as THREE.MeshStandardMaterial;
        if (selectedLayerId && selectedLayerId !== 'layer-carcass') {
          cMat.opacity = 0.35;
          cMat.transparent = true;
        } else {
          cMat.opacity = 1.0;
          cMat.transparent = false;
        }
      }

      // Bladder Core
      if (bladderMeshRef.current) {
        const bMat = bladderMeshRef.current.material as THREE.MeshStandardMaterial;
        if (selectedLayerId && selectedLayerId !== 'layer-bladder') {
          bMat.opacity = 0.45;
          bMat.transparent = true;
        } else {
          bMat.opacity = 1.0;
          bMat.transparent = false;
        }
      }
    }
  }, [explosionProgress, activeSection, selectedLayerId]);

  // Lighting Preset Switcher
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !sceneRef.current) return;

    switch (lightingPreset) {
      case 'court-lights':
        keyLightRef.current.color.setHex(0xFFF6E5);
        keyLightRef.current.intensity = 3.8;
        keyLightRef.current.position.set(5, 7, 6);
        fillLightRef.current.color.setHex(0x7DD3FC);
        fillLightRef.current.intensity = 1.8;
        break;
      case 'volumetric-gold':
        keyLightRef.current.color.setHex(0xD4AF37);
        keyLightRef.current.intensity = 5.2;
        keyLightRef.current.position.set(3, 8, 4);
        fillLightRef.current.color.setHex(0xF59E0B);
        fillLightRef.current.intensity = 2.4;
        break;
      case 'cyber-noir':
        keyLightRef.current.color.setHex(0x38BDF8);
        keyLightRef.current.intensity = 4.2;
        keyLightRef.current.position.set(-6, 5, 5);
        fillLightRef.current.color.setHex(0xA855F7);
        fillLightRef.current.intensity = 3.0;
        break;
      case 'stadium-flood':
        keyLightRef.current.color.setHex(0xFFFFFF);
        keyLightRef.current.intensity = 6.0;
        keyLightRef.current.position.set(0, 10, 8);
        fillLightRef.current.color.setHex(0xE2E8F0);
        fillLightRef.current.intensity = 3.5;
        break;
    }
  }, [lightingPreset]);

  // Handle Day / Night Theme Switch in Three.js
  useEffect(() => {
    if (!sceneRef.current) return;
    const isNight = themeMode === 'night';

    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.setHex(isNight ? 0x121316 : 0xBEBEC6);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isNight ? 0.45 : 0.95;
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = isNight ? 4.2 : 3.4;
      keyLightRef.current.color.setHex(isNight ? 0xEEF2FF : 0xFFFDF7);
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = isNight ? 2.5 : 1.2;
      rimLightRef.current.color.setHex(isNight ? 0x94A3B8 : 0x2A2B30);
    }
  }, [themeMode]);

  // Handle Snapshot Exporter
  useEffect(() => {
    if (snapshotTrigger && snapshotTrigger > 0 && rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
      if (onSnapshotReady) {
        onSnapshotReady(dataUrl);
      }
    }
  }, [snapshotTrigger, onSnapshotReady]);

  // Helper: Build the complete 3D models and materials
  const buildBasketballMesh = (scene: THREE.Scene, ballConf: BallConfig) => {
    // Generate Procedural Textures
    const tex = generateBasketballTextures(ballConf);
    const nylonTex = generateNylonWindingTexture();
    const bladderTex = generateBladderTexture();

    // 1. Solid Assembled Ball (Sphere radius = 2.1)
    const ballGeo = new THREE.SphereGeometry(2.1, 96, 96);
    const ballMat = new THREE.MeshStandardMaterial({
      map: tex.diffuseMap,
      normalMap: tex.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: tex.roughnessMap,
      metalnessMap: tex.metalnessMap,
      roughness: 0.68,
      metalness: 0.1,
    });

    const assembledBall = new THREE.Mesh(ballGeo, ballMat);
    assembledBall.castShadow = true;
    assembledBall.receiveShadow = true;
    scene.add(assembledBall);
    assembledBallRef.current = assembledBall;

    // 2. Exploded Layers Group
    const explodedGroup = new THREE.Group();
    explodedGroup.visible = false;
    scene.add(explodedGroup);
    explodedGroupRef.current = explodedGroup;

    // Layer 1: 6 Outer Curved Panel Shells (Micro-Pored Composite Leather)
    outerPanelsRef.current = [];
    const panelCount = 6;
    for (let i = 0; i < panelCount; i++) {
      // Create curved spherical sector
      const phiStart = (i / panelCount) * Math.PI * 2;
      const phiLength = (Math.PI * 2) / panelCount * 0.88;
      const thetaStart = i % 2 === 0 ? 0.15 : Math.PI * 0.35;
      const thetaLength = Math.PI * 0.55;

      const panelGeo = new THREE.SphereGeometry(2.12, 48, 48, phiStart, phiLength, thetaStart, thetaLength);
      const panelMat = new THREE.MeshStandardMaterial({
        map: tex.diffuseMap,
        normalMap: tex.normalMap,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughnessMap: tex.roughnessMap,
        metalnessMap: tex.metalnessMap,
        roughness: 0.65,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const panelMesh = new THREE.Mesh(panelGeo, panelMat);
      panelMesh.castShadow = true;
      explodedGroup.add(panelMesh);
      outerPanelsRef.current.push(panelMesh);
    }

    // Layer 2: 4-Ply Nylon Windings Mesh (Radius ~1.75)
    const windingsGeo = new THREE.SphereGeometry(1.75, 64, 64);
    const windingsMat = new THREE.MeshStandardMaterial({
      map: nylonTex,
      roughness: 0.85,
      metalness: 0.25,
      transparent: true,
      opacity: 0.92,
      wireframe: false,
    });
    const windingsMesh = new THREE.Mesh(windingsGeo, windingsMat);
    windingsMesh.castShadow = true;
    explodedGroup.add(windingsMesh);
    windingsMeshRef.current = windingsMesh;

    // Layer 3: Rubber Carcass (Radius ~1.45)
    const carcassGeo = new THREE.SphereGeometry(1.45, 64, 64);
    const carcassMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.88,
      metalness: 0.05,
    });
    const carcassMesh = new THREE.Mesh(carcassGeo, carcassMat);
    carcassMesh.castShadow = true;
    explodedGroup.add(carcassMesh);
    carcassMeshRef.current = carcassMesh;

    // Layer 4: Butyl Air Bladder (Radius ~1.15)
    const bladderGeo = new THREE.SphereGeometry(1.15, 48, 48);
    const bladderMat = new THREE.MeshStandardMaterial({
      map: bladderTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const bladderMesh = new THREE.Mesh(bladderGeo, bladderMat);
    bladderMesh.castShadow = true;
    explodedGroup.add(bladderMesh);
    bladderMeshRef.current = bladderMesh;

    // Brass Inflation Valve Protrusion
    const valveGroup = new THREE.Group();
    const valveStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16);
    const valveStemMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2 });
    const valveStem = new THREE.Mesh(valveStemGeo, valveStemMat);
    valveStem.position.set(0, 1.25, 0);
    valveGroup.add(valveStem);
    explodedGroup.add(valveGroup);
    valveRef.current = valveGroup;
  };

  // Helper: Update Textures
  const updateTextures = (newConf: BallConfig) => {
    const tex = generateBasketballTextures(newConf);

    if (assembledBallRef.current) {
      const mat = assembledBallRef.current.material as THREE.MeshStandardMaterial;
      mat.map = tex.diffuseMap;
      mat.normalMap = tex.normalMap;
      mat.roughnessMap = tex.roughnessMap;
      mat.metalnessMap = tex.metalnessMap;
      mat.needsUpdate = true;
    }

    outerPanelsRef.current.forEach((panel) => {
      const mat = panel.material as THREE.MeshStandardMaterial;
      mat.map = tex.diffuseMap;
      mat.normalMap = tex.normalMap;
      mat.roughnessMap = tex.roughnessMap;
      mat.metalnessMap = tex.metalnessMap;
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
      // Grid around sphere
      const x = (Math.random() - 0.5) * 6;
      const y = (Math.random() - 0.5) * 4;
      const z = -6 + Math.random() * 12;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      originals[idx] = x;
      originals[idx + 1] = y;
      originals[idx + 2] = -6;

      // Cyan to Gold Streamline gradient
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

    // Play subtle whoosh sound if dragged rapidly
    if (Math.abs(deltaX) + Math.abs(deltaY) > 25) {
      sound.playWhoosh();
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Trigger Bounce Animation with Sound
  const triggerBounce = useCallback(() => {
    bounceAnimationRef.current = {
      isBouncing: true,
      startTime: Date.now(),
    };
    sound.playBounce(0.9);
  }, []);

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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0B0C] z-30">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-mono-tech text-neutral-400 uppercase tracking-widest">
            Compiling WebGL Shaders & Textures...
          </p>
        </div>
      )}

      {/* Floating 3D Interaction Hints */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none hidden sm:flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono-tech text-neutral-400 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          DRAG TO ROTATE 360°
        </div>
        <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono-tech text-[#D4AF37] flex items-center gap-1.5 shadow-lg">
          <span>60 FPS WEBGL</span>
        </div>
      </div>
    </div>
  );
};
