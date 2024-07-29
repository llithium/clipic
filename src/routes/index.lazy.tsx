import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Icon } from "@iconify/react";
import { Slider } from "@/components/ui/slider";
import ReactPlayer from "react-player";
import { appWindow } from "@tauri-apps/api/window";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [currentFileList, setCurrentFileList] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sliderValue, setSliderValue] = useState([0]);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<ReactPlayer>(null);
  const video = videoRef.current;

  async function handleFiles() {
    if (currentFileList.length === 0) {
      const fileList: string[] = await invoke("open_file_picker");
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
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === " ") {
      event.preventDefault();
      setIsPlaying((prev) => !prev);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleFullscreen();
    }
  }

  async function handleFullscreen() {
    if (await appWindow.isFullscreen()) {
      appWindow.setFullscreen(false);
    } else {
      appWindow.setFullscreen(true);
    }
  }
  interface onProgressProps {
    played: number;
    loaded: number;
    playedSeconds: number;
    loadedSeconds: number;
  }
  function handleProgress(progress: onProgressProps) {
    setSliderValue([progress.played]);
    setPlayedSeconds(progress.playedSeconds);
  }

  function handleSeek(value: number[]) {
    video?.seekTo(value[0], "fraction");
  }

  function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const formattedHours = hours.toString().padStart(1, "0");
    const formattedMinutes = minutes.toString().padStart(1, "0");
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
  useEffect(() => {
    async function tauriListener() {
      await appWindow.listen(
        "tauri://file-drop",
        ({ payload }: { payload: string[] }) => {
          setCurrentFileList(payload);
        }
      );
    }
    tauriListener();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideControlsTimeout]);

  useEffect(() => {
    setCurrentIndex(0);
    currentFileList &&
      setCurrentVideo(convertFileSrc(currentFileList[currentIndex]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFileList]);

  useEffect(() => {
    currentFileList &&
      setCurrentVideo(convertFileSrc(currentFileList[currentIndex]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <div className="w-full h-full" onDoubleClick={handlePlayPause}>
      {currentFileList?.length > 0 ? (
        <>
          <div
            className={`absolute w-full h-full z-50 transition-opacity ${controlsVisible || isPlaying === false ? "opacity-100" : "opacity-0"}`}
          >
            <div className="absolute bottom-0 pb-2 flex flex-col gap-2 w-full h-fit z-50">
              <Slider
                max={1}
                step={0.00001}
                value={sliderValue}
                onValueChange={handleSeek}
              />
              <div className="flex items-center">
                <Button
                  size="icon"
                  className="bg-transparent rounded-full z-50"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Icon icon="mingcute:pause-fill" className="h-8 w-8" />
                  ) : (
                    <Icon icon="mingcute:play-fill" className="h-8 w-8" />
                  )}
                </Button>
                <span className="text-white">
                  {formatDuration(playedSeconds)} /{" "}
                  {formatDuration(videoDuration)}
                </span>
                <Button
                  size="icon"
                  className="bg-transparent rounded-full z-50"
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
            playing={isPlaying}
            progressInterval={50}
            onDuration={(duration) => setVideoDuration(duration)}
            className=""
            onProgress={(onProgressProps) => {
              handleProgress(onProgressProps);
            }}
            onEnded={handleEnded}
            url={currentVideo}
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
