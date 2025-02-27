import { MAX_RECENTLY_PLAYED } from "@/lib/constants";
import { getFiles } from "@/lib/files";
import {
  SelectedFileList,
  CurrentVideo,
  SelectedFile,
  OpenComponent,
} from "@/lib/types";
import { load } from "@tauri-apps/plugin-store";
import { create } from "zustand";

type State = {
  currentFileList: SelectedFileList;
  currentVideo: CurrentVideo | undefined;
  currentIndex: number;
  isPlaying: boolean;
  sliderValue: number[];
  hoveredTime: string;
  playedSeconds: number;
  videoDuration: number;
  currentVolume: number;
  isMuted: boolean;
  currentTooltipLeft: number;
  isSidePanelOpen: boolean;
  shortcutsDisabled: boolean;
  loop: boolean;
  recentlyPlayed: SelectedFile[];
  openComponent: OpenComponent;
  previousComponent: OpenComponent;
};

type Actions = {
  updateCurrentFileList: (state: SelectedFileList) => void;
  updateCurrentVideo: (state: CurrentVideo) => void;
  updateCurrentIndex: (state: number) => void;
  updateIsPlaying: (state: boolean) => void;
  updateSliderValue: (state: number[]) => void;
  updateHoveredTime: (state: string) => void;
  updatePlayedSeconds: (state: number) => void;
  updateVideoDuration: (state: number) => void;
  updateCurrentVolume: (state: number) => void;
  updateIsMuted: (state: boolean) => void;
  updateCurrentTooltipLeft: (state: number) => void;
  updateShortcutsDisabled: (state: boolean) => void;
  updateOpenComponent: (state: OpenComponent) => void;

  playPause: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  increaseVolumeByStep: () => void;
  decreaseVolumeByStep: () => void;
  toggleSidePanel: () => void;
  toggleMute: () => void;
  openFiles: () => void;
  openDirectory: () => void;
  toggleSettings: () => void;
  toggleHome: () => void;
  toggleVideoHidden: () => void;
  toggleLoop: () => void;
  addRecentlyPlayed: (file: SelectedFile) => void;
};

const volumeStep = 0.05;
const store = await load("store.json", { autoSave: false });
const volume: number = (await store.get("volume")) || 0.5;
const sidePanel: boolean = (await store.get("side-panel")) || false;
const muted: boolean = (await store.get("muted")) || false;
const recent: SelectedFile[] = (await store.get("recent")) || [];

export const usePlayerStore = create<State & Actions>((set, get) => ({
  currentFileList: [],
  currentVideo: undefined,
  currentIndex: 0,
  isPlaying: true,
  sliderValue: [0],
  hoveredTime: "0",
  playedSeconds: 0,
  videoDuration: 0,
  currentVolume: volume,
  isMuted: muted,
  currentTooltipLeft: 0,
  isSidePanelOpen: sidePanel,
  shortcutsDisabled: false,
  loop: false,
  recentlyPlayed: recent,
  openComponent: OpenComponent.Home,
  previousComponent: OpenComponent.None,

  updateCurrentFileList: (state) => set({ currentFileList: state }),
  updateCurrentVideo: (state) => set({ currentVideo: state }),
  updateCurrentIndex: (state) => set({ currentIndex: state }),
  updateIsPlaying: (state) => set({ isPlaying: state }),
  updateSliderValue: (state) => set({ sliderValue: state }),
  updateHoveredTime: (state) => set({ hoveredTime: state }),
  updatePlayedSeconds: (state) => set({ playedSeconds: state }),
  updateVideoDuration: (state) => set({ videoDuration: state }),
  updateCurrentVolume: async (state) => {
    set({ currentVolume: state });
    await store.set("volume", state);
    await store.save();
  },
  updateIsMuted: async (state) => {
    set({ isMuted: state });
    await store.set("muted", state);
    await store.save();
  },
  updateCurrentTooltipLeft: (state) => set({ currentTooltipLeft: state }),
  updateShortcutsDisabled: (state) => set({ shortcutsDisabled: state }),

  playPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  nextVideo: () =>
    set((state) => ({
      currentIndex: Math.min(
        state.currentIndex + 1,
        state.currentFileList.length - 1
      ),
    })),
  previousVideo: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),
  increaseVolumeByStep: async () => {
    set((state) => ({
      currentVolume: Math.min(state.currentVolume + volumeStep, 1),
      isMuted: false,
    }));
    await store.set("volume", get().currentVolume);
    await store.save();
  },
  decreaseVolumeByStep: async () => {
    set((state) => {
      if (state.currentVolume >= volumeStep) {
        return { currentVolume: state.currentVolume - volumeStep };
      } else {
        return { currentVolume: 0, isMuted: true };
      }
    });
    await store.set("volume", get().currentVolume);
    await store.save();
  },
  toggleSidePanel: async () => {
    set((state) => ({ isSidePanelOpen: !state.isSidePanelOpen }));
    await store.set("side-panel", get().isSidePanelOpen);
    await store.save();
  },
  toggleMute: async () => {
    set((state) => {
      if (state.isMuted && state.currentVolume === 0) {
        state.currentVolume = 0.5;

        return { currentVolume: 0.5, isMuted: false };
      } else {
        return { isMuted: !state.isMuted };
      }
    });
    await store.set("muted", get().isMuted);
    await store.save();
  },
  openFiles: async () => {
    const fileList: SelectedFileList = await getFiles();
    if (fileList.length > 0) {
      set({
        currentFileList: fileList,
        openComponent: OpenComponent.Video,
        isPlaying: true,
        currentIndex: 0,
      });
    }
  },
  openDirectory: async () => {
    const fileList: SelectedFileList = await getFiles(true);
    if (fileList.length > 0) {
      set({
        currentFileList: fileList,
        openComponent: OpenComponent.Video,
        isPlaying: true,
        currentIndex: 0,
      });
    }
  },
  toggleSettings: () => {
    const currentComponent = get().openComponent;
    set(() => ({
      openComponent:
        currentComponent === OpenComponent.Settings
          ? get().previousComponent
          : OpenComponent.Settings,
      previousComponent: currentComponent,
    }));
  },
  toggleHome: () => {
    const currentComponent = get().openComponent;
    set(() => ({
      openComponent:
        currentComponent === OpenComponent.Home
          ? get().previousComponent
          : OpenComponent.Home,
      previousComponent: currentComponent,
    }));
  },
  toggleVideoHidden: () => {
    const currentComponent = get().openComponent;
    set(() => ({
      openComponent:
        currentComponent === OpenComponent.Home
          ? get().previousComponent
          : OpenComponent.Home,
      previousComponent: currentComponent,
    }));
  },
  toggleLoop: () => set((state) => ({ loop: !state.loop })),
  addRecentlyPlayed: async (file) => {
    set((state) => {
      const validRecentlyPlayed = state.recentlyPlayed.filter(
        (item) => item !== null && item !== undefined
      );

      const alreadyInList = validRecentlyPlayed.some(
        (item) => item.filePath === file.filePath
      );

      if (alreadyInList) {
        return { recentlyPlayed: validRecentlyPlayed };
      }

      const updatedList = [file, ...validRecentlyPlayed];
      if (updatedList.length > MAX_RECENTLY_PLAYED) {
        updatedList.pop();
      }
      return { recentlyPlayed: updatedList };
    });
    await store.set("recent", get().recentlyPlayed);
    await store.save();
  },
  updateOpenComponent: (state) => {
    const currentComponent = get().openComponent;
    set({
      previousComponent: currentComponent,
      openComponent: state,
    });
  },
}));
