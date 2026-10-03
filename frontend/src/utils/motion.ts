// Strict Physics and Animation Budgets for VANI OS 6.0

// Physics constants based on critical dampening
export const OSPhysics = {
  // Snappy, immediate feedback (100ms budget)
  micro: {
    type: "spring",
    stiffness: 800,
    damping: 35,
    mass: 0.5,
  },
  // Structural transitions (350ms budget)
  panel: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
  // Massive depth layer changes (600ms budget)
  workspace: {
    type: "spring",
    stiffness: 150,
    damping: 25,
    mass: 1.5,
  }
};

// Common animation variants
export const FadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: OSPhysics.panel
};

export const SlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: OSPhysics.panel
};

export const SpatialDepth = (zOffset: number) => ({
  initial: { opacity: 0, z: zOffset + 50 },
  animate: { opacity: 1, z: zOffset },
  exit: { opacity: 0, z: zOffset - 50 },
  transition: OSPhysics.workspace
});
