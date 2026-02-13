import type { Node, Edge } from "@xyflow/react";
import type { EvaluationOptions } from "../utils/densityEvaluator";
import type { DensityWorkerRequest, DensityWorkerResponse, DensityWorkerError } from "../workers/densityWorker";

export interface EvalParams {
  nodes: Node[];
  edges: Edge[];
  resolution: number;
  rangeMin: number;
  rangeMax: number;
  yLevel: number;
  rootNodeId?: string;
  options?: EvaluationOptions;
}

export interface EvalResult {
  values: Float32Array;
  minValue: number;
  maxValue: number;
}

export interface WorkerInstance {
  evaluate: (params: EvalParams) => Promise<EvalResult>;
  cancel: () => void;
}

/**
 * Create an independent worker instance with its own evaluate/cancel pair.
 * Used by ComparisonView to run two evaluations in parallel.
 */
export function createWorkerInstance(): WorkerInstance {
  let worker: Worker | null = null;
  let pendingReject: ((reason: unknown) => void) | null = null;

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(new URL("../workers/densityWorker.ts", import.meta.url), {
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

  function evaluate(params: EvalParams): Promise<EvalResult> {
    cancel();

    return new Promise<EvalResult>((resolve, reject) => {
      pendingReject = reject;
      const w = getWorker();

      const onMessage = (e: MessageEvent<DensityWorkerResponse | DensityWorkerError>) => {
        cleanup();
        if ("error" in e.data) {
          reject(new Error(e.data.error));
        } else {
          resolve({
            values: e.data.values,
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

      const request: DensityWorkerRequest = {
        nodes: params.nodes,
        edges: params.edges,
        resolution: params.resolution,
        rangeMin: params.rangeMin,
        rangeMax: params.rangeMax,
        yLevel: params.yLevel,
        rootNodeId: params.rootNodeId,
        options: params.options,
      };

      w.postMessage(request);
    });
  }

  return { evaluate, cancel };
}

// ── Default singleton instance (used by the main preview) ──

const defaultInstance = createWorkerInstance();

/**
 * Cancel any in-flight evaluation. The promise from the previous
 * evaluateInWorker call will reject with "cancelled".
 */
export function cancelEvaluation(): void {
  defaultInstance.cancel();
}

/**
 * Evaluate the density grid in a background Web Worker.
 * Only one evaluation runs at a time — calling again cancels the previous.
 */
export function evaluateInWorker(params: EvalParams): Promise<EvalResult> {
  return defaultInstance.evaluate(params);
}
