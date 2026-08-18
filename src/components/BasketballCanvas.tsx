import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BallConfig, ViewSection, LightingPreset, ThemeMode } from '../types';
import { generateBasketballTextures, generateNylonWindingTexture, generateBladderTexture } from '../utils/textures';
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

  // Dynamic Animated Construction & Physics State
  // Starts fully constructed (0) so the ball does not reconstruct on initial load
  const currentExplosionProgressRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0.0035 });
  const ballPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const bounceAnimationRef = useRef<{ isBouncing: boolean; startTime: number }>({ isBouncing: false, startTime: 0 });
  
  // Interactive Parallax State Ref
  const mouseParallaxRef = useRef({ x: 0, y: 0 });
  const currentParallaxRef = useRef({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState(true);

  // Target camera configurations for each section
  const targetCamPos = useRef(new THREE.Vector3(0, 0, 7.2));
  const targetCamLook = useRef(new THREE.Vector3(0, 0, 0));

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
    scene.fog = new THREE.FogExp2(themeMode === 'night' ? 0x121316 : 0xBEBEC6, 0.02);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.2);
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
    renderer.toneMappingExposure = 1.15;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Check VR Support
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        isVRSupportedRef.current = supported;
        onVRStateChange?.(false, supported);
      }).catch(() => {
        isVRSupportedRef.current = false;
        onVRStateChange?.(false, false);
      });
    }

    // VR Spatial Experience Group
    const vrGroup = new THREE.Group();
    vrGroup.visible = false;
    scene.add(vrGroup);
    vrGroupRef.current = vrGroup;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, themeMode === 'night' ? 0.45 : 0.95);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.SpotLight(0xFFF6E5, themeMode === 'night' ? 4.2 : 3.4);
    keyLight.position.set(5, 8, 6);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.5;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.PointLight(0x7DD3FC, 1.8, 25);
    fillLight.position.set(-6, -3, 4);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(0x94A3B8, themeMode === 'night' ? 2.5 : 1.2);
    rimLight.position.set(0, -6, -5);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Macro Orbital Torch Light
    const macroTorch = new THREE.PointLight(0xFFFFFF, 0, 10);
    macroTorch.position.set(2.5, 2.5, 3.5);
    scene.add(macroTorch);
    macroTorchRef.current = macroTorch;

    // 5. Hardwood Court Shadow Caster Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: themeMode === 'night' ? 0.45 : 0.25 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -2.4;
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
    let clock = new THREE.Clock();

    // Mouse movement parallax listener
    const handleGlobalPointerMove = (e: PointerEvent) => {
      // Normalized between -1 and 1
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseParallaxRef.current = { x: nx, y: ny };
    };

    // Scroll acceleration listener: boosts rotational momentum on scroll
    const handleGlobalWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const impulse = Math.sign(delta) * Math.min(Math.max(Math.abs(delta) * 0.0006, 0.025), 0.075);
      rotationVelocityRef.current.y += impulse;
      rotationVelocityRef.current.x += (Math.random() - 0.5) * 0.006;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });

    renderer.setAnimationLoop(() => {
      const isPresenting = renderer.xr.isPresenting;
      const elapsedTime = clock.getElapsedTime();

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
          targetCamPos.current.x + px * 0.4,
          targetCamPos.current.y + py * 0.3,
          targetCamPos.current.z
        );
        cameraRef.current.position.lerp(camPosWithParallax, 0.05);

        const lookAtWithParallax = new THREE.Vector3(
          targetCamLook.current.x + px * 0.12,
          targetCamLook.current.y + py * 0.12,
          targetCamLook.current.z
        );
        cameraRef.current.lookAt(lookAtWithParallax);
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

      // === PREMIUM SLOW CONTINUOUS CONSTRUCTION / DECONSTRUCTION INTERPOLATION ===
      const targetProgress = explosionProgress;
      // Damping factor: 0.028 creates an ultra-smooth, slow, luxurious physical gliding feel
      currentExplosionProgressRef.current += (targetProgress - currentExplosionProgressRef.current) * 0.028;
      const curProg = currentExplosionProgressRef.current;

      // Update exploded layers vs solid assembled ball
      if (explodedGroupRef.current && assembledBallRef.current) {
        if (curProg < 0.008) {
          // Fully assembled solid ball
          assembledBallRef.current.visible = true;
          explodedGroupRef.current.visible = false;
        } else {
          // Animated exploded / constructing state
          assembledBallRef.current.visible = false;
          explodedGroupRef.current.visible = true;

          // 1. Outer 6 Curved Leather Panels
          outerPanelsRef.current.forEach((panel, idx) => {
            const angle = (idx / outerPanelsRef.current.length) * Math.PI * 2;
            const dir = new THREE.Vector3(
              Math.cos(angle) * (idx % 2 === 0 ? 1 : 0.85),
              (idx % 2 === 0 ? 0.75 : -0.75),
              Math.sin(angle) * (idx % 2 === 0 ? 1 : 0.85)
            ).normalize();

            // Distance expands from 0.02 to 2.8
            const dist = 0.02 + curProg * 2.8;
            panel.position.copy(dir.clone().multiplyScalar(dist));
            
            // Subtle rotation twist as panels glide in/out
            const twistAngle = curProg * 0.4 * (idx % 2 === 0 ? 1 : -1);
            panel.rotation.z = twistAngle;
            panel.scale.setScalar(1 + curProg * 0.12);

            const mat = panel.material as THREE.MeshStandardMaterial;
            if (selectedLayerId && selectedLayerId !== 'layer-outer') {
              mat.opacity = 0.3;
              mat.transparent = true;
            } else {
              mat.opacity = 1.0;
              mat.transparent = false;
            }
          });

          // 2. 4-Ply Polyamide Windings Layer
          if (windingsMeshRef.current) {
            const wScale = 1.0 + curProg * 0.35;
            windingsMeshRef.current.scale.setScalar(wScale);
            windingsMeshRef.current.rotation.y += 0.003; // Dynamic winding rotation
            const wMat = windingsMeshRef.current.material as THREE.MeshStandardMaterial;
            if (selectedLayerId && selectedLayerId !== 'layer-windings') {
              wMat.opacity = 0.25;
            } else {
              wMat.opacity = selectedLayerId === 'layer-windings' ? 1.0 : 0.88;
            }
          }

          // 3. Cushion Core Rubber Carcass
          if (carcassMeshRef.current) {
            const cScale = 1.0 + curProg * 0.2;
            carcassMeshRef.current.scale.setScalar(cScale);
            const cMat = carcassMeshRef.current.material as THREE.MeshStandardMaterial;
            if (selectedLayerId && selectedLayerId !== 'layer-carcass') {
              cMat.opacity = 0.3;
              cMat.transparent = true;
            } else {
              cMat.opacity = 1.0;
              cMat.transparent = false;
            }
          }

          // 4. Butyl Bladder Core
          if (bladderMeshRef.current) {
            const bScale = 1.0 + curProg * 0.08;
            bladderMeshRef.current.scale.setScalar(bScale);
            const bMat = bladderMeshRef.current.material as THREE.MeshStandardMaterial;
            if (selectedLayerId && selectedLayerId !== 'layer-bladder') {
              bMat.opacity = 0.35;
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
          // Natural rotational deceleration: dampens scroll surge smoothly back to steady ambient spin
          rotationVelocityRef.current.x *= 0.94;
          rotationVelocityRef.current.y *= 0.95;

          // Default slow ambient spin when calm
          if (Math.abs(rotationVelocityRef.current.y) < 0.003) {
            rotationVelocityRef.current.y = 0.003;
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
          const bounceDuration = 1.6;
          if (bounceElapsed < bounceDuration) {
            // Damped harmonic bounce equation
            const freq = 13;
            const decay = 2.8;
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
          const vrBaseY = 1.25 + ballPositionRef.current.y * 0.4;
          assembledBallRef.current.position.set(0, vrBaseY, -1.2);
          explodedGroupRef.current.position.set(0, vrBaseY, -1.2);
        } else {
          // Add subtle physical displacement and roll tilt following cursor parallax
          const posX = px * 0.22;
          const posY = ballPositionRef.current.y + py * 0.18;
          assembledBallRef.current.position.set(posX, posY, 0);
          explodedGroupRef.current.position.set(posX, posY, 0);

          // Subtle roll tilt following parallax
          assembledBallRef.current.rotation.z = -px * 0.05;
          explodedGroupRef.current.rotation.z = -px * 0.05;
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
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Accelerate rotation slightly whenever user navigates sections
  useEffect(() => {
    rotationVelocityRef.current.y += 0.04;
  }, [activeSection]);

  // Update Textures when Ball Config Changes
  useEffect(() => {
    if (!sceneRef.current) return;
    updateTextures(config);
  }, [config]);

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
