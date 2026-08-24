// Deterministic per-block "mesh gradient": several radial-gradient blobs,
// two per palette color (one wide asymmetric wash, one tighter saturated
// core), at pseudo-random positions/sizes - some bleeding past the box's
// edges so there's no flat untouched corner. The seed is derived from the
// block's own id so the same block always renders the same layout across
// reloads, while different blocks (different ids) get visibly different
// arrangements from the same palette.

export function hashSeed(key) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return hash || 1;
}

// mulberry32 - small, fast, good-enough PRNG for decorative positioning.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -10 to 110 so blobs can center off-canvas and bleed in from an edge,
// rather than every blob's center sitting fully inside the box.
function randomPercent(random) {
  return Math.round(-10 + random() * 120);
}

export function buildMeshGradient(seedKey, colors) {
  const palette = colors?.filter(Boolean).length ? colors.filter(Boolean) : ["255, 255, 255"];
  const random = createRandom(hashSeed(String(seedKey ?? "mesh")));

  const layers = palette.flatMap((color) => {
    const coreSizeX = Math.round(45 + random() * 45);
    const coreSizeY = Math.round(45 + random() * 45);
    const echoSize = Math.round(90 + random() * 70);
    return [
      `radial-gradient(${coreSizeX}% ${coreSizeY}% at ${randomPercent(random)}% ${randomPercent(random)}%, rgb(${color}) 0%, transparent 70%)`,
      `radial-gradient(circle at ${randomPercent(random)}% ${randomPercent(random)}%, rgb(${color}) 0%, transparent ${echoSize}%)`,
    ];
  });

  return {
    backgroundColor: `rgb(${palette[0]})`,
    backgroundImage: layers.join(", "),
  };
}
