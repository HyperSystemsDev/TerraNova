import type { Node, Edge } from "@xyflow/react";
import type { EvaluationOptions } from "../utils/densityEvaluator";
import type { VolumeWorkerRequest, VolumeWorkerResponse, VolumeWorkerError } from "../workers/volumeWorker";

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

export function createVolumeWorkerInstance(): VolumeWorkerInstance {
  let worker: Worker | null = null;
  let pendingReject: ((reason: unknown) => void) | null = null;

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(new URL("../workers/volumeWorker.ts", import.meta.url), {
        type: "module",
      });
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

    return new Promise<VolumeEvalResult>((resolve, reject) => {
      pendingReject = reject;
      const w = getWorker();

      const onMessage = (e: MessageEvent<VolumeWorkerResponse | VolumeWorkerError>) => {
        cleanup();
        if ("error" in e.data) {
          reject(new Error(e.data.error));
        } else {
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
        reject(new Error(e.message));
      };

      function cleanup() {
        w.removeEventListener("message", onMessage);
        w.removeEventListener("error", onError);
        if (pendingReject === reject) pendingReject = null;
      }

      w.addEventListener("message", onMessage);
      w.addEventListener("error", onError);

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
