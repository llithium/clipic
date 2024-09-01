import { create } from "zustand";

export type SelectedFileList = SelectedFile[];
export interface SelectedFile {
  fileName: string;
  filePath: string;
  fileExtension: string;
}
export interface CurrentVideo {
  name: string;
  url: string;
  extension: string;
}

type State = {
  currentFileList: SelectedFileList;
  currentVideo: CurrentVideo | undefined;
  currentIndex: number;
  isPlaying: boolean;
  sliderValue: number[];
  hoveredTime: string;
  playedSeconds: number;
  videoDuration: number;
  controlsVisible: boolean;
  currentVolume: number;
  isMuted: boolean;
  currentTooltipLeft: number;
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
  updateControlsVisible: (state: boolean) => void;
  updateCurrentVolume: (state: number) => void;
  updateIsMuted: (state: boolean) => void;
  updateCurrentTooltipLeft: (state: number) => void;
  playPause: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  increaseVolumeByStep: () => void;
  decreaseVolumeByStep: () => void;
};

const volumeStep = 0.05;

export const usePlayerStore = create<State & Actions>((set) => ({
  currentFileList: [{ fileName: "", filePath: "", fileExtension: "" }],
  currentVideo: undefined,
  currentIndex: 0,
  isPlaying: true,
  sliderValue: [0],
  hoveredTime: "0",
  playedSeconds: 0,
  videoDuration: 0,
  controlsVisible: true,
  currentVolume: 0.5,
  isMuted: false,
  currentTooltipLeft: 0,
  updateCurrentFileList: (state) => set({ currentFileList: state }),
  updateCurrentVideo: (state) => set({ currentVideo: state }),
  updateCurrentIndex: (state) => set({ currentIndex: state }),
  updateIsPlaying: (state) => set({ isPlaying: state }),
  updateSliderValue: (state) => set({ sliderValue: state }),
  updateHoveredTime: (state) => set({ hoveredTime: state }),
  updatePlayedSeconds: (state) => set({ playedSeconds: state }),
  updateVideoDuration: (state) => set({ videoDuration: state }),
  updateControlsVisible: (state) => set({ controlsVisible: state }),
  updateCurrentVolume: (state) => set({ currentVolume: state }),
  updateIsMuted: (state) => set({ isMuted: state }),
  updateCurrentTooltipLeft: (state) => set({ currentTooltipLeft: state }),
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
  increaseVolumeByStep: () =>
    set((state) => ({
      currentVolume: Math.min(state.currentVolume + volumeStep, 1),
      isMuted: false,
    })),
  decreaseVolumeByStep: () =>
    set((state) => {
      if (state.currentVolume >= volumeStep) {
        return { currentVolume: state.currentVolume - volumeStep };
      } else {
        return { currentVolume: 0, isMuted: true };
      }
    }),
}));
