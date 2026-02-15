import type { Node, Edge } from "@xyflow/react";
import { evaluateDensityVolume } from "../utils/volumeEvaluator";
import type { EvaluationOptions } from "../utils/densityEvaluator";
import type { VolumeWorkerRequest, VolumeWorkerResponse, VolumeWorkerError } from "../workers/volumeWorker";

const WORKER_TIMEOUT_MS = 30_000;

function isDebug(): boolean {
  try {
    return import.meta.env.DEV || localStorage.getItem("tn-debug-workers") === "1";
  } catch {
    return false;
  }
}

function log(...args: unknown[]) {
  if (isDebug()) console.log("[volumeWorkerClient]", ...args);
}

function warn(...args: unknown[]) {
  console.warn("[volumeWorkerClient]", ...args);
}

export interface VolumeEvalParams {
  nodes: Node[];
  edges: Edge[];
  resolution: number;
  rangeMin: number;
  rangeMax: number;
  yMin: number;
  yMax: number;
  ySlices: number;
  rootNodeId?: string;
  options?: EvaluationOptions;
}

export interface VolumeEvalResult {
  densities: Float32Array;
  resolution: number;
  ySlices: number;
  minValue: number;
  maxValue: number;
}

export interface VolumeWorkerInstance {
  evaluate: (params: VolumeEvalParams) => Promise<VolumeEvalResult>;
  cancel: () => void;
}

function evaluateOnMainThread(params: VolumeEvalParams): VolumeEvalResult {
  const result = evaluateDensityVolume(
    params.nodes,
    params.edges,
    params.resolution,
    params.rangeMin,
    params.rangeMax,
    params.yMin,
    params.yMax,
    params.ySlices,
    params.rootNodeId,
    params.options,
  );
  return {
    densities: result.densities,
    resolution: result.resolution,
    ySlices: result.ySlices,
    minValue: result.minValue,
    maxValue: result.maxValue,
  };
}

export function createVolumeWorkerInstance(): VolumeWorkerInstance {
  let worker: Worker | null = null;
  let workerFailed = false;
  let pendingReject: ((reason: unknown) => void) | null = null;

  function getWorker(): Worker | null {
    if (workerFailed) return null;
    if (!worker) {
      try {
        worker = new Worker(new URL("../workers/volumeWorker.ts", import.meta.url), {
          type: "module",
        });
        worker.addEventListener("error", (e) => {
          warn("Worker global error:", e.message);
        });
        log("Worker constructed successfully");
      } catch (err) {
        warn("Failed to construct Worker, will use main-thread fallback:", err);
        workerFailed = true;
        return null;
      }
    }
    return worker;
  }

  function cancel(): void {
    if (pendingReject) {
      pendingReject("cancelled");
      pendingReject = null;
    }
  }

  function evaluate(params: VolumeEvalParams): Promise<VolumeEvalResult> {
    cancel();

    const w = getWorker();
    if (!w) {
      log("Using main-thread fallback (worker unavailable)");
      return new Promise<VolumeEvalResult>((resolve, reject) => {
        try {
          resolve(evaluateOnMainThread(params));
        } catch (err) {
          reject(err);
        }
      });
    }

    return new Promise<VolumeEvalResult>((resolve, reject) => {
      pendingReject = reject;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const onMessage = (e: MessageEvent<VolumeWorkerResponse | VolumeWorkerError>) => {
        cleanup();
        if ("error" in e.data) {
          reject(new Error(e.data.error));
        } else {
          log("Worker returned result, densities length:", e.data.densities.length);
          resolve({
            densities: e.data.densities,
            resolution: e.data.resolution,
            ySlices: e.data.ySlices,
            minValue: e.data.minValue,
            maxValue: e.data.maxValue,
          });
        }
      };

      const onError = (e: ErrorEvent) => {
        cleanup();
        warn("Worker error during evaluation:", e.message);
        warn("Falling back to main-thread evaluation");
        try {
          resolve(evaluateOnMainThread(params));
        } catch (fallbackErr) {
          reject(fallbackErr);
        }
      };

      function cleanup() {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        w!.removeEventListener("message", onMessage);
        w!.removeEventListener("error", onError);
        if (pendingReject === reject) pendingReject = null;
      }

      w.addEventListener("message", onMessage);
      w.addEventListener("error", onError);

      timeoutId = setTimeout(() => {
        cleanup();
        warn(`Worker timed out after ${WORKER_TIMEOUT_MS}ms, falling back to main-thread evaluation`);
        try {
          resolve(evaluateOnMainThread(params));
        } catch (fallbackErr) {
          reject(fallbackErr);
        }
      }, WORKER_TIMEOUT_MS);

      const request: VolumeWorkerRequest = {
        nodes: params.nodes,
        edges: params.edges,
        resolution: params.resolution,
        rangeMin: params.rangeMin,
        rangeMax: params.rangeMax,
        yMin: params.yMin,
        yMax: params.yMax,
        ySlices: params.ySlices,
        rootNodeId: params.rootNodeId,
        options: params.options,
      };

      log("Posting message to worker, nodes:", params.nodes.length, "resolution:", params.resolution);
      w.postMessage(request);
    });
  }

  return { evaluate, cancel };
}

// ── Default singleton instance ──

const defaultInstance = createVolumeWorkerInstance();

export function cancelVolumeEvaluation(): void {
  defaultInstance.cancel();
}

export function evaluateVolumeInWorker(params: VolumeEvalParams): Promise<VolumeEvalResult> {
  return defaultInstance.evaluate(params);
}
