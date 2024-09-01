import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Icon } from "@iconify/react";
import { Slider } from "@/components/ui/slider";
import ReactPlayer from "react-player";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import * as path from "@tauri-apps/api/path";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectedFileList, usePlayerStore } from "@/hooks/usePlayerStore";
import {
  ContextMenu,
  // ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  // ContextMenuLabel,
  // ContextMenuRadioGroup,
  // ContextMenuRadioItem,
  // ContextMenuSeparator,
  ContextMenuShortcut,
  // ContextMenuSub,
  // ContextMenuSubContent,
  // ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
const appWindow = getCurrentWebviewWindow();
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
  } = usePlayerStore();

  const videoRef = useRef<ReactPlayer>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const video = videoRef.current;

  const getFiles = useCallback(async () => {
    const files =
      (await open({
        filters: [
          {
            name: "Video",
            extensions: [
              "mp4",
              "avi",
              "mkv",
              "mov",
              "flv",
              "webm",
              "wmv",
              "mpeg",
              "mkv",
            ],
          },
        ],
        multiple: true,
        directory: false,
      })) || [];

    const fileList: SelectedFileList = await toFileList(files);
    return fileList;
  }, []);

  const handleFiles = useCallback(async () => {
    const fileList: SelectedFileList = await getFiles();
    fileList.length > 0 && updateCurrentFileList(fileList);
  }, [getFiles, updateCurrentFileList]);

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

  const handleMute = useCallback(() => {
    if (isMuted && currentVolume === 0) {
      updateCurrentVolume(0.5);
      updateIsMuted(false);
    } else {
      updateIsMuted(!isMuted);
    }
  }, [currentVolume, isMuted, updateCurrentVolume, updateIsMuted]);

  async function handleFullscreen() {
    if (await appWindow.isFullscreen()) {
      appWindow.setFullscreen(false);
    } else {
      appWindow.setFullscreen(true);
    }
  }

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
        handleMute();
      }
      if (event.ctrlKey && event.key == "o") {
        event.preventDefault();
        handleFiles();
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
    async function handleDrag(event: MouseEvent) {
      if (event.target === event.currentTarget && event.buttons === 1) {
        event.detail === 2
          ? playPause()
          : await getCurrentWindow().startDragging();
      }
    }
    const draggable = draggableRef.current;

    window.addEventListener("keydown", handleKeyDown);

    window.addEventListener("wheel", handleScroll);
    draggable?.addEventListener("mousedown", handleDrag);

    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleScroll);
      draggable?.removeEventListener("mousedown", handleDrag);
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
    handleMute,
    handleFiles,
  ]);

  useEffect(() => {
    updateCurrentIndex(0);
  }, [currentFileList, updateCurrentIndex]);
  useEffect(() => {
    currentFileList &&
      updateCurrentVideo({
        name: currentFileList[currentIndex].fileName,
        url: convertFileSrc(currentFileList[currentIndex].filePath),
        extension: currentFileList[currentIndex].fileExtension,
      });
  }, [currentFileList, currentIndex, updateCurrentIndex, updateCurrentVideo]);

  useEffect(() => {
    currentFileList &&
      updateCurrentVideo({
        name: currentFileList[currentIndex].fileName,
        url: convertFileSrc(currentFileList[currentIndex].filePath),
        extension: currentFileList[currentIndex].fileExtension,
      });
    updateIsPlaying(true);
  }, [currentFileList, currentIndex, updateCurrentVideo, updateIsPlaying]);
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-screen w-screen">
        <div className="w-full h-full">
          {currentFileList?.length > 0 && currentFileList[0].filePath !== "" ? (
            <>
              <div
                ref={draggableRef}
                className={`absolute w-full h-full z-10 transition-opacity ease-out duration-300 opacity-0 hover:opacity-100 select-none`}
              >
                <div className="absolute top-0 w-full h-fit pt-2 pb-2 bg-gradient-to-b from-black/30">
                  <h1 className="scroll-m-20 text-md font-extrabold break-words tracking-tight lg:text-lg text-center text-neutral-50">
                    {currentVideo?.name}{" "}
                    {currentFileList.length > 1 &&
                      `[${currentIndex + 1}/${currentFileList.length}]`}
                  </h1>
                  <div className="absolute border-red-600 flex top-0 justify-end w-full items-center">
                    <Button
                      size="icon"
                      variant={"icon"}
                      className="bg-transparent rounded-none w-8 h-8 p-2 hover:bg-neutral-400/20"
                      onClick={() => appWindow.minimize()}
                    >
                      <Minus className="w-5 h-5 text-neutral-50" />
                    </Button>
                    <Button
                      size="icon"
                      variant={"icon"}
                      className="bg-transparent rounded-none w-7 h-7 p-2 hover:bg-neutral-400/20"
                      onClick={() => appWindow.toggleMaximize()}
                    >
                      <Square className="w-4 h-4 text-neutral-50" />
                    </Button>
                    <Button
                      size="icon"
                      variant={"icon"}
                      className="bg-transparent rounded-none w-8 h-8 p-2 hover:bg-red-700/80"
                      onClick={() => appWindow.close()}
                    >
                      <X className="w-5 h-5 text-neutral-50" />
                    </Button>
                  </div>
                </div>
                <div className="absolute bottom-0 pb-2 flex flex-col gap-2 w-full h-fit bg-gradient-to-t from-black/30">
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

                  <div className="flex items-center justify-between px-2">
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
                          <Icon
                            icon="mingcute:pause-fill"
                            className="h-8 w-8"
                          />
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
                        onClick={handleMute}
                      >
                        {isMuted ? (
                          <Icon
                            icon="mingcute:volume-mute-fill"
                            className="h-4 w-4"
                          />
                        ) : (
                          <Icon
                            icon="mingcute:volume-fill"
                            className="h-4 w-4"
                          />
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
                        <Icon
                          icon="mingcute:fullscreen-fill"
                          className="h-6 w-6"
                        />
                      </Button>
                    </div>
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
                className=""
                onProgress={(onProgressProps) => {
                  handleProgress(onProgressProps);
                }}
                onEnded={nextVideo}
                url={currentVideo?.url}
              ></ReactPlayer>
            </>
          ) : (
            <Button className="w-full h-full absolute" onClick={handleFiles}>
              Select Videos
            </Button>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onSelect={previousVideo} inset>
          Previous
          <ContextMenuShortcut></ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={nextVideo} inset>
          Next
          <ContextMenuShortcut></ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onSelect={handleMute} inset>
          Mute
          <ContextMenuShortcut>M</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleFullscreen} inset>
          Fullscreen
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleFiles} inset>
          Open Files
          <ContextMenuShortcut>Ctrl+O</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
