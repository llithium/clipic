import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactPlayer from "react-player";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { OpenComponent, SelectedFileList } from "@/lib/types";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { toggleFullscreen } from "@/lib/utils";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import SidePanel from "@/components/side-panel";
import Settings from "@/components/ui/settings";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import Home from "@/components/home";
import VideoPlayer from "@/components/video-player";
import { ACCEPTED_EXTENSIONS } from "@/lib/constants";
import { toFileList } from "@/lib/files";

export const Route = createLazyFileRoute("/")({
  component: Index,
});
let mouseMoveTimeout: NodeJS.Timeout;

function Index() {
  const {
    currentFileList,
    currentVideo,
    currentIndex,
    updateCurrentFileList,
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
    openComponent,
    toggleHome,
    updateIsUiVisible,
    playerReady,
  } = usePlayerStore();
  const { keybinds } = useSettingsStore();

  const videoRef = useRef<ReactPlayer>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

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
          updateCurrentFileList(updatedFileList, newIndex);
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
        const currentTime = videoRef.current?.getCurrentTime() || 0;
        videoRef.current?.seekTo(Math.max(currentTime - 5, 0), "seconds");
      }
      if (keybinds.seekForward.includes(event.key)) {
        event.preventDefault();
        const currentTime = videoRef.current?.getCurrentTime() || 0;
        videoRef.current?.seekTo(
          Math.min(currentTime + 5, videoRef.current.getDuration()),
          "seconds"
        );
      }
      if (keybinds.longSeekBackward.includes(event.key)) {
        event.preventDefault();
        const currentTime = videoRef.current?.getCurrentTime() || 0;
        videoRef.current?.seekTo(Math.max(currentTime - 30, 0), "seconds");
      }
      if (keybinds.longSeekForward.includes(event.key)) {
        event.preventDefault();
        const currentTime = videoRef.current?.getCurrentTime() || 0;
        videoRef.current?.seekTo(
          Math.min(currentTime + 30, videoRef.current.getDuration()),
          "seconds"
        );
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
    const draggable = draggableRef.current;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleScroll);
    draggable?.addEventListener("mousedown", handleDragMain);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleScroll);
      draggable?.removeEventListener("mousedown", handleDragMain);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [playerReady]);

  useEffect(() => {
    if (!playerReady) {
      return;
    }
    const handleMouseMove = () => {
      document.body.style.cursor = "default";
      updateIsUiVisible(true);

      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }

      mouseMoveTimeout = setTimeout(() => {
        updateIsUiVisible(false);
        document.body.style.cursor = "none";
      }, 3000);
    };

    const handleMouseExit = (event: MouseEvent) => {
      if (
        !event.relatedTarget ||
        (event.relatedTarget as Node).nodeName === "HTML"
      ) {
        updateIsUiVisible(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseExit);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseExit);

      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
    };
  }, [updateIsUiVisible, playerReady]);

  useEffect(() => {
    async function get_opened_file_args() {
      const files: [SelectedFileList, string] = await invoke(
        "get_opened_file_args"
      );
      if (files) {
        const index = files[0].findIndex((f) => f.filePath == files[1]);
        updateCurrentFileList(files[0], index);
      }
    }
    get_opened_file_args();
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal">
      <section
        className={`${
          openComponent === OpenComponent.Video && "w-full h-full"
        } transition-all`}
      >
        <VideoPlayer ref={videoRef} />
      </section>
      {openComponent === OpenComponent.Home && <Home />}
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
