import * as THREE from 'three';
import { BallConfig } from '../types';

/**
 * High-fidelity 3D spherical surface math & procedural PBR textures for the Basketball.
 * Generates:
 *  - Albedo / Diffuse Map (2048x1024 sRGB)
 *  - True Tangent-Space RGB Normal Map (2048x1024 Linear)
 *  - Physically Calibrated Roughness Map (2048x1024 Linear)
 *  - Foil & Seam Metalness Map (2048x1024 Linear)
 */

export interface GeneratedTextures {
  diffuseMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
}

export interface SeamEvaluation {
  /** Minimum geodesic angular distance (in radians on unit sphere) to any of the 8-panel seams */
  distance: number;
  /** Signed displacement factor (-1 in deep groove center, +0.18 on panel lip welt, 0 on flat panel) */
  profileDisplacement: number;
  /** 0 inside seam channel, smoothly transitions to 1 on pebbled leather panel interior */
  pebbleMask: number;
  /** 1 inside seam rubber channel, 0 outside */
  channelMask: number;
  /** Ambient occlusion darkening factor along seam crease (0 = no darkening, 1 = max crease shadow) */
  creaseShadow: number;
  /** Which of the 8 panels (0..7) this point belongs to */
  panelIndex: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Evaluates the exact 3D regulation 8-panel basketball seam geometry at any unit sphere normal (nx, ny, nz).
 * Uses zero inverse-trig calls for the curved lateral seam via double-angle algebraic identities.
 */
export function evaluateBasketballSeam(
  nx: number,
  ny: number,
  nz: number,
  channelHalfWidth = 0.0135
): SeamEvaluation {
  const absNx = Math.abs(nx);
  const absNy = Math.abs(ny);

  // 1. Equator great-circle seam (ny = 0)
  const dEq = absNy < 0.25 ? absNy + (absNy * absNy * absNy) * 0.16667 : Math.asin(clamp(absNy, 0, 1));

  // 2. Vertical meridian great-circle seam (nx = 0)
  const dVert = absNx < 0.25 ? absNx + (absNx * absNx * absNx) * 0.16667 : Math.asin(clamp(absNx, 0, 1));

  // 3. Two symmetric interlocking lateral kidney/stadium loops centered around (nx = +-1, 0, 0)
  const rho = Math.acos(clamp(absNx, 0, 1)); // Angular distance from (+-1, 0, 0) in [0, PI/2]
  const ryz2 = ny * ny + nz * nz;

  let cos2A = 1.0;
  let sin2A = 0.0;
  if (ryz2 > 1e-7) {
    const invRyz2 = 1.0 / ryz2;
    cos2A = (nz * nz - ny * ny) * invRyz2;
    sin2A = (2.0 * ny * nz) * invRyz2;
  }
  const cos4A = 2.0 * cos2A * cos2A - 1.0;
  const sin4A = 2.0 * sin2A * cos2A;

  // Authentic NBA/FIBA 8-panel lateral loop profile R(alpha):
  // - Pinches to 0.78 rad at equator (alpha = 0, PI)
  // - Reaches 0.96 rad at top/bottom panel crowns (alpha = +-PI/2)
  // - Sweeps out to 1.06 rad along the 45-degree diagonals
  const R0 = 0.965;
  const R2 = -0.09;
  const R4 = -0.095;
  const targetR = R0 + R2 * cos2A + R4 * cos4A;

  // Derivative dR/d(alpha) for true geodesic distance normalization
  const dRdAlpha = -2.0 * R2 * sin2A - 4.0 * R4 * sin4A;
  const sinR = Math.sin(targetR);
  const slopeTerm = dRdAlpha / Math.max(0.25, sinR);
  const dLoop = Math.abs(rho - targetR) / Math.sqrt(1.0 + slopeTerm * slopeTerm);

  const dSeam = Math.min(dEq, Math.min(dVert, dLoop));

  // Panel classification (0..7)
  const panelIndex = (nx >= 0 ? 1 : 0) | (ny >= 0 ? 2 : 0) | (rho <= targetR ? 4 : 0);

  // Seam cross-section profile
  const lipWidth = 0.011;
  let profileDisplacement = 0;
  let channelMask = 0;
  let pebbleMask = 1;
  let creaseShadow = 0;

  if (dSeam < channelHalfWidth) {
    // Inside recessed rubber channel (parabolic U-groove)
    const t = dSeam / channelHalfWidth; // 0 at center, 1 at edge
    const u = 1.0 - t * t;
    profileDisplacement = -u * u;
    channelMask = 1.0 - smoothstep(0.78, 1.0, t);
    pebbleMask = 0;
    // Deep ambient occlusion at the channel wall
    creaseShadow = smoothstep(0.45, 0.95, t) * 0.65 + 0.25;
  } else if (dSeam < channelHalfWidth + lipWidth) {
    // Moulded composite leather welt / stitched lip bordering the channel
    const s = (dSeam - channelHalfWidth) / lipWidth; // 0 at channel edge, 1 at panel interior
    profileDisplacement = Math.sin(s * Math.PI) * 0.18;
    channelMask = 0;
    pebbleMask = smoothstep(0.18, 0.92, s);
    creaseShadow = (1.0 - smoothstep(0.0, 0.45, s)) * 0.55;
  }

  return {
    distance: dSeam,
    profileDisplacement,
    pebbleMask,
    channelMask,
    creaseShadow,
    panelIndex,
  };
}

/**
 * Fast deterministic 2D hash for organic pebble jitter and micro-grain variation
 */
function hash2D(ix: number, iy: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function generateBasketballTextures(config: BallConfig): GeneratedTextures {
  const width = 2048;
  const height = 1024;
  const totalPixels = width * height;

  // 1. Create target canvases
  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = width;
  diffuseCanvas.height = height;
  const ctxD = diffuseCanvas.getContext('2d')!;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const ctxN = normalCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const ctxR = roughCanvas.getContext('2d')!;

  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = width;
  metalCanvas.height = height;
  const ctxM = metalCanvas.getContext('2d')!;

  // 2. Render Hot-Stamp Monogram & Back Technical Stamp onto an offscreen mask canvas
  // so that only actual foil strokes become metallic, glossy, and debossed into the leather
  const foilMaskCanvas = document.createElement('canvas');
  foilMaskCanvas.width = width;
  foilMaskCanvas.height = height;
  const ctxFoil = foilMaskCanvas.getContext('2d')!;
  ctxFoil.clearRect(0, 0, width, height);

  const drawFoilStamps = (ctx: CanvasRenderingContext2D) => {
    // Primary Monogram Crest in Upper Front Panel (u = 0.5 -> phi = PI, v -> theta = 0.335 * PI)
    const stampX = width * 0.5;
    const stampY = height * 0.335;

    ctx.save();
    ctx.translate(stampX, stampY);
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer double-linechamfered luxury crest frame
    ctx.lineWidth = 3.5;
    ctx.strokeRect(-148, -78, 296, 156);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-140, -70, 280, 140);

    // Corner precision ticks
    const corners = [
      [-148, -78],
      [148, -78],
      [-148, 78],
      [148, 78],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
    }

    // Top Delta Emblem + Brand Header
    ctx.font = 'bold 19px "Cinzel", "Syne", serif';
    ctx.fillText('OXUS // KINETIC SPHERE', 0, -44);

    ctx.font = '600 11px "Roboto Slab", monospace';
    ctx.fillText('FIBA & NBA OFFICIAL CALIBRATION SPEC', 0, -23);

    // Horizontal divider lines flanking monogram
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-115, -10);
    ctx.lineTo(115, -10);
    ctx.stroke();

    // Custom User Monogram Text
    const userText = (config.monogramText || 'KS-ELITE').toUpperCase();
    ctx.font = 'bold 32px "Syne", "Cinzel", serif';
    ctx.fillText(userText, 0, 14);

    // Serial & Pressure Spec
    ctx.font = '500 10px "Roboto Slab", monospace';
    ctx.fillText(config.serialNumber || 'NO. 001 / 500 — ULTRA COMPOSITE', 0, 42);
    ctx.fillText('8.0 PSI NITROGEN  |  SIZE 7 (29.5")  |  624.5 G', 0, 58);
    ctx.restore();

    // Secondary Technical Stamp on opposite hemisphere (u = 0.0 / 1.0 wrap or u = 0.5 lower panel)
    // Placed in lower-back panel at u = 0.5, py = height * 0.665 (below equator, symmetric to top panel)
    ctx.save();
    ctx.translate(width * 0.5, height * 0.665);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Valve inflation target ring at (width * 0.5, height * 0.615)
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, -42, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = 'bold 14px "Cinzel", serif';
    ctx.fillText('KINETIC ATELIER LABS', 0, 4);
    ctx.font = '500 10px "Roboto Slab", monospace';
    ctx.fillText('MOISTEN NEEDLE  •  INFLATE TO 7.5 – 8.5 PSI', 0, 22);
    ctx.fillText('MICRO-PORED CROSS-LINKED COMPOSITE', 0, 36);
    ctx.restore();
  };

  drawFoilStamps(ctxFoil);
  const foilMaskData = ctxFoil.getImageData(0, 0, width, height).data;

  // 3. Precompute spherical trigonometry tables for all columns (phi) and rows (theta)
  const cosPhiTable = new Float32Array(width);
  const sinPhiTable = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    const phi = (x / width) * Math.PI * 2.0;
    cosPhiTable[x] = Math.cos(phi);
    sinPhiTable[x] = Math.sin(phi);
  }

  // Configure 3D geodesic hexagonal pebble lattice density
  const pebbleRows =
    config.gripDensity === 'ultra-tack' || config.gripDensity === 'custom'
      ? 148
      : config.gripDensity === 'nba'
      ? 136
      : config.gripDensity === 'deep-channel'
      ? 112
      : 124;
  const dTheta = Math.PI / pebbleRows;
  const invDTheta = 1.0 / dTheta;
  const channelHalfWidth = config.gripDensity === 'deep-channel' ? 0.0155 : 0.0132;
  const pebbleDepthScale = clamp(config.pebbleDepth ?? 0.85, 0.4, 1.4);

  // Parse material palette colors
  const [rPrimary, gPrimary, bPrimary] = parseHexColor(config.leatherColor || '#D45B10');
  const [rSecondary, gSecondary, bSecondary] = parseHexColor(config.leatherSecondaryColor || '#94380E');
  const [rSeam, gSeam, bSeam] = parseHexColor(config.seamColor || '#121316');

  let foilHex = '#D4AF37'; // 24K Gold
  if (config.monogramFoil === 'silver') foilHex = '#E2E8F0';
  if (config.monogramFoil === 'rose-gold') foilHex = '#F492B0';
  if (config.monogramFoil === 'holographic') foilHex = '#56CCF2';
  const [rFoil, gFoil, bFoil] = parseHexColor(foilHex);

  const baseRoughness = clamp(config.roughness ?? 0.65, 0.2, 0.95);
  const seamRoughness = clamp(config.seamRoughness ?? 0.38, 0.15, 0.9);
  const seamMetalness = clamp(config.seamMetalness ?? 0.1, 0.0, 1.0);

  // Allocate image buffers and floating-point heightfield for true tangent-space normal generation
  const diffuseImg = ctxD.createImageData(width, height);
  const roughImg = ctxR.createImageData(width, height);
  const metalImg = ctxM.createImageData(width, height);
  const dData = diffuseImg.data;
  const rData = roughImg.data;
  const mData = metalImg.data;
  const heightField = new Float32Array(totalPixels);

  // Valve center in spherical coordinates: u = 0.5 (phi = PI -> nx > 0, nz = 0), py = height * (0.665 - 42/1024)
  const valveTheta = (0.665 - 42 / height) * Math.PI;
  const valveNx = Math.sin(valveTheta);
  const valveNy = Math.cos(valveTheta);
  const valveNz = 0.0;

  // 4. Single-pass 3D Spherical Surface Synthesis
  for (let y = 0; y < height; y++) {
    const theta = ((y + 0.5) / height) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    // Geodesic latitude ring index for pebbles
    const rowIdx = Math.floor(theta * invDTheta);
    const rowCenterTheta = (rowIdx + 0.5) * dTheta;
    const sinRowCenter = Math.max(0.05, Math.sin(rowCenterTheta));
    // Number of pebbles around this parallel circle ensures isotropic 3D circular pebbles everywhere
    const colsInRow = Math.max(6, Math.round(2.0 * pebbleRows * sinRowCenter));
    const dPhi = (Math.PI * 2.0) / colsInRow;
    const invDPhi = 1.0 / dPhi;
    const rowPhaseShift = (rowIdx & 1) * 0.5 * dPhi;

    // Smoothly suppress pebble relief inside the monogram crest plate so foil stamp sits cleanly
    const inCrestBandY = y > height * 0.24 && y < height * 0.43;

    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      const idx4 = pixelIndex << 2;

      const cosPhi = cosPhiTable[x];
      const sinPhi = sinPhiTable[x];

      // Exact Three.js SphereGeometry unit normal (nx, ny, nz)
      const nx = -cosPhi * sinTheta;
      const ny = cosTheta;
      const nz = sinPhi * sinTheta;

      // Evaluate 3D 8-panel basketball seam
      const seam = evaluateBasketballSeam(nx, ny, nz, channelHalfWidth);

      // Evaluate 3D distance to inflation valve
      const dvx = nx - valveNx;
      const dvy = ny - valveNy;
      const dvz = nz - valveNz;
      const valveDist = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

      // Evaluate 3D isotropic hexagonal micro-pebble dome
      const phi = (x / width) * Math.PI * 2.0;
      const shiftedPhi = phi + rowPhaseShift;
      const colIdx = Math.floor(shiftedPhi * invDPhi);
      const wrappedCol = ((colIdx % colsInRow) + colsInRow) % colsInRow;

      // Deterministic cell jitter for natural organic leather grain
      const h1 = hash2D(rowIdx, wrappedCol);
      const h2 = hash2D(rowIdx + 1013, wrappedCol + 2029);
      const h3 = hash2D(x, y); // High-frequency micro-pore noise

      const cellCenterTheta = rowCenterTheta + (h1 - 0.5) * 0.24 * dTheta;
      const cellCenterPhi = (colIdx + 0.5 + (h2 - 0.5) * 0.24) * dPhi - rowPhaseShift;

      const dThetaPebble = (theta - cellCenterTheta) * invDTheta;
      const dPhiPebble = (phi - cellCenterPhi) * sinRowCenter * invDTheta;
      const distSqPebble = dThetaPebble * dThetaPebble + dPhiPebble * dPhiPebble;

      // Pebble radius in normalized cell units (~0.43 of cell spacing)
      const pebbleRad = 0.42 * (0.9 + 0.2 * h1);
      const pebbleRadSq = pebbleRad * pebbleRad;

      let pebbleDome = 0.0;
      if (distSqPebble < pebbleRadSq) {
        const q = distSqPebble / pebbleRadSq;
        const oneMinusQ = 1.0 - q;
        // Rounded convex dome with micro-pore dimple texture on top
        pebbleDome = Math.pow(oneMinusQ, 1.28) * (0.88 + 0.16 * h2);
      }

      // Attenuate pebbles near seams, valve collar, and under foil strokes
      const foilAlpha = foilMaskData[idx4 + 3] / 255.0;
      let localPebbleMask = seam.pebbleMask;

      if (valveDist < 0.026) {
        localPebbleMask *= smoothstep(0.016, 0.026, valveDist);
      }
      if (inCrestBandY && x > width * 0.42 && x < width * 0.58 && foilAlpha > 0.05) {
        localPebbleMask *= 1.0 - foilAlpha * 0.85;
      }

      const effectivePebble = pebbleDome * localPebbleMask * pebbleDepthScale;

      // Fine leather cellular micro-grain noise
      const microGrain = (h3 - 0.5) * 0.06 * localPebbleMask;

      // Combine into unified physical heightfield:
      // - Deep recessed seam groove (-1.15)
      // - Raised panel welt (+0.20)
      // - Convex micro-pebbles (+0.48)
      // - Debossed hot-stamp foil (-0.28)
      let totalHeight =
        seam.profileDisplacement * 1.15 +
        effectivePebble * 0.48 +
        microGrain -
        foilAlpha * 0.26;

      // Inflation valve rubber collar & needle hole relief
      let valveShadow = 0.0;
      let isValveRubber = 0.0;
      if (valveDist < 0.016) {
        isValveRubber = 1.0 - smoothstep(0.012, 0.016, valveDist);
        if (valveDist < 0.0045) {
          // Deep needle hole center
          totalHeight = -1.6;
          valveShadow = 0.9;
        } else {
          // Raised rubber valve grommet ring
          const ringT = (valveDist - 0.0045) / (0.016 - 0.0045);
          totalHeight = Math.sin(ringT * Math.PI) * 0.25 - 0.15;
          valveShadow = 0.35;
        }
      }

      heightField[pixelIndex] = totalHeight;

      // === ALBEDO / DIFFUSE COLOR SYNTHESIS ===
      // 1. Base leather gradient across spherical lighting & pebble topography
      // Pebble crowns catch warm primary leather tone; inter-pebble valleys shift toward secondary tone
      const crownMix = clamp(effectivePebble * 0.85 + 0.25 * (ny * 0.5 + 0.5), 0, 1);
      const valleyDarken = (1.0 - pebbleDome) * localPebbleMask * 0.16;
      const microColorNoise = (h3 - 0.5) * 10.0;

      let r = rSecondary + (rPrimary - rSecondary) * crownMix;
      let g = gSecondary + (gPrimary - gSecondary) * crownMix;
      let b = bSecondary + (bPrimary - bSecondary) * crownMix;

      // Subtle burnished highlight on pebble tops
      const pebbleHighlight = Math.max(0, pebbleDome - 0.55) * localPebbleMask * 26.0;
      r = r * (1.0 - valleyDarken) + pebbleHighlight + microColorNoise;
      g = g * (1.0 - valleyDarken) + pebbleHighlight * 0.85 + microColorNoise;
      b = b * (1.0 - valleyDarken) + pebbleHighlight * 0.65 + microColorNoise;

      // Crease ambient occlusion along seam borders
      if (seam.creaseShadow > 0) {
        const aoFactor = 1.0 - seam.creaseShadow * 0.52;
        r *= aoFactor;
        g *= aoFactor;
        b *= aoFactor;
      }

      // Blend recessed rubber seam channel
      if (seam.channelMask > 0) {
        const cm = seam.channelMask;
        // Subtle center sheen line in metallic seams
        const seamCenterHighlight = seamMetalness > 0.3 ? Math.max(0, 1.0 - seam.distance / (channelHalfWidth * 0.5)) * 28 : 0;
        const sr = rSeam + seamCenterHighlight + (h3 - 0.5) * 5;
        const sg = gSeam + seamCenterHighlight * 0.9 + (h3 - 0.5) * 5;
        const sb = bSeam + seamCenterHighlight * 0.7 + (h3 - 0.5) * 5;
        r = r * (1.0 - cm) + sr * cm;
        g = g * (1.0 - cm) + sg * cm;
        b = b * (1.0 - cm) + sb * cm;
      }

      // Blend black vulcanized rubber inflation valve
      if (isValveRubber > 0) {
        const vr = 18 * (1.0 - valveShadow);
        const vg = 19 * (1.0 - valveShadow);
        const vb = 22 * (1.0 - valveShadow);
        r = r * (1.0 - isValveRubber) + vr * isValveRubber;
        g = g * (1.0 - isValveRubber) + vg * isValveRubber;
        b = b * (1.0 - isValveRubber) + vb * isValveRubber;
      }

      // Blend Hot-Stamp Metallic Foil Inlay
      if (foilAlpha > 0) {
        // Holographic foil shifts hue across x/y; metallic gold/silver has subtle shimmer
        let fr = rFoil;
        let fg = gFoil;
        let fb = bFoil;
        if (config.monogramFoil === 'holographic') {
          const shift = Math.sin((x + y) * 0.035) * 38;
          fr = clamp(rFoil + shift, 0, 255);
          fg = clamp(gFoil - shift * 0.4, 0, 255);
          fb = clamp(bFoil + shift * 0.8, 0, 255);
        }
        r = r * (1.0 - foilAlpha) + fr * foilAlpha;
        g = g * (1.0 - foilAlpha) + fg * foilAlpha;
        b = b * (1.0 - foilAlpha) + fb * foilAlpha;
      }

      dData[idx4] = clamp(Math.round(r), 0, 255);
      dData[idx4 + 1] = clamp(Math.round(g), 0, 255);
      dData[idx4 + 2] = clamp(Math.round(b), 0, 255);
      dData[idx4 + 3] = 255;

      // === ROUGHNESS & METALNESS SYNTHESIS ===
      // Pebble tops are slightly burnished (lower roughness); valleys are matte (higher roughness)
      let rough = baseRoughness - pebbleDome * localPebbleMask * 0.14 + (1.0 - pebbleDome) * localPebbleMask * 0.12;
      let metal = clamp(config.metalness ?? 0.08, 0.0, 0.35) * localPebbleMask;

      if (seam.channelMask > 0) {
        rough = rough * (1.0 - seam.channelMask) + seamRoughness * seam.channelMask;
        metal = metal * (1.0 - seam.channelMask) + seamMetalness * seam.channelMask;
      }
      if (isValveRubber > 0) {
        rough = 0.45;
        metal = 0.05;
      }
      if (foilAlpha > 0) {
        // Mirror-like metallic foil stamp
        rough = rough * (1.0 - foilAlpha) + 0.16 * foilAlpha;
        metal = metal * (1.0 - foilAlpha) + 0.94 * foilAlpha;
      }

      const roughByte = clamp(Math.round(rough * 255), 0, 255);
      const metalByte = clamp(Math.round(metal * 255), 0, 255);

      rData[idx4] = roughByte;
      rData[idx4 + 1] = roughByte;
      rData[idx4 + 2] = roughByte;
      rData[idx4 + 3] = 255;

      mData[idx4] = metalByte;
      mData[idx4 + 1] = metalByte;
      mData[idx4 + 2] = metalByte;
      mData[idx4 + 3] = 255;
    }
  }

  // 5. Second Pass: Convert Floating-Point Heightfield into True Tangent-Space RGB Normal Map
  const normalImg = ctxN.createImageData(width, height);
  const nData = normalImg.data;
  const normalStrength = 3.2;

  for (let y = 0; y < height; y++) {
    const yUp = Math.max(0, y - 1) * width;
    const yDown = Math.min(height - 1, y + 1) * width;
    const yRow = y * width;

    for (let x = 0; x < width; x++) {
      const xLeft = (x - 1 + width) % width;
      const xRight = (x + 1) % width;

      // Central difference height gradients in tangent space
      const hL = heightField[yRow + xLeft];
      const hR = heightField[yRow + xRight];
      const hU = heightField[yUp + x];
      const hD = heightField[yDown + x];

      const dHdU = (hR - hL) * normalStrength;
      // In Canvas coordinates y increases downward, while OpenGL tangent V increases upward
      const dHdV = (hU - hD) * normalStrength;

      const invLen = 1.0 / Math.sqrt(dHdU * dHdU + dHdV * dHdV + 1.0);
      const tx = -dHdU * invLen;
      const ty = -dHdV * invLen;
      const tz = invLen;

      const idx4 = (yRow + x) << 2;
      nData[idx4] = clamp(Math.round((tx * 0.5 + 0.5) * 255), 0, 255);
      nData[idx4 + 1] = clamp(Math.round((ty * 0.5 + 0.5) * 255), 0, 255);
      nData[idx4 + 2] = clamp(Math.round((tz * 0.5 + 0.5) * 255), 0, 255);
      nData[idx4 + 3] = 255;
    }
  }

  ctxD.putImageData(diffuseImg, 0, 0);
  ctxN.putImageData(normalImg, 0, 0);
  ctxR.putImageData(roughImg, 0, 0);
  ctxM.putImageData(metalImg, 0, 0);

  // 6. Create Three.js CanvasTextures with anisotropic filtering & proper color spaces
  const diffuseMap = new THREE.CanvasTexture(diffuseCanvas);
  diffuseMap.colorSpace = THREE.SRGBColorSpace;
  diffuseMap.wrapS = THREE.RepeatWrapping;
  diffuseMap.wrapT = THREE.ClampToEdgeWrapping;
  diffuseMap.anisotropy = 8;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  normalMap.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  roughnessMap.anisotropy = 8;

  const metalnessMap = new THREE.CanvasTexture(metalCanvas);
  metalnessMap.colorSpace = THREE.NoColorSpace;
  metalnessMap.wrapS = THREE.RepeatWrapping;
  metalnessMap.wrapT = THREE.ClampToEdgeWrapping;
  metalnessMap.anisotropy = 8;

  return {
    diffuseMap,
    normalMap,
    roughnessMap,
    metalnessMap,
  };
}

/**
 * Generates geodesic 4-ply polyamide nylon windings texture (intricate multi-angle braided monofilament lattice)
 */
export function generateNylonWindingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark rubberized core base
  ctx.fillStyle = '#141311';
  ctx.fillRect(0, 0, 1024, 512);

  // Multi-angle geodesic nylon thread bundles
  const angles = [
    { slope: 512, color: '#D4AF37', width: 1.4, step: 10, alpha: 0.55 },
    { slope: -512, color: '#E5C158', width: 1.2, step: 10, alpha: 0.5 },
    { slope: 256, color: '#9CA3AF', width: 0.9, step: 14, alpha: 0.35 },
    { slope: -256, color: '#C4A478', width: 0.9, step: 14, alpha: 0.35 },
  ];

  for (const layer of angles) {
    ctx.lineWidth = layer.width;
    ctx.strokeStyle = layer.color;
    for (let i = -1024; i < 2048; i += layer.step) {
      ctx.globalAlpha = layer.alpha * (0.7 + 0.3 * Math.sin(i * 0.13));
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + layer.slope, 512);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Generates cellular elastomer cushion carcass texture with molded panel ribs
 */
export function generateCarcassTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const img = ctx.createImageData(width, height);
  const data = img.data;

  for (let y = 0; y < height; y++) {
    const theta = ((y + 0.5) / height) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let x = 0; x < width; x++) {
      const phi = (x / width) * Math.PI * 2;
      const nx = -Math.cos(phi) * sinTheta;
      const ny = cosTheta;
      const nz = Math.sin(phi) * sinTheta;

      const seam = evaluateBasketballSeam(nx, ny, nz, 0.014);
      const cellNoise = (hash2D(x >> 1, y >> 1) - 0.5) * 18;
      // Molded rubber seam ridges stand out darker on the cellular sponge carcass
      const base = seam.channelMask > 0.2 ? 16 : 36 + cellNoise;
      const idx = (y * width + x) << 2;
      data[idx] = clamp(base + 2, 0, 255);
      data[idx + 1] = clamp(base, 0, 255);
      data[idx + 2] = clamp(base + 4, 0, 255);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generates butyl airtight bladder texture with vulcanized molding seams & inflation air valve marker
 */
export function generateBladderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#18181C');
  grad.addColorStop(0.5, '#232329');
  grad.addColorStop(1, '#18181C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle vulcanized bladder meridian molding ridges
  ctx.strokeStyle = '#101014';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const mx = i * 256 + 128;
    ctx.beginPath();
    ctx.moveTo(mx, 0);
    ctx.lineTo(mx, 512);
    ctx.stroke();
  }

  // Valve housing target decal
  const vx = 512;
  const vy = 256;

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(vx, vy, 32, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#0B0B0C';
  ctx.beginPath();
  ctx.arc(vx, vy, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(vx, vy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9CA3AF';
  ctx.font = 'bold 11px "Roboto Slab", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HALOBUTYL AIR RETENTION CORE', vx, vy + 50);
  ctx.fillText('CALIBRATED: 8.0 PSI NITROGEN // <0.01% LOSS', vx, vy + 65);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
