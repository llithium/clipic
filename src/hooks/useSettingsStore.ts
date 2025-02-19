import { load } from "@tauri-apps/plugin-store";
import { create } from "zustand";
interface Keybinds {
  playPause: string;
  fullscreen: string;
  volumeUp: string;
  volumeDown: string;
  seekForward: string;
  seekBackward: string;
  longSeekForward: string;
  longSeekBackward: string;
  mute: string;
  openFiles: string;
  toggleSidePanel: string;
  toggleSettings: string;
  toggleHome: string;
}
type State = {
  windowMovement: string;
  keybinds: Keybinds;
};
type Actions = {
  updateWindowMovement: (state: string) => void;
  updateKeybinds: (state: Keybinds) => void;
};

const store = await load("store.json");
const windowMovement: string =
  (await store.get("window-movement")) || "titleBar";
const keybinds: Keybinds = (await store.get("keybinds")) || {
  playPause: "Space",
  fullscreen: "Enter",
  volumeUp: "ArrowUp",
  volumeDown: "ArrowDown",
  seekForward: "ArrowRight",
  seekBackward: "ArrowLeft",
  longSeekForward: "l",
  longSeekBackward: "j",
  mute: "m",
  openFiles: "o",
  toggleSidePanel: "s",
  toggleSettings: "p",
  toggleHome: "e",
};

export const useSettingsStore = create<State & Actions>((set) => ({
  windowMovement: windowMovement,
  keybinds: keybinds,
  updateWindowMovement: async (state) => {
    set({ windowMovement: state });
    await store.set("window-movement", state);
    await store.save();
  },
  updateKeybinds: async (state) => {
    set({ keybinds: state });
    await store.set("keybinds", state);
    await store.save();
  },
}));
