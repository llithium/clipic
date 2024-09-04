import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Icon } from "@iconify/react";
import { Slider } from "@/components/ui/slider";
import ReactPlayer from "react-player";
import * as path from "@tauri-apps/api/path";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectedFileList, usePlayerStore } from "@/hooks/usePlayerStore";

import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { handleFullscreen } from "@/lib/ui";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
export const Route = createLazyFileRoute("/")({
  component: Index,
});

interface onProgressProps {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

const tooltipWidth = 80;

function Index() {
  const {
    currentFileList,
    currentVideo,
    currentIndex,
    isPlaying,
    sliderValue,
    hoveredTime,
    playedSeconds,
    videoDuration,
    currentVolume,
    isMuted,
    updateCurrentFileList,
    updateCurrentVideo,
    updateCurrentIndex,
    updateIsPlaying,
    updateSliderValue,
    updateHoveredTime,
    updatePlayedSeconds,
    updateVideoDuration,
    updateCurrentVolume,
    updateIsMuted,
    currentTooltipLeft,
    updateCurrentTooltipLeft,
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
  const draggableRef4 = useRef<HTMLDivElement>(null);

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

  function handleSeek(value: number[]) {
    video?.seekTo(value[0], "fraction");
  }
  function handleVolumeSlider(value: number[]) {
    updateCurrentVolume(value[0]);
    if (value[0] > 0) {
      updateIsMuted(false);
    } else {
      updateIsMuted(true);
    }
  }

  function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const formattedHours = hours.toString().padStart(1, "0");
    const formattedMinutes = minutes
      .toString()
      .padStart(formattedHours !== "0" ? 2 : 1, "0");
    const formattedSeconds = secs.toString().padStart(2, "0");

    return `${formattedHours !== "0" ? formattedHours + ":" : ""}${formattedMinutes + ":"}${formattedSeconds}`;
  }

  function handleSliderMouseMove(
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    const sliderElement = event.currentTarget;
    const { left, width } = sliderElement.getBoundingClientRect();
    const mouseX = event.clientX;
    const fraction = (mouseX - left) / width;
    // const viewportWidth = window.innerWidth;
    const sliderWidth = sliderElement.getBoundingClientRect().width;

    let tooltipLeft = mouseX - sliderWidth / 2 - tooltipWidth / 2;

    if (tooltipLeft < 0 - sliderWidth / 2) {
      tooltipLeft = 0 - sliderWidth / 2;
    } else if (tooltipLeft + tooltipWidth > sliderWidth / 2) {
      tooltipLeft = sliderWidth / 2 - tooltipWidth;
    }

    updateCurrentTooltipLeft(tooltipLeft);

    const hoveredTime =
      video && formatDuration(video?.getDuration() * fraction);
    updateHoveredTime(hoveredTime || "0");
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
    const draggable4 = draggableRef4.current;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleScroll);
    draggable?.addEventListener("mousedown", handleDragMain);
    draggable2?.addEventListener("mousedown", handleDrag);
    draggable3?.addEventListener("mousedown", handleDrag);
    draggable4?.addEventListener("mousedown", handleDrag);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleScroll);
      draggable?.removeEventListener("mousedown", handleDragMain);
      draggable2?.removeEventListener("mousedown", handleDrag);
      draggable3?.removeEventListener("mousedown", handleDrag);
      draggable4?.removeEventListener("mousedown", handleDrag);
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
            <div
              ref={draggableRef4}
              className="absolute bottom-0 z-20 pb-2 pt-32 flex flex-col gap-2 w-full h-fit bg-gradient-to-t from-black/30 opacity-0 transition-opacity duration-500 ease-fast-out hover:opacity-100"
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger>
                    <Slider
                      max={1}
                      step={0.00001}
                      value={sliderValue}
                      onValueChange={handleSeek}
                      onMouseMove={handleSliderMouseMove}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    className="w-20 flex justify-center"
                    style={{
                      position: "absolute",
                      left: `${currentTooltipLeft}px`,
                      bottom: `10px`,
                      // transform: `translate(-${window.innerWidth / 2}px, -100%)`,
                      pointerEvents: "none",
                    }}
                  >
                    <span className="text-center w-16">{hoveredTime}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div
                ref={draggableRef3}
                className="flex items-center justify-between px-2 relative z-20"
              >
                <div className="flex gap-2 items-center">
                  {currentIndex > 0 ? (
                    <Button
                      size="icon"
                      variant={"icon"}
                      className="bg-transparent rounded-full"
                      onClick={previousVideo}
                    >
                      <Icon
                        icon="mingcute:skip-previous-fill"
                        className="h-8 w-8"
                      />
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant={"icon"}
                    className="bg-transparent rounded-full"
                    onClick={playPause}
                  >
                    {isPlaying ? (
                      <Icon icon="mingcute:pause-fill" className="h-8 w-8" />
                    ) : (
                      <Icon icon="mingcute:play-fill" className="h-8 w-8" />
                    )}
                  </Button>
                  {currentIndex < currentFileList.length - 1 ? (
                    <Button
                      size="icon"
                      variant={"icon"}
                      className="bg-transparent rounded-full"
                      onClick={nextVideo}
                    >
                      <Icon
                        icon="mingcute:skip-forward-fill"
                        className="h-8 w-8"
                      />
                    </Button>
                  ) : null}
                  <span className="text-neutral-50">
                    {formatDuration(playedSeconds)} /{" "}
                    {formatDuration(videoDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant={"icon"}
                    className="bg-transparent rounded-full w-7 h-7"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <Icon
                        icon="mingcute:volume-mute-fill"
                        className="h-4 w-4"
                      />
                    ) : (
                      <Icon icon="mingcute:volume-fill" className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    className="w-20"
                    max={1}
                    step={0.01}
                    value={isMuted ? [0] : [currentVolume]}
                    onValueChange={handleVolumeSlider}
                  />
                  <Button
                    size="icon"
                    variant={"icon"}
                    className="bg-transparent rounded-full w-8 h-8"
                    onClick={handleFullscreen}
                  >
                    <Icon icon="mingcute:fullscreen-fill" className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
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
        <div className="h-[calc(100vh-32px)] dark:bg-neutral-50 relative z-40 py-2 flex flex-col gap-1 overflow-y-auto">
          {currentFileList.map((video, i) => {
            return (
              <div
                key={i}
                className={`hover:opacity-80 cursor-pointer active:opacity-60 transition-all px-2 ${currentIndex === i && "bg-neutral-400/20"}`}
              >
                <div
                  className="text-xs overflow-hidden overflow-ellipsis whitespace-nowrap"
                  onClick={() => updateCurrentIndex(i)}
                >
                  <span>{i + 1}. </span> {video.fileName}
                </div>
              </div>
            );
          })}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
