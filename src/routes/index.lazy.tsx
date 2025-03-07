import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import ReactPlayer from "react-player";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { OpenComponent, SelectedFileList } from "@/lib/types";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { toggleFullscreen } from "@/lib/utils";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import SidePanel from "@/components/side-panel";
import Settings from "@/components/ui/settings";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import { generateThumbnails } from "@/lib/utils";
import Home from "@/components/home";
import VideoPlayer from "@/components/video-player";
import { ACCEPTED_EXTENSIONS } from "@/lib/constants";
import { toFileList } from "@/lib/files";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const {
    currentFileList,
    currentVideo,
    currentIndex,
    videoDuration,
    updateCurrentFileList,
    updateCurrentVideo,
    updateCurrentIndex,
    updateIsPlaying,
    playPause,
    nextVideo,
    previousVideo,
    increaseVolumeByStep,
    decreaseVolumeByStep,
    isSidePanelOpen,
    toggleSidePanel,
    toggleMute,
    openFiles,
    shortcutsDisabled,
    toggleSettings,
    recentlyPlayed,
    addRecentlyPlayed,
    openComponent,
    updateOpenComponent,
    toggleVideoHidden,
    toggleHome,
    updateIsUiVisible,
  } = usePlayerStore();
  const { keybinds } = useSettingsStore();

  const videoRef = useRef<ReactPlayer>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  const video = videoRef.current;
  const sidePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent(async (event) => {
      if (event.payload.type === "drop") {
        const fileList: SelectedFileList = (
          await toFileList(event.payload.paths)
        ).filter((f) => ACCEPTED_EXTENSIONS.includes(f.fileExtension));

        const mouseX = event.payload.position.x;
        const mouseY = event.payload.position.y;

        const sidePanelRect = sidePanelRef.current?.getBoundingClientRect();
        if (
          sidePanelRect &&
          mouseX >= sidePanelRect.left &&
          mouseX <= sidePanelRect.right &&
          mouseY >= sidePanelRect.top &&
          mouseY <= sidePanelRect.bottom
        ) {
          const sidePanelItems =
            sidePanelRef.current?.querySelectorAll(".draggable-item");
          let insertIndex = currentFileList.length;

          if (sidePanelItems) {
            for (let i = 0; i < sidePanelItems.length; i++) {
              const itemRect = sidePanelItems[i].getBoundingClientRect();
              if (mouseY < itemRect.top + itemRect.height / 2) {
                insertIndex = i;
                break;
              }
            }
          }
          const updatedFileList = [
            ...currentFileList.slice(0, insertIndex),
            ...fileList,
            ...currentFileList.slice(insertIndex),
          ];
          const currentVideoPath = currentFileList[currentIndex]?.filePath;
          const newIndex = updatedFileList.findIndex(
            (video) => video.filePath === currentVideoPath
          );

          updateCurrentFileList(updatedFileList);
          updateCurrentIndex(newIndex);
        } else {
          updateCurrentFileList(fileList);
        }
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (shortcutsDisabled) {
        return;
      }

      if (keybinds.playPause.includes(event.key)) {
        event.preventDefault();
        playPause();
      }

      if (keybinds.fullscreen.includes(event.key)) {
        event.preventDefault();
        toggleFullscreen();
      }

      if (keybinds.volumeUp.includes(event.key)) {
        event.preventDefault();
        increaseVolumeByStep();
      }
      if (keybinds.volumeDown.includes(event.key)) {
        event.preventDefault();
        decreaseVolumeByStep();
      }
      if (keybinds.seekBackward.includes(event.key)) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.max(currentTime - 5, 0), "seconds");
      }
      if (keybinds.seekForward.includes(event.key)) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;

        video?.seekTo(Math.min(currentTime + 5, videoDuration), "seconds");
      }
      if (keybinds.longSeekBackward.includes(event.key)) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.max(currentTime - 30, 0), "seconds");
      }
      if (keybinds.longSeekForward.includes(event.key)) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.min(currentTime + 30, videoDuration), "seconds");
      }

      if (keybinds.mute.includes(event.key)) {
        event.preventDefault();
        toggleMute();
      }

      if (event.ctrlKey && keybinds.openFiles.includes(event.key)) {
        event.preventDefault();
        openFiles();
      }

      if (event.ctrlKey && keybinds.toggleSidePanel.includes(event.key)) {
        event.preventDefault();
        toggleSidePanel();
      }

      if (event.ctrlKey && keybinds.toggleSettings.includes(event.key)) {
        event.preventDefault();
        toggleSettings();
      }
      if (event.ctrlKey && keybinds.toggleHome.includes(event.key)) {
        event.preventDefault();
        toggleHome();
      }
    }

    function handleScroll(event: WheelEvent) {
      const video = videoRef.current?.getInternalPlayer();
      if (video && !video.contains(event.target as Node)) {
        return;
      }

      if (event.deltaY === -100) {
        increaseVolumeByStep();
      }
      if (event.deltaY === 100) {
        decreaseVolumeByStep();
      }
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.button === 4) {
        nextVideo();
      } else if (event.button === 3) {
        previousVideo();
      }
    }

    async function handleDragMain(event: MouseEvent) {
      if (event.button === 0 && !currentVideo?.name) {
        openFiles();
      }
    }

    let mouseMoveTimeout: NodeJS.Timeout;
    function handleMouseMove() {
      document.body.style.cursor = "default";
      updateIsUiVisible(true);

      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }

      mouseMoveTimeout = setTimeout(() => {
        updateIsUiVisible(false);
        document.body.style.cursor = "none";
      }, 3000);
    }

    const draggable = draggableRef.current;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleScroll);
    draggable?.addEventListener("mousedown", handleDragMain);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleScroll);
      draggable?.removeEventListener("mousedown", handleDragMain);
      window.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
    };
  }, [
    currentFileList,
    currentIndex,
    currentVideo?.name,
    decreaseVolumeByStep,
    increaseVolumeByStep,
    keybinds.fullscreen,
    keybinds.longSeekBackward,
    keybinds.longSeekForward,
    keybinds.mute,
    keybinds.openFiles,
    keybinds.playPause,
    keybinds.seekBackward,
    keybinds.seekForward,
    keybinds.toggleHome,
    keybinds.toggleSettings,
    keybinds.toggleSidePanel,
    keybinds.volumeDown,
    keybinds.volumeUp,
    nextVideo,
    openFiles,
    playPause,
    previousVideo,
    shortcutsDisabled,
    toggleHome,
    toggleMute,
    toggleSettings,
    toggleSidePanel,
    updateCurrentFileList,
    updateCurrentIndex,
    updateIsUiVisible,
    video,
    videoDuration,
  ]);

  const updateFileListAndIndex = useCallback(
    (files: SelectedFileList, index: number) => {
      updateCurrentFileList(files);
      updateCurrentIndex(index);
    },
    [updateCurrentFileList, updateCurrentIndex]
  );

  useEffect(() => {
    async function get_opened_file_args() {
      const files: [SelectedFileList, string] = await invoke(
        "get_opened_file_args"
      );
      if (files) {
        updateFileListAndIndex(
          files[0],
          files[0].findIndex((f) => f.filePath == files[1])
        );
      }
    }
    get_opened_file_args();
  }, [updateFileListAndIndex]);

  useEffect(() => {
    if (currentFileList && currentFileList[currentIndex]) {
      updateCurrentVideo({
        name: currentFileList[currentIndex]?.fileName,
        url: convertFileSrc(currentFileList[currentIndex]?.filePath),
        extension: currentFileList[currentIndex]?.fileExtension,
      });
      if (currentFileList.length > 0) {
        updateOpenComponent(OpenComponent.Video);
      }
    }
  }, [currentFileList, currentIndex, updateCurrentVideo, updateOpenComponent]);

  useEffect(() => {
    async function recent() {
      if (currentFileList && currentFileList[currentIndex]) {
        const withThumbnail: SelectedFileList = (await generateThumbnails([
          currentFileList[currentIndex],
        ])) as SelectedFileList;
        withThumbnail[0].duration = video?.getDuration();
        addRecentlyPlayed(withThumbnail[0]);
      }
    }
    recent();
  }, [addRecentlyPlayed, currentFileList, currentIndex, video]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <section
        className={` ${
          openComponent === OpenComponent.Video && "w-full h-full"
        } transition-all`}
      >
        <VideoPlayer video={video} videoRef={videoRef} />
      </section>
      {openComponent === OpenComponent.Home && (
        <Home
          recentlyPlayed={recentlyPlayed}
          updateCurrentFileList={updateCurrentFileList}
          updateOpenComponent={updateOpenComponent}
          toggleVideoHidden={toggleVideoHidden}
          updateIsPlaying={updateIsPlaying}
          addRecentlyPlayed={addRecentlyPlayed}
        />
      )}
      {openComponent === OpenComponent.Settings && <Settings />}
      {openComponent === OpenComponent.Video && (
        <section
          className={`flex flex-col justify-end transition-all ${
            !isSidePanelOpen ? "invisible translate-x-80 w-0" : "w-[380px]"
          }`}
        >
          <SidePanel ref={sidePanelRef} />
        </section>
      )}
    </ResizablePanelGroup>
  );
}
