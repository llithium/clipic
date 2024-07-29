import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Icon } from "@iconify/react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [currentFileList, setCurrentFileList] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    const video = videoRef.current;
    if (video) {
      if (!video.paused) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.play();
        setIsPlaying(true);
      }
    }
  }
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === " ") {
      event.preventDefault();
      handlePlayPause();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dblclick", handlePlayPause);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dblclick", handlePlayPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    currentFileList &&
      setCurrentVideo(convertFileSrc(currentFileList[currentIndex]));
  }, [currentFileList, currentIndex]);

  return (
    <div className="w-full h-full">
      {currentFileList?.length > 0 ? (
        <>
          <div className="absolute w-full h-full z-50">
            <div className="absolute bottom-2 w-full h-fit z-50">
              <Button
                className="bg-transparent rounded-full z-50"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Icon icon="mingcute:pause-fill" />
                ) : (
                  <Icon icon="mingcute:play-fill" />
                )}
              </Button>
            </div>
          </div>

          <video
            ref={videoRef}
            className="w-full h-full absolute z-0"
            // controls
            autoPlay
            onEnded={handleEnded}
            src={currentVideo}
          ></video>
        </>
      ) : (
        <Button className="w-full h-full absolute" onClick={handleFiles}>
          Select Videos
        </Button>
      )}
    </div>
  );
}
