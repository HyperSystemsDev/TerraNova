import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useUpdateStore } from "@/stores/updateStore";
import { useToastStore } from "@/stores/toastStore";

let pendingUpdate: Update | null = null;

export async function checkForUpdates(): Promise<void> {
  const store = useUpdateStore.getState();
  if (store.status !== "idle") return;

  store.setStatus("checking");
  try {
    const update = await check();
    if (update) {
      pendingUpdate = update;
      store.setVersion(update.version);
      store.setStatus("available");
      useToastStore.getState().addToast(
        `Update v${update.version} available`,
        "info",
      );
    } else {
      store.setStatus("idle");
    }
  } catch {
    // Silently fail on network errors — no toast
    store.setStatus("idle");
  }
}

export async function downloadAndInstall(): Promise<void> {
  if (!pendingUpdate) return;

  const store = useUpdateStore.getState();
  store.setStatus("downloading");
  store.setProgress(0);

  try {
    let contentLength = 0;
    let downloaded = 0;

    await pendingUpdate.downloadAndInstall((event) => {
      if (event.event === "Started") {
        contentLength = event.data.contentLength ?? 0;
      } else if (event.event === "Progress") {
        downloaded += event.data.chunkLength;
        if (contentLength > 0) {
          useUpdateStore.getState().setProgress(
            Math.round((downloaded / contentLength) * 100),
          );
        }
      } else if (event.event === "Finished") {
        useUpdateStore.getState().setProgress(100);
      }
    });

    useUpdateStore.getState().setStatus("ready");
    useToastStore.getState().addToast("Update ready — restart to apply", "success");
  } catch (err) {
    useUpdateStore.getState().setError(String(err));
    useUpdateStore.getState().setStatus("idle");
    useToastStore.getState().addToast("Update download failed", "error");
    pendingUpdate = null;
  }
}

export async function restartToUpdate(): Promise<void> {
  await relaunch();
}
