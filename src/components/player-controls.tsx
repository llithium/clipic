import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatDuration, toggleFullscreen } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import ReactPlayer from "react-player";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Slider } from "./ui/slider";
import { useSettingsStore } from "@/hooks/useSettingsStore";

const tooltipWidth = 80;

function PlayerControls({ video }: { video: ReactPlayer | null }) {
  const {
    currentFileList,
    currentIndex,
    isPlaying,
    playedSeconds,
    videoDuration,
    currentVolume,
    isMuted,
    playPause,
    nextVideo,
    previousVideo,
    toggleMute,
    updateCurrentVolume,
    updateIsMuted,
    hoveredTime,
    currentTooltipLeft,
    sliderValue,
    updateCurrentTooltipLeft,
    updateHoveredTime,
    currentVideo,
    toggleLoop,
    loop,
  } = usePlayerStore();
  const { windowMovement } = useSettingsStore();
  function handleSeek(value: number[]) {
    video?.seekTo(value[0], "fraction");
  }

  const draggableRef = useRef<HTMLDivElement>(null);
  const draggableRef2 = useRef<HTMLDivElement>(null);

  function handleVolumeSlider(value: number[]) {
    updateCurrentVolume(value[0]);
    if (value[0] > 0) {
      updateIsMuted(false);
    } else {
      updateIsMuted(true);
    }
  }

  function handleSliderMouseMove(
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    const sliderElement = event.currentTarget;
    const { left, width } = sliderElement.getBoundingClientRect();
    const mouseX = event.clientX;
    const fraction = (mouseX - left) / width;
    const viewportWidth = sliderElement.offsetWidth + 28;

    let tooltipLeft = mouseX - viewportWidth / 2 - tooltipWidth / 2;

    if (tooltipLeft < 0 - viewportWidth / 2) {
      tooltipLeft = 0 - viewportWidth / 2;
    } else if (tooltipLeft + tooltipWidth > viewportWidth / 2) {
      tooltipLeft = viewportWidth / 2 - tooltipWidth;
    }

    updateCurrentTooltipLeft(tooltipLeft);

    const hoveredTime =
      video && formatDuration(video?.getDuration() * fraction);
    updateHoveredTime(hoveredTime || "0");
  }

  useEffect(() => {
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

    const draggable = draggableRef.current;
    const draggable2 = draggableRef2.current;

    draggable?.addEventListener("mousedown", handleDrag);
    draggable2?.addEventListener("mousedown", handleDrag);

    return () => {
      draggable?.removeEventListener("mousedown", handleDrag);
      draggable2?.removeEventListener("mousedown", handleDrag);
    };
  }, [playPause, windowMovement]);

  return (
    <div
      ref={draggableRef2}
      className={`absolute bottom-0 z-20 pb-2 pt-6 flex-col gap-2 w-full h-fit bg-gradient-to-t from-black/30 opacity-0 transition-opacity duration-700 ease-fast-out hover:opacity-100 ${
        !currentVideo?.name ? "hidden" : "flex"
      }`}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger className="px-4">
            <Slider
              className="py-2"
              max={1}
              step={0.00001}
              value={sliderValue}
              onValueChange={handleSeek}
              onMouseMove={handleSliderMouseMove}
            />
          </TooltipTrigger>
          <TooltipContent
            className="w-20 flex translate-y-2 justify-center"
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
        ref={draggableRef}
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
              <Icon icon="mingcute:skip-previous-line" className="h-8 w-8" />
            </Button>
          ) : null}
          <Button
            size="icon"
            variant={"icon"}
            className="bg-transparent rounded-full"
            onClick={playPause}
          >
            {isPlaying ? (
              <Icon icon="mingcute:pause-line" className="h-8 w-8" />
            ) : (
              <Icon icon="mingcute:play-line" className="h-8 w-8" />
            )}
          </Button>
          {currentIndex < currentFileList.length - 1 ? (
            <Button
              size="icon"
              variant={"icon"}
              className="bg-transparent rounded-full"
              onClick={nextVideo}
            >
              <Icon icon="mingcute:skip-forward-line" className="h-8 w-8" />
            </Button>
          ) : null}
          <span className="text-neutral-50">
            {formatDuration(playedSeconds)} / {formatDuration(videoDuration)}
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
              <Icon icon="mingcute:volume-mute-line" className="h-4 w-4" />
            ) : (
              <Icon icon="mingcute:volume-line" className="h-4 w-4" />
            )}
          </Button>
          <Slider
            className="w-20 cursor-pointer"
            max={1}
            step={0.01}
            value={isMuted ? [0] : [currentVolume]}
            onValueChange={handleVolumeSlider}
          />

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-center">
                <Button
                  size="icon"
                  variant={"icon"}
                  className="bg-transparent rounded-full w-8 h-8"
                  onClick={toggleLoop}
                >
                  <Icon
                    icon="mingcute:repeat-line"
                    className={`h-6 w-6 ${!loop && "opacity-25"}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Loop</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="icon"
            variant={"icon"}
            className="bg-transparent rounded-full w-8 h-8"
            onClick={toggleFullscreen}
          >
            <Icon icon="mingcute:fullscreen-line" className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PlayerControls;
