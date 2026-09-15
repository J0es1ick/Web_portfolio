import test from "node:test";
import assert from "node:assert/strict";
import { createPowerController } from "../power-state.js";

function fixture(motion = true) {
  const changes = [],
    pending = [],
    cancelled = [];
  const preference = { motion };
  const power = createPowerController({
    onChange: (state) => changes.push(state),
    motionAllowed: () => preference.motion,
    schedule: (callback, delay) => {
      pending.push({ callback, delay });
      return pending.length;
    },
    cancel: (timer) => cancelled.push(timer),
  });
  return { power, changes, pending, cancelled, preference };
}

test("power boots and shuts down without waiting for animation events", () => {
  const { power, changes, pending } = fixture();
  power.setPowered(true);
  assert.equal(power.getState(), "booting");
  pending[0].callback();
  assert.equal(power.getState(), "on");
  power.toggle();
  assert.equal(power.getState(), "stopping");
  pending[1].callback();
  assert.deepEqual(changes, ["booting", "on", "stopping", "off"]);
});

test("rapid toggles ignore obsolete callbacks and keep the latest switch state", () => {
  const { power, pending, cancelled } = fixture();
  power.toggle();
  power.toggle();
  power.toggle();
  pending[0].callback();
  pending[1].callback();
  assert.equal(power.getState(), "booting");
  pending[2].callback();
  assert.equal(power.getState(), "on");
  assert.ok(cancelled.includes(1));
  assert.ok(cancelled.includes(2));
});

test("reduced motion completes immediately and can interrupt an active boot", () => {
  const immediate = fixture(false);
  immediate.power.toggle();
  assert.equal(immediate.power.getState(), "on");
  immediate.power.toggle();
  assert.equal(immediate.power.getState(), "off");
  assert.equal(immediate.pending.length, 0);
  const active = fixture();
  active.power.toggle();
  active.preference.motion = false;
  active.power.syncMotion();
  assert.equal(active.power.getState(), "on");
  active.power.toggle();
  active.pending[0].callback();
  assert.equal(active.power.getState(), "off");
});
