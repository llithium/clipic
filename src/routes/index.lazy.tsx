import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Icon } from "@iconify/react";
import { Slider } from "@/components/ui/slider";
import ReactPlayer from "react-player";
import { appWindow } from "@tauri-apps/api/window";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SelectedFileList, usePlayerStore } from "@/lib/usePlayerStore";

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
    controlsVisible,
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
    updateControlsVisible,
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

  const [hideControlsTimeout, setHideControlsTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<ReactPlayer>(null);
  const video = videoRef.current;

  async function handleFiles() {
    if (currentFileList[0].file_path === "") {
      const fileList: SelectedFileList = await invoke("open_file_picker");
      updateCurrentFileList(fileList);
    }
  }

  function handleMute() {
    if (isMuted && currentVolume === 0) {
      updateCurrentVolume(0.5);
      updateIsMuted(false);
    } else {
      updateIsMuted(!isMuted);
    }
  }

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

  function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (event.target === event.currentTarget) {
      playPause();
    }
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
    async function tauriListener() {
      await appWindow.listen(
        "tauri://file-drop",
        async ({ payload }: { payload: string[] }) => {
          const fileList: SelectedFileList = await invoke(
            "open_dropped_files",
            {
              files: payload,
            }
          );
          updateCurrentFileList(fileList);
        }
      );
    }
    tauriListener();
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
    }

    function handleMouseMove() {
      updateControlsVisible(true);
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
      setHideControlsTimeout(
        setTimeout(() => {
          updateControlsVisible(false);
        }, 5000)
      );
    }

    function handleMouseLeave() {
      updateControlsVisible(false);
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
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

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("wheel", handleScroll);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("wheel", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVolume, updateCurrentFileList, isPlaying, videoDuration]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
  }, [hideControlsTimeout]);

  useEffect(() => {
    updateCurrentIndex(0);
    currentFileList &&
      updateCurrentVideo({
        name: currentFileList[currentIndex].file_name,
        url: convertFileSrc(currentFileList[currentIndex].file_path),
        extension: currentFileList[currentIndex].file_extension,
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFileList]);

  useEffect(() => {
    currentFileList &&
      updateCurrentVideo({
        name: currentFileList[currentIndex].file_name,
        url: convertFileSrc(currentFileList[currentIndex].file_path),
        extension: currentFileList[currentIndex].file_extension,
      });
    updateIsPlaying(true);
  }, [currentFileList, currentIndex, updateCurrentVideo, updateIsPlaying]);

  return (
    <div className="w-full h-full">
      {currentFileList?.length > 0 && currentFileList[0].file_path !== "" ? (
        <>
          <div
            className={`absolute w-full h-full z-10 transition-opacity  ${controlsVisible || isPlaying === false ? "opacity-100" : "opacity-0"}`}
            onClick={(e) => handleClick(e)}
          >
            <div className="absolute top-0 w-full h-fit pt-2 pb-2 bg-gradient-to-b from-black/30">
              <h1 className="scroll-m-20 text-md font-extrabold break-words tracking-tight lg:text-lg text-center text-neutral-50">
                {currentVideo?.name}
              </h1>
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
                    onClick={handleMute}
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
  );
}
