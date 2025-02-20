import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import ReactPlayer from "react-player";
import * as path from "@tauri-apps/api/path";
import {
  OpenComponent,
  SelectedFileList,
  usePlayerStore,
} from "@/hooks/usePlayerStore";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { toggleFullscreen } from "@/lib/ui";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import PlayerControls from "@/components/player-controls";
import SidePanel from "@/components/side-panel";
import Settings from "@/components/ui/settings";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import { ACCEPTED_EXTENSIONS } from "@/lib/files";
import { generateThumbnails } from "@/lib/utils";
import Home from "@/components/home";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

interface onProgressProps {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

function Index() {
  const {
    currentFileList,
    currentVideo,
    currentIndex,
    isPlaying,
    videoDuration,
    currentVolume,
    isMuted,
    updateCurrentFileList,
    updateCurrentVideo,
    updateCurrentIndex,
    updateIsPlaying,
    updateSliderValue,
    updatePlayedSeconds,
    updateVideoDuration,
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
    isVideoHidden,
    loop,
    toggleLoop,
    recentlyPlayed,
    addRecentlyPlayed,
    openComponent,
    updateOpenComponent,
    toggleVideoHidden,
    toggleHome,
  } = usePlayerStore();
  const { windowMovement, keybinds } = useSettingsStore();

  const videoRef = useRef<ReactPlayer>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const draggableRef2 = useRef<HTMLDivElement>(null);
  const draggableRef3 = useRef<HTMLDivElement>(null);

  const video = videoRef.current;
  const sidePanelRef = useRef<HTMLDivElement>(null);

  const toFileList = async (array: string[]) => {
    return await Promise.all(
      array.map(async (file) => {
        return {
          fileName: await path.basename(file),
          filePath: file,
          fileExtension: await path.extname(file),
        };
      })
    );
  };

  function handleProgress(progress: onProgressProps) {
    updateSliderValue([progress.played]);
    updatePlayedSeconds(progress.playedSeconds);
  }
  useEffect(() => {
    async function get_opened_file_args() {
      const files: SelectedFileList = await invoke("get_opened_file_args");
      if (files) {
        updateCurrentFileList(files);
      }
    }
    get_opened_file_args();

    if (currentFileList.length === 1 && videoDuration <= 15) {
      if (!loop) {
        toggleLoop();
      }
    } else if (loop) {
      toggleLoop();
    }
  }, []);

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

      if (event.code === keybinds.playPause || event.key === "k") {
        event.preventDefault();
        playPause();
      }

      if (event.key === keybinds.fullscreen) {
        event.preventDefault();
        toggleFullscreen();
      }

      if (event.key === keybinds.volumeUp) {
        event.preventDefault();
        increaseVolumeByStep();
      }
      if (event.key === keybinds.volumeUp) {
        event.preventDefault();
        decreaseVolumeByStep();
      }
      if (event.key === keybinds.seekBackward) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.max(currentTime - 5, 0), "seconds");
      }
      if (event.key === keybinds.seekForward) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;

        video?.seekTo(Math.min(currentTime + 5, videoDuration), "seconds");
      }
      if (event.key === keybinds.longSeekBackward) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.max(currentTime - 30, 0), "seconds");
      }
      if (event.key === keybinds.longSeekForward) {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.min(currentTime + 30, videoDuration), "seconds");
      }

      if (event.key === keybinds.mute) {
        event.preventDefault();
        toggleMute();
      }

      if (event.ctrlKey && event.key == keybinds.openFiles) {
        event.preventDefault();
        openFiles();
      }

      if (event.ctrlKey && event.key == keybinds.toggleSidePanel) {
        event.preventDefault();
        toggleSidePanel();
      }

      if (event.ctrlKey && event.key == keybinds.toggleSettings) {
        event.preventDefault();
        toggleSettings();
      }
      if (event.ctrlKey && event.key == keybinds.toggleHome) {
        event.preventDefault();
        toggleHome();
      }
    }

    function handleScroll(event: WheelEvent) {
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

    async function handleDrag(event: MouseEvent) {
      if (windowMovement === "anywhere") {
        if (event.target === event.currentTarget && event.buttons === 1) {
          if (event.detail === 2) {
            playPause();
          } else if (!(await getCurrentWindow().isFullscreen())) {
            await getCurrentWindow().startDragging();
          }
        }
      }
    }
    async function handleDragMain(event: MouseEvent) {
      if (windowMovement === "anywhere") {
        if (currentFileList.length > 0) {
          if (event.target === event.currentTarget && event.buttons === 1) {
            if (event.detail === 2) {
              playPause();
            } else if (!(await getCurrentWindow().isFullscreen())) {
              await getCurrentWindow().startDragging();
            }
          }
        } else if (event.button === 0 && !currentVideo?.name) {
          openFiles();
        }
      } else {
        if (currentFileList.length > 0) {
          const target = event.target as HTMLDivElement;
          if (target.id === "draggableRef2" && event.buttons === 1) {
            playPause();
          }
        } else if (event.button === 0 && !currentVideo?.name) {
          openFiles();
        }
      }
    }
    const draggable = draggableRef.current;
    const draggable2 = draggableRef2.current;
    const draggable3 = draggableRef3.current;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleScroll);
    draggable?.addEventListener("mousedown", handleDragMain);
    draggable2?.addEventListener("mousedown", handleDrag);
    draggable3?.addEventListener("mousedown", handleDrag);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleScroll);
      draggable?.removeEventListener("mousedown", handleDragMain);
      draggable2?.removeEventListener("mousedown", handleDrag);
      draggable3?.removeEventListener("mousedown", handleDrag);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [
    currentVolume,
    updateCurrentFileList,
    isPlaying,
    videoDuration,
    playPause,
    increaseVolumeByStep,
    decreaseVolumeByStep,
    video,
    toggleMute,
    openFiles,
    previousVideo,
    nextVideo,
    currentFileList,
    toggleSidePanel,
    shortcutsDisabled,
    currentVideo,
    toggleSettings,
  ]);

  useEffect(() => {
    if (currentFileList) {
      updateCurrentVideo({
        name: currentFileList[currentIndex]?.fileName,
        url: convertFileSrc(currentFileList[currentIndex]?.filePath),
        extension: currentFileList[currentIndex]?.fileExtension,
      });
    }
  }, [
    currentFileList,
    currentIndex,
    updateCurrentIndex,
    updateCurrentVideo,
    updateIsPlaying,
    videoDuration,
  ]);

  useEffect(() => {
    async function recent() {
      if (currentFileList && currentFileList[currentIndex]) {
        const withThumbnail: SelectedFileList = (await generateThumbnails([
          currentFileList[currentIndex],
        ])) as SelectedFileList;
        addRecentlyPlayed(withThumbnail[0]);
      }
    }
    recent();
  }, [currentVideo, currentIndex, currentFileList, addRecentlyPlayed]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel id="video" order={1}>
        <div className={`w-full h-full ${isVideoHidden && "hidden"}`}>
          <div
            ref={draggableRef}
            className={`relative w-full h-full z-10 select-none`}
          >
            <PlayerControls video={video} />
            <ReactPlayer
              ref={videoRef}
              style={{ position: "absolute" }}
              width={"100%"}
              height={"100%"}
              muted={isMuted}
              playing={isVideoHidden ? false : isPlaying}
              volume={currentVolume}
              progressInterval={50}
              onDuration={(duration) => updateVideoDuration(duration)}
              onProgress={(onProgressProps) => {
                handleProgress(onProgressProps);
              }}
              onEnded={nextVideo}
              url={currentVideo?.url}
              loop={loop}
            ></ReactPlayer>
            <div
              id="draggableRef2"
              ref={draggableRef2}
              className={`relative w-full h-full z-10 select-none ${
                currentFileList.length === 0 && "cursor-pointer"
              }`}
            ></div>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle
        className={`rounded-tl-lg bg-border/50 relative z-50 h-[calc(100vh-40px)] translate-y-10 ${
          !isSidePanelOpen && "hidden"
        }`}
      />
      {openComponent === OpenComponent.Home && (
        <Home
          recentlyPlayed={recentlyPlayed}
          updateCurrentFileList={updateCurrentFileList}
          updateOpenComponent={updateOpenComponent}
          toggleVideoHiedden={toggleVideoHidden}
        />
      )}
      {openComponent === OpenComponent.Settings && <Settings />}
      {!isVideoHidden && (
        <ResizablePanel
          id="sidebar"
          className={`flex flex-col justify-end transition-all ${
            !isSidePanelOpen && "invisible translate-x-40"
          }`}
          defaultSize={20}
          minSize={20}
          maxSize={isSidePanelOpen ? 25 : 0}
          order={2}
        >
          <SidePanel ref={sidePanelRef} />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
