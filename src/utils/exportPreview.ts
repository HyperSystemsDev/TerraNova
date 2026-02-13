import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export async function exportCanvasAsPNG(canvas: HTMLCanvasElement): Promise<void> {
  const filePath = await save({
    filters: [{ name: "PNG Image", extensions: ["png"] }],
  });
  if (!filePath) return;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Failed to create image blob");
  const buffer = await blob.arrayBuffer();
  await writeFile(filePath, new Uint8Array(buffer));
}
