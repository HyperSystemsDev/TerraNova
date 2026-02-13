import type { DirectoryEntryData } from "@/utils/ipc";
import type { DirectoryEntry } from "@/stores/projectStore";

export default function mapDirEntry(entry: DirectoryEntryData): DirectoryEntry {
  return {
    name: entry.name,
    path: entry.path,
    isDir: entry.is_dir,
    children: entry.children?.map(mapDirEntry),
  };
}
