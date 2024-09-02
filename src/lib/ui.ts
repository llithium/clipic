import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const appWindow = getCurrentWebviewWindow();

export async function handleFullscreen() {
  if (await appWindow.isFullscreen()) {
    appWindow.setFullscreen(false);
  } else {
    appWindow.setFullscreen(true);
  }
}
