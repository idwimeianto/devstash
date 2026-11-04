import { describe, expect, it } from "vitest";

import {
  CHAOS_ICON_SIZE,
  createChaosBodies,
  CRUISE_SPEED,
  getChaosTransform,
  getFrameDelta,
  MAX_SPEED,
  REPEL_RADIUS,
  stepChaosBody,
  type ChaosBody,
} from "@/lib/chaos-physics";

const BOUNDS = { width: 400, height: 300 };

function body(overrides: Partial<ChaosBody> = {}): ChaosBody {
  return { x: 100, y: 100, vx: CRUISE_SPEED, vy: 0, rotation: 0, spin: 0, phase: 0, ...overrides };
}

const speedOf = ({ vx, vy }: ChaosBody) => Math.hypot(vx, vy);

describe("stepChaosBody", () => {
  it("moves by its velocity and keeps the cruising speed", () => {
    const next = stepChaosBody(body(), BOUNDS, null, 1);

    expect(next.x).toBeCloseTo(100 + CRUISE_SPEED);
    expect(next.y).toBe(100);
    expect(speedOf(next)).toBeCloseTo(CRUISE_SPEED);
  });

  it("bounces off the right and top walls, staying inside the box", () => {
    const maxX = BOUNDS.width - CHAOS_ICON_SIZE;
    const right = stepChaosBody(body({ x: maxX - 0.1 }), BOUNDS, null, 1);
    const top = stepChaosBody(body({ y: 0.1, vx: 0, vy: -CRUISE_SPEED }), BOUNDS, null, 1);

    expect(right.x).toBe(maxX);
    expect(right.vx).toBeLessThan(0);
    expect(top.y).toBe(0);
    expect(top.vy).toBeGreaterThan(0);
  });

  it("pushes the icon away from a pointer within the repel radius", () => {
    // The pointer sits 30px left of the icon's center, so the push is to the right.
    const center = 100 + CHAOS_ICON_SIZE / 2;
    const next = stepChaosBody(body({ vx: 0, vy: CRUISE_SPEED }), BOUNDS, { x: center - 30, y: center }, 1);

    expect(next.vx).toBeGreaterThan(0);
    expect(speedOf(next)).toBeGreaterThan(CRUISE_SPEED);
  });

  it("ignores a pointer outside the repel radius", () => {
    const center = 100 + CHAOS_ICON_SIZE / 2;
    const pointer = { x: center - REPEL_RADIUS - 1, y: center };

    expect(stepChaosBody(body(), BOUNDS, pointer, 1)).toEqual(stepChaosBody(body(), BOUNDS, null, 1));
  });

  it("caps the speed after a strong push", () => {
    const next = stepChaosBody(body({ vx: 10, vy: 10 }), BOUNDS, null, 1);

    expect(speedOf(next)).toBeCloseTo(MAX_SPEED);
  });

  it("eases back toward the cruising speed and never drops below it", () => {
    const fast = stepChaosBody(body({ vx: 1.5 }), BOUNDS, null, 1);
    const slow = stepChaosBody(body({ vx: 0.1 }), BOUNDS, null, 1);

    expect(speedOf(fast)).toBeCloseTo(1.5 * 0.97);
    expect(speedOf(slow)).toBeCloseTo(CRUISE_SPEED);
  });

  it("scales the movement and spin by the frame delta", () => {
    const next = stepChaosBody(body({ spin: 0.2 }), BOUNDS, null, 2);

    expect(next.x).toBeCloseTo(100 + CRUISE_SPEED * 2);
    expect(next.rotation).toBeCloseTo(0.4);
  });
});

describe("createChaosBodies", () => {
  it("spreads the bodies over two rows inside the box at the cruising speed", () => {
    const bodies = createChaosBodies(8, BOUNDS, () => 0.25);

    expect(bodies).toHaveLength(8);
    expect(bodies[0]).toMatchObject({ x: 0, y: 20 });
    expect(bodies[3].x).toBe(BOUNDS.width - CHAOS_ICON_SIZE);
    expect(bodies[4].y).toBe(BOUNDS.height - CHAOS_ICON_SIZE - 20);
    for (const created of bodies) expect(speedOf(created)).toBeCloseTo(CRUISE_SPEED);
  });
});

describe("getFrameDelta", () => {
  it("counts 60fps frames, treats no elapsed time as one frame and caps long gaps", () => {
    expect(getFrameDelta(1000 / 60)).toBeCloseTo(1);
    expect(getFrameDelta(0)).toBe(1);
    expect(getFrameDelta(1000)).toBe(3);
  });
});

describe("getChaosTransform", () => {
  it("translates to the body's position with its tilt and scale", () => {
    expect(getChaosTransform(body({ x: 10, y: 20, rotation: 5 }), 0)).toBe(
      "translate(10px, 20px) rotate(5deg) scale(1)",
    );
  });
});
