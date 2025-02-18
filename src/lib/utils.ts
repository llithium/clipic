import { SelectedFileList } from "@/hooks/usePlayerStore";
import { invoke } from "@tauri-apps/api/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export async function generateThumbnails(videos: SelectedFileList) {
  try {
    const fileListWithThumbnails: SelectedFileList = await invoke(
      "generate_thumbnails",
      {
        videos: videos,
      }
    );
    return fileListWithThumbnails;
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
  }
}
