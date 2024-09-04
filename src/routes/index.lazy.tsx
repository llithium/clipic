import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import ReactPlayer from "react-player";
import * as path from "@tauri-apps/api/path";
import { SelectedFileList, usePlayerStore } from "@/hooks/usePlayerStore";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { handleFullscreen } from "@/lib/ui";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import BottomUI from "@/components/ui/bottom-ui";
import SidePanel from "@/components/ui/side-panel";
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
  } = usePlayerStore();

  const videoRef = useRef<ReactPlayer>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const draggableRef2 = useRef<HTMLDivElement>(null);
  const draggableRef3 = useRef<HTMLDivElement>(null);

  const video = videoRef.current;

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
    const unlisten = getCurrentWebview().onDragDropEvent(async (event) => {
      if (event.payload.type === "drop") {
        console.log("User dropped", event.payload.paths);

        const fileList: SelectedFileList = await toFileList(
          event.payload.paths
        );

        updateCurrentFileList(fileList);
      } else {
        console.log("File drop cancelled");
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      console.log(event.code);

      if (event.code === "Space" || event.key === "k") {
        event.preventDefault();
        playPause();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        handleFullscreen();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        increaseVolumeByStep();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        decreaseVolumeByStep();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.max(currentTime - 5, 0), "seconds");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;

        video?.seekTo(Math.min(currentTime + 5, videoDuration), "seconds");
      }
      if (event.key === "j") {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.max(currentTime - 30, 0), "seconds");
      }
      if (event.key === "l") {
        event.preventDefault();
        const currentTime = video?.getCurrentTime() || 0;
        video?.seekTo(Math.min(currentTime + 30, videoDuration), "seconds");
      }

      if (event.key === "m") {
        event.preventDefault();
        toggleMute();
      }

      if (event.ctrlKey && event.key == "o") {
        event.preventDefault();
        openFiles();
      }

      if (event.ctrlKey && event.key == "s") {
        event.preventDefault();
        toggleSidePanel();
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
      if (event.target === event.currentTarget && event.buttons === 1) {
        event.detail === 2
          ? playPause()
          : await getCurrentWindow().startDragging();
      }
    }
    async function handleDragMain(event: MouseEvent) {
      if (currentFileList.length > 0) {
        if (event.target === event.currentTarget && event.buttons === 1) {
          if (event.detail === 2) {
            playPause();
          } else {
            await getCurrentWindow().startDragging();
          }
        }
      } else if (event.button === 0) {
        openFiles();
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
  ]);

  useEffect(() => {
    updateCurrentIndex(0);
  }, [currentFileList, updateCurrentIndex]);

  useEffect(() => {
    currentFileList &&
      updateCurrentVideo({
        name: currentFileList[currentIndex]?.fileName,
        url: convertFileSrc(currentFileList[currentIndex]?.filePath),
        extension: currentFileList[currentIndex]?.fileExtension,
      });
  }, [currentFileList, currentIndex, updateCurrentIndex, updateCurrentVideo]);

  useEffect(() => {
    currentFileList &&
      updateCurrentVideo({
        name: currentFileList[currentIndex]?.fileName,
        url: convertFileSrc(currentFileList[currentIndex]?.filePath),
        extension: currentFileList[currentIndex]?.fileExtension,
      });
    updateIsPlaying(true);
  }, [currentFileList, currentIndex, updateCurrentVideo, updateIsPlaying]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>
        <div className="w-full h-full">
          <div
            ref={draggableRef}
            className={`relative w-full h-full z-10 select-none`}
          >
            <BottomUI video={video} />
            <ReactPlayer
              ref={videoRef}
              style={{ position: "absolute" }}
              width={"100%"}
              height={"100%"}
              muted={isMuted}
              playing={isPlaying}
              volume={currentVolume}
              progressInterval={50}
              onDuration={(duration) => updateVideoDuration(duration)}
              onProgress={(onProgressProps) => {
                handleProgress(onProgressProps);
              }}
              onEnded={nextVideo}
              url={currentVideo?.url}
            ></ReactPlayer>
            <div
              ref={draggableRef2}
              className={`relative w-full h-full z-10 select-none`}
            ></div>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle
        className={`relative z-50 w-[3px] h-[calc(100vh-32px)] translate-y-8 ${!isSidePanelOpen && "hidden"}`}
      />
      <ResizablePanel
        className={`flex flex-col justify-end ${!isSidePanelOpen && "hidden"}`}
        minSize={10}
        defaultSize={20}
      >
        <SidePanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
