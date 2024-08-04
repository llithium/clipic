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

export const Route = createLazyFileRoute("/")({
  component: Index,
});

interface onProgressProps {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

type SelectedFileList = SelectedFile[];
interface SelectedFile {
  file_name: string;
  file_path: string;
  file_extension: string;
}
interface CurrentVideo {
  name: string;
  url: string;
  extension: string;
}

const tooltipWidth = 80;
const volumeStep = 0.05;

function Index() {
  const [currentFileList, setCurrentFileList] = useState<SelectedFileList>([
    { file_name: "", file_path: "", file_extension: "" },
  ]);
  const [currentVideo, setCurrentVideo] = useState<CurrentVideo>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sliderValue, setSliderValue] = useState([0]);
  const [hoveredTime, setHoveredTime] = useState("0");
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentVolume, setCurrentVolume] = useState(0.5);
  const [currentTooltipLeft, setCurrentTooltipLeft] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hideControlsTimeout, setHideControlsTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<ReactPlayer>(null);
  const video = videoRef.current;

  async function handleFiles() {
    if (currentFileList[0].file_path === "") {
      const fileList: SelectedFileList = await invoke("open_file_picker");
      setCurrentFileList(fileList);
    }
  }
  function handleEnded() {
    if (currentIndex < currentFileList.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  }
  function handlePlayPause() {
    setIsPlaying((prev) => !prev);
  }
  function handleMute() {
    if (isMuted && currentVolume === 0) {
      setCurrentVolume(0.5);
      setIsMuted(false);
    } else {
      setIsMuted((prev) => !prev);
    }
  }
  function handleKeyDown(event: KeyboardEvent) {
    console.log(event.key);

    if (event.key === " ") {
      event.preventDefault();
      setIsPlaying((prev) => !prev);
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
      video?.seekTo(currentTime - 5 < 0 ? 0 : currentTime - 5, "seconds");
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const currentTime = video?.getCurrentTime() || 0;
      video?.seekTo(
        currentTime + 5 > videoDuration ? videoDuration : currentTime + 5,
        "seconds"
      );
    }
    if (event.key === "j") {
      event.preventDefault();
      const currentTime = video?.getCurrentTime() || 0;
      video?.seekTo(currentTime - 30 < 0 ? 0 : currentTime - 30, "seconds");
    }
    if (event.key === "l") {
      event.preventDefault();
      const currentTime = video?.getCurrentTime() || 0;
      video?.seekTo(
        currentTime + 30 > videoDuration ? videoDuration : currentTime + 30,
        "seconds"
      );
    }
    if (event.key === "k") {
      event.preventDefault();
      handlePlayPause();
    }
    if (event.key === "m") {
      event.preventDefault();
      handleMute();
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

  function increaseVolumeByStep() {
    setIsMuted(false);
    if (currentVolume <= 0.95) {
      setCurrentVolume((prev) => prev + volumeStep);
    } else {
      setCurrentVolume(1);
    }
  }
  function decreaseVolumeByStep() {
    if (currentVolume >= volumeStep) {
      setCurrentVolume((prev) => prev - volumeStep);
    } else {
      setCurrentVolume(0);
      setIsMuted(true);
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
    setSliderValue([progress.played]);
    setPlayedSeconds(progress.playedSeconds);
  }

  function handleSeek(value: number[]) {
    video?.seekTo(value[0], "fraction");
  }
  function handleVolumeSlider(value: number[]) {
    console.log(value);
    setCurrentVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
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

  function handleMouseMove() {
    setControlsVisible(true);
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    setHideControlsTimeout(
      setTimeout(() => {
        setControlsVisible(false);
      }, 5000)
    );
  }

  function handleMouseLeave() {
    setControlsVisible(false);
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
  }
  function handleNext() {
    currentIndex < currentFileList.length - 1
      ? setCurrentIndex((prev) => prev + 1)
      : null;
  }

  function handlePrev() {
    currentIndex > 0 ? setCurrentIndex((prev) => prev - 1) : null;
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (event.target === event.currentTarget) {
      handlePlayPause();
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

    setCurrentTooltipLeft(tooltipLeft);

    const hoveredTime =
      video && formatDuration(video?.getDuration() * fraction);
    setHoveredTime(hoveredTime || "0");
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
          setCurrentFileList(fileList);
        }
      );
    }
    tauriListener();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("wheel", handleScroll);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("wheel", handleScroll);
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideControlsTimeout, currentVolume]);

  useEffect(() => {
    setCurrentIndex(0);
    currentFileList &&
      setCurrentVideo({
        name: currentFileList[currentIndex].file_name,
        url: convertFileSrc(currentFileList[currentIndex].file_path),
        extension: currentFileList[currentIndex].file_extension,
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFileList]);

  useEffect(() => {
    currentFileList &&
      setCurrentVideo({
        name: currentFileList[currentIndex].file_name,
        url: convertFileSrc(currentFileList[currentIndex].file_path),
        extension: currentFileList[currentIndex].file_extension,
      });
    setIsPlaying(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

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
              <TooltipProvider>
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
                      onClick={handlePrev}
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
                    onClick={handlePlayPause}
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
                      onClick={handleNext}
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
            onDuration={(duration) => setVideoDuration(duration)}
            className=""
            onProgress={(onProgressProps) => {
              handleProgress(onProgressProps);
            }}
            onEnded={handleEnded}
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
