import * as THREE from 'three';
import { BallConfig } from '../types';

/**
 * Creates high-fidelity procedural canvas textures for the 3D Basketball
 */

export interface GeneratedTextures {
  diffuseMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
}

export function generateBasketballTextures(config: BallConfig): GeneratedTextures {
  const width = 2048;
  const height = 1024;

  // 1. Diffuse Canvas (Color, panels, shading, hot stamp foil)
  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = width;
  diffuseCanvas.height = height;
  const ctxD = diffuseCanvas.getContext('2d')!;

  // Base leather fill with subtle radial shade
  const baseGrad = ctxD.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, config.leatherColor);
  baseGrad.addColorStop(0.5, config.leatherSecondaryColor);
  baseGrad.addColorStop(1, config.leatherColor);
  ctxD.fillStyle = baseGrad;
  ctxD.fillRect(0, 0, width, height);

  // Subtle noise/leather grain micro-shading
  const imgData = ctxD.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctxD.putImageData(imgData, 0, 0);

  // 2. Normal / Bump Canvas (Pebble texture + recessed seam channels)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const ctxB = bumpCanvas.getContext('2d')!;

  // Neutral bump background (128 gray = neutral height)
  ctxB.fillStyle = '#808080';
  ctxB.fillRect(0, 0, width, height);

  // Draw Pebble Grain on bump map & subtle tint on diffuse
  const pebbleStep = config.gripDensity === 'ultra-tack' ? 6 : config.gripDensity === 'deep-channel' ? 10 : 8;
  const pebbleRadius = config.gripDensity === 'ultra-tack' ? 2.5 : config.gripDensity === 'deep-channel' ? 3.8 : 3.0;

  for (let y = 0; y < height; y += pebbleStep) {
    const rowOffset = ((y / pebbleStep) % 2) * (pebbleStep / 2);
    for (let x = 0; x < width; x += pebbleStep) {
      const px = x + rowOffset + (Math.random() - 0.5) * 2;
      const py = y + (Math.random() - 0.5) * 2;

      // Draw raised bump
      const bumpGrad = ctxB.createRadialGradient(px, py, 0, px, py, pebbleRadius);
      bumpGrad.addColorStop(0, '#FFFFFF'); // high
      bumpGrad.addColorStop(0.7, '#A0A0A0');
      bumpGrad.addColorStop(1, '#808080'); // flat
      ctxB.fillStyle = bumpGrad;
      ctxB.beginPath();
      ctxB.arc(px, py, pebbleRadius, 0, Math.PI * 2);
      ctxB.fill();
    }
  }

  // 3. Roughness Canvas
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const ctxR = roughCanvas.getContext('2d')!;
  // Leather roughness (~0.75 / #BFBFBF)
  ctxR.fillStyle = '#C8C8C8';
  ctxR.fillRect(0, 0, width, height);

  // 4. Metalness Canvas
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = width;
  metalCanvas.height = height;
  const ctxM = metalCanvas.getContext('2d')!;
  ctxM.fillStyle = '#000000'; // Non-metallic leather
  ctxM.fillRect(0, 0, width, height);

  // Standard 8-panel basketball seam lines on UV projection
  // Seams include: Equator, Central Meridiens, and curved interlocking sinusoidal arcs
  const drawSeamPaths = (ctx: CanvasRenderingContext2D, lineWidth: number, strokeColor: string) => {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Equator horizontal line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.stroke();

    // 4 vertical meridians
    for (let i = 0; i < 4; i++) {
      const vx = (width / 4) * i + (width / 8);
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.lineTo(vx, height);
      ctx.stroke();
    }

    // Curved interlocking arcs (classic basketball curves)
    ctx.beginPath();
    ctx.moveTo(0, height * 0.15);
    ctx.bezierCurveTo(width * 0.25, height * 0.45, width * 0.75, height * 0.05, width, height * 0.35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height * 0.85);
    ctx.bezierCurveTo(width * 0.25, height * 0.55, width * 0.75, height * 0.95, width, height * 0.65);
    ctx.stroke();
  };

  // Carve Seams into Bump Map (Deep black = recessed groove)
  drawSeamPaths(ctxB, 18, '#101010');
  drawSeamPaths(ctxB, 10, '#000000');

  // Draw Seam color on Diffuse
  drawSeamPaths(ctxD, 14, config.seamColor);

  // Seam channels in Roughness (glossier in seams)
  drawSeamPaths(ctxR, 14, '#404040');

  // If metallic seam (e.g. 24K Gold)
  if (config.seamMetalness > 0.3) {
    drawSeamPaths(ctxM, 14, '#E0E0E0');
  }

  // Draw Luxury Hot-Stamp Foil Monogram & Brand Insignia
  const drawMonogram = () => {
    const stampX = width * 0.5;
    const stampY = height * 0.32;

    // Outer geometric crest
    ctxD.save();
    ctxD.translate(stampX, stampY);

    let foilColor = '#D4AF37'; // 24K Gold
    if (config.monogramFoil === 'silver') foilColor = '#E2E8F0';
    if (config.monogramFoil === 'rose-gold') foilColor = '#F472B6';
    if (config.monogramFoil === 'holographic') foilColor = '#38BDF8';

    // Crest frame
    ctxD.strokeStyle = foilColor;
    ctxD.lineWidth = 4;
    ctxD.strokeRect(-160, -90, 320, 180);

    // Inner double border
    ctxD.lineWidth = 1.5;
    ctxD.strokeRect(-152, -82, 304, 164);

    // Brand Name & Model
    ctxD.fillStyle = foilColor;
    ctxD.textAlign = 'center';
    ctxD.textBaseline = 'middle';

    ctxD.font = 'bold 22px "Cinzel", "Syne", serif';
    ctxD.letterSpacing = '8px';
    ctxD.fillText('THE KINETIC SPHERE', 0, -50);

    ctxD.font = '600 13px "Roboto Slab", serif';
    ctxD.fillText('PRO TOUR OFFICIAL // EDITION 01', 0, -26);

    // Custom Monogram Text
    const userText = (config.monogramText || 'KS-ELITE').toUpperCase();
    ctxD.font = 'bold 36px "Syne", "Roboto Slab", serif';
    ctxD.fillText(userText, 0, 10);

    // Serial & Spec
    ctxD.font = '500 11px "Roboto Slab", serif';
    ctxD.fillText(config.serialNumber || 'NO. 001 / 500 — ULTRA COMPOSITE', 0, 48);
    ctxD.fillText('7.5 - 8.5 PSI  |  29.5 INCH  |  620 GRAMS', 0, 68);

    ctxD.restore();

    // Mirror on the back hemisphere
    ctxD.save();
    ctxD.translate(width * 0.08, height * 0.72);
    ctxD.fillStyle = foilColor;
    ctxD.textAlign = 'center';
    ctxD.font = 'bold 16px "Cinzel", serif';
    ctxD.fillText('KINETIC LABS', 0, 0);
    ctxD.font = '11px "Roboto Slab", serif';
    ctxD.fillText('FIBA REGULATION SPEC', 0, 18);
    ctxD.restore();

    // Mask foil in metalness canvas
    ctxM.fillStyle = '#FFFFFF';
    ctxM.fillRect(stampX - 165, stampY - 95, 330, 190);

    // Glossier in roughness canvas
    ctxR.fillStyle = '#181818';
    ctxR.fillRect(stampX - 165, stampY - 95, 330, 190);

    // Emboss crest in Bump canvas
    ctxB.strokeStyle = '#FFFFFF';
    ctxB.lineWidth = 3;
    ctxB.strokeRect(stampX - 160, stampY - 90, 320, 180);
  };

  drawMonogram();

  // Convert to Three.js textures
  const diffuseMap = new THREE.CanvasTexture(diffuseCanvas);
  diffuseMap.colorSpace = THREE.SRGBColorSpace;
  diffuseMap.wrapS = THREE.RepeatWrapping;
  diffuseMap.wrapT = THREE.ClampToEdgeWrapping;

  const normalMap = new THREE.CanvasTexture(bumpCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;

  const metalnessMap = new THREE.CanvasTexture(metalCanvas);
  metalnessMap.wrapS = THREE.RepeatWrapping;
  metalnessMap.wrapT = THREE.ClampToEdgeWrapping;

  return {
    diffuseMap,
    normalMap,
    roughnessMap,
    metalnessMap,
  };
}

/**
 * Generates nylon windings layer texture (intricate high-tensile yarn lattice)
 */
export function generateNylonWindingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1A1815';
  ctx.fillRect(0, 0, 1024, 512);

  // Woven crossed thread lines in gold/amber nylon
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#D4AF37';

  for (let i = -1024; i < 2048; i += 12) {
    ctx.globalAlpha = 0.45 + (Math.random() * 0.3);
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + 512, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Generates butyl airtight bladder texture with inflation air valve marker
 */
export function generateBladderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1F1E24';
  ctx.fillRect(0, 0, 1024, 512);

  // Valve target circle
  const vx = 512;
  const vy = 256;

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(vx, vy, 30, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#0B0B0C';
  ctx.beginPath();
  ctx.arc(vx, vy, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(vx, vy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '10px "Roboto Slab", serif';
  ctx.textAlign = 'center';
  ctx.fillText('HIGH-GRADE BUTYL BLADDER', vx, vy + 48);
  ctx.fillText('MAX PRESSURE: 8.5 PSI / 0.58 BAR', vx, vy + 62);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}
