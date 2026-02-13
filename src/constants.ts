// Flow direction
export type FlowDirection = "LR" | "RL";
export const DEFAULT_FLOW_DIRECTION: FlowDirection = "LR";

// Node layout
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 120;

// Deterministic hash seeds (used in noise/mesh generation)
export const HASH_PRIME_A = 374761393;
export const HASH_PRIME_B = 668265263;
export const HASH_PRIME_C = 1103515245;
export const HASH_PRIME_D = 1274126177;
export const HASH_PRIME_E = 1013904223;

// World dimensions
export const DEFAULT_WORLD_HEIGHT = 256;

// Zoom bounds
export const MIN_ZOOM = 0.01;
export const MAX_ZOOM = 8;

// Evaluation timing
export const DEBOUNCE_MS = 500;
