import { SelectedFileList } from "./types";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
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

const appWindow = getCurrentWebviewWindow();

export async function toggleFullscreen() {
  if (await appWindow.isFullscreen()) {
    appWindow.setFullscreen(false);
  } else {
    if (await appWindow.isMaximized()) {
      appWindow.unmaximize();
      appWindow.setFullscreen(true);
    } else {
      appWindow.setFullscreen(true);
    }
  }
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedHours = hours.toString().padStart(1, "0");
  const formattedMinutes = minutes
    .toString()
    .padStart(formattedHours !== "0" ? 2 : 1, "0");
  const formattedSeconds = secs.toString().padStart(2, "0");

  return `${formattedHours !== "0" ? formattedHours + ":" : ""}${
    formattedMinutes + ":"
  }${formattedSeconds}`;
}
