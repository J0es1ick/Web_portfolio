export function createPowerController({
  onChange,
  motionAllowed,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let state = "off";
  let desired = false;
  let timer = null;
  let generation = 0;
  const emit = (next) => {
    state = next;
    onChange(next);
  };
  function finish() {
    cancel(timer);
    timer = null;
    generation += 1;
    if (state === "booting" || state === "stopping")
      emit(desired ? "on" : "off");
  }
  function setPowered(on) {
    if (desired === on) return;
    desired = on;
    cancel(timer);
    const revision = ++generation;
    emit(on ? "booting" : "stopping");
    if (!motionAllowed()) return finish();
    timer = schedule(
      () => {
        if (revision === generation) finish();
      },
      on ? 1100 : 340,
    );
  }
  return {
    getState: () => state,
    setPowered,
    toggle: () => setPowered(!desired),
    syncMotion: () => {
      if (!motionAllowed()) finish();
    },
  };
}
