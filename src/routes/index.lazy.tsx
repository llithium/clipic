import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Icon } from "@iconify/react";
import { Slider } from "@/components/ui/slider";
import ReactPlayer from "react-player";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [currentFileList, setCurrentFileList] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sliderValue, setSliderValue] = useState([0]);
  const videoRef = useRef<ReactPlayer>(null);
  const video = videoRef.current;
  async function handleFiles() {
    if (currentFileList.length === 0) {
      const fileList: string[] = await invoke("open_file_picker");
      setCurrentFileList(fileList);
    }
  }
  function handleEnded() {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  }
  function handlePlayPause() {
    setIsPlaying((prev) => !prev);
  }
  function handleKeyDown(event: KeyboardEvent) {
    console.log(event.key);

    if (event.key === " ") {
      event.preventDefault();
      setIsPlaying((prev) => !prev);
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
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    currentFileList &&
      setCurrentVideo(convertFileSrc(currentFileList[currentIndex]));
  }, [currentFileList, currentIndex]);

  useEffect(() => {
    console.log(isPlaying);
  }, [isPlaying]);
  return (
    <div className="w-full h-full" onDoubleClick={handlePlayPause}>
      {currentFileList?.length > 0 ? (
        <>
          <div className="absolute w-full h-full z-50">
            <div className="absolute bottom-2 w-full h-fit z-50">
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
              <Slider max={1} step={0.01} value={sliderValue} />
            </div>
          </div>

          <ReactPlayer
            ref={videoRef}
            style={{ position: "absolute" }}
            width={"100%"}
            height={"100%"}
            playing={isPlaying}
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
