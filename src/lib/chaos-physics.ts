// Physics for the homepage's floating "chaos" icons. Speeds are in px per 60fps frame.
export const CHAOS_ICON_SIZE = 56;
export const CRUISE_SPEED = 0.6;
// A gentle push with a low cap, so icons glide away from the cursor instead of darting off.
export const MAX_SPEED = 1.8;
export const REPEL_RADIUS = 120;
export const REPEL_FORCE = 0.25;
// Share of extra speed kept each frame while easing back to the cruising speed.
const SPEED_EASING = 0.97;
const FRAME_MS = 1000 / 60;
const MAX_FRAME_DELTA = 3;
const START_COLUMNS = 4;
const START_INSET = 20;

export interface ChaosBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  phase: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// Spread over two rows so icons don't overlap at first, each heading in a random direction.
export function createChaosBodies(
  count: number,
  { width, height }: Bounds,
  random: () => number = Math.random,
): ChaosBody[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    return {
      x: ((i % START_COLUMNS) * Math.max(width - CHAOS_ICON_SIZE, 0)) / (START_COLUMNS - 1),
      y: i < START_COLUMNS ? START_INSET : Math.max(height - CHAOS_ICON_SIZE - START_INSET, 0),
      vx: Math.cos(angle) * CRUISE_SPEED,
      vy: Math.sin(angle) * CRUISE_SPEED,
      rotation: random() * 30 - 15,
      spin: (random() - 0.5) * 0.3,
      phase: random() * Math.PI * 2,
    };
  });
}

// Frames elapsed at 60fps (1 = one frame), capped so a tab switch doesn't teleport icons.
export function getFrameDelta(elapsedMs: number): number {
  return Math.min(elapsedMs / FRAME_MS || 1, MAX_FRAME_DELTA);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Advances one body by `dt` frames: cursor repel, speed easing and wall bounces.
export function stepChaosBody(
  body: ChaosBody,
  { width, height }: Bounds,
  pointer: Point | null,
  dt: number,
): ChaosBody {
  let { vx, vy } = body;

  if (pointer) {
    const dx = body.x + CHAOS_ICON_SIZE / 2 - pointer.x;
    const dy = body.y + CHAOS_ICON_SIZE / 2 - pointer.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance < REPEL_RADIUS) {
      const push = (1 - distance / REPEL_RADIUS) * REPEL_FORCE * dt;
      vx += (dx / distance) * push;
      vy += (dy / distance) * push;
    }
  }

  const speed = Math.hypot(vx, vy) || 1;
  const target = clamp(speed * SPEED_EASING, CRUISE_SPEED, MAX_SPEED);
  vx = (vx / speed) * target;
  vy = (vy / speed) * target;

  let x = body.x + vx * dt;
  let y = body.y + vy * dt;
  const maxX = Math.max(width - CHAOS_ICON_SIZE, 0);
  const maxY = Math.max(height - CHAOS_ICON_SIZE, 0);
  if (x < 0 || x > maxX) {
    x = clamp(x, 0, maxX);
    vx = -vx;
  }
  if (y < 0 || y > maxY) {
    y = clamp(y, 0, maxY);
    vy = -vy;
  }

  return { ...body, x, y, vx, vy, rotation: body.rotation + body.spin * dt };
}

// Position plus a slow tilt and a ±6% scale pulse.
export function getChaosTransform(body: ChaosBody, time: number): string {
  const scale = 1 + Math.sin(time / 900 + body.phase) * 0.06;
  const tilt = body.rotation + Math.sin(time / 1300 + body.phase) * 6;
  return `translate(${body.x}px, ${body.y}px) rotate(${tilt}deg) scale(${scale})`;
}
