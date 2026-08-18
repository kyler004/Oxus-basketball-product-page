import React, { useEffect, useRef, useState } from 'react';
import { BallConfig } from '../types';
import { X, RotateCcw, Target, Trophy, Flame } from 'lucide-react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface CourtSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BallConfig;
}

export const CourtSandboxModal: React.FC<CourtSandboxModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);

  // Physics simulation state
  const ballState = useRef({
    x: 120,
    y: 340,
    vx: 0,
    vy: 0,
    radius: 20,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    inFlight: false,
    rotation: 0,
    rotationSpeed: 0,
  });

  const hoop = {
    x: 520,
    y: 160,
    rimRadius: 28,
    backboardX: 560,
    backboardY: 80,
    backboardHeight: 120,
  };

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let animationFrameId: number;
    const gravity = 0.38;
    const bounceDecay = 0.78;
    const floorY = 420;

    const resetBall = () => {
      ballState.current.x = 120 + Math.random() * 40;
      ballState.current.y = 340;
      ballState.current.vx = 0;
      ballState.current.vy = 0;
      ballState.current.inFlight = false;
      ballState.current.rotationSpeed = 0;
    };

    const updatePhysics = () => {
      const b = ballState.current;

      if (b.inFlight && !b.isDragging) {
        b.vy += gravity;
        b.x += b.vx;
        b.y += b.vy;
        b.rotation += b.rotationSpeed;

        // Floor collision
        if (b.y + b.radius >= floorY) {
          b.y = floorY - b.radius;
          b.vy = -b.vy * bounceDecay;
          b.vx *= 0.88;
          b.rotationSpeed *= 0.85;

          if (Math.abs(b.vy) > 1.2) {
            sound.playBounce(Math.min(Math.abs(b.vy) / 10, 1.0));
          }

          // Rest after bouncing
          if (Math.abs(b.vy) < 0.6 && Math.abs(b.vx) < 0.5) {
            setTimeout(resetBall, 700);
          }
        }

        // Backboard collision
        if (
          b.x + b.radius >= hoop.backboardX &&
          b.x - b.radius <= hoop.backboardX + 10 &&
          b.y >= hoop.backboardY &&
          b.y <= hoop.backboardY + hoop.backboardHeight
        ) {
          b.x = hoop.backboardX - b.radius;
          b.vx = -b.vx * 0.75;
          sound.playBounce(0.6);
        }

        // Rim collision (left rim tip)
        const leftRimX = hoop.x - hoop.rimRadius;
        const rimY = hoop.y;
        const dx = b.x - leftRimX;
        const dy = b.y - rimY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b.radius + 4) {
          const angle = Math.atan2(dy, dx);
          b.vx = Math.cos(angle) * 4;
          b.vy = Math.sin(angle) * 4;
          sound.playMetallicClick();
        }

        // Score detection: passing downward through the rim center
        if (
          b.x > hoop.x - hoop.rimRadius + 4 &&
          b.x < hoop.x + hoop.rimRadius - 4 &&
          b.y >= hoop.y - 6 &&
          b.y <= hoop.y + 12 &&
          b.vy > 0
        ) {
          // Swish!
          sound.playBounce(0.9);
          setScore((s) => s + 1);
          setStreak((st) => st + 1);
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { x: 0.75, y: 0.4 },
            colors: ['#D4AF37', '#FFFFFF'],
          });
        }
      }

      // Draw Court Scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Court background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0B0B0C');
      bgGrad.addColorStop(1, '#161619');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor hardwood
      ctx.fillStyle = '#1D1D22';
      ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(canvas.width, floorY);
      ctx.stroke();

      // Free throw arc decal on floor
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(280, floorY, 110, Math.PI, 0);
      ctx.stroke();

      // Backboard
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(hoop.backboardX, hoop.backboardY, 8, hoop.backboardHeight);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(hoop.backboardX, hoop.backboardY, 8, hoop.backboardHeight);

      // Target box inside backboard
      ctx.strokeStyle = '#D4AF37';
      ctx.strokeRect(hoop.backboardX - 1, hoop.y - 25, 6, 40);

      // Rim
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hoop.x - hoop.rimRadius, hoop.y);
      ctx.lineTo(hoop.x + hoop.rimRadius, hoop.y);
      ctx.stroke();

      // Net lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      for (let nx = -hoop.rimRadius + 4; nx <= hoop.rimRadius - 4; nx += 8) {
        ctx.beginPath();
        ctx.moveTo(hoop.x + nx, hoop.y);
        ctx.lineTo(hoop.x + nx * 0.6, hoop.y + 36);
        ctx.stroke();
      }

      // Drag Trajectory Guide
      if (b.isDragging) {
        const pullDx = b.dragStartX - b.x;
        const pullDy = b.dragStartY - b.y;

        ctx.strokeStyle = '#D4AF37';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + pullDx * 1.5, b.y + pullDy * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw 3D-styled Basketball
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);

      // Ball base gradient
      const ballGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, b.radius);
      ballGrad.addColorStop(0, config.leatherSecondaryColor || '#AA7C11');
      ballGrad.addColorStop(1, config.leatherColor || '#7C3414');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball seam lines
      ctx.strokeStyle = config.seamColor || '#121214';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 0.75, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-b.radius, 0);
      ctx.lineTo(b.radius, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -b.radius);
      ctx.lineTo(0, b.radius);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, config]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const b = ballState.current;
    const dist = Math.sqrt((px - b.x) ** 2 + (py - b.y) ** 2);

    if (dist < b.radius + 15 && !b.inFlight) {
      b.isDragging = true;
      b.dragStartX = px;
      b.dragStartY = py;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = ballState.current;
    if (!b.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    b.x = e.clientX - rect.left;
    b.y = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    const b = ballState.current;
    if (!b.isDragging) return;
    b.isDragging = false;

    // Compute shoot velocity
    const dx = b.dragStartX - b.x;
    const dy = b.dragStartY - b.y;

    b.vx = dx * 0.18;
    b.vy = dy * 0.18;
    b.rotationSpeed = -b.vx * 0.03; // Backspin
    b.inFlight = true;
    setAttempts((a) => a + 1);

    sound.playWhoosh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 pointer-events-auto">
      <div className="relative max-w-2xl w-full bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          id="close-court-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Scoreboard */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-lg font-bold text-white font-mono-tech">
                COURT PHYSICS SANDBOX
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-light">
              Drag the ball backwards to aim and release to test shot trajectory and backspin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/5 font-mono-tech text-xs">
              <span className="text-neutral-400 mr-2">MADE</span>
              <span className="text-[#D4AF37] font-bold text-sm">{score} / {attempts}</span>
            </div>
            {streak >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono-tech text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>{streak} STREAK</span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Physics Canvas */}
        <div className="rounded-xl overflow-hidden border border-white/10 relative bg-black shadow-inner flex justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={460}
            className="w-full h-auto cursor-crosshair touch-none select-none max-w-full"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          <div className="absolute top-3 left-3 px-3 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono-tech text-neutral-400 border border-white/10">
            DRAG & RELEASE TO SHOOT
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs font-mono-tech text-neutral-500">
            USING BESPOKE SPHERE: {config.leatherName.toUpperCase()}
          </span>

          <button
            id="reset-sandbox-score-btn"
            onClick={() => {
              sound.playMetallicClick();
              setScore(0);
              setAttempts(0);
              setStreak(0);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-tech text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET SCORE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
