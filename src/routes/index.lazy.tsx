import { Button } from "@/components/ui/button";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [isPlaying, setIsPlaying] = useState<boolean>();
  const video = document.querySelector("#videoElement") as HTMLVideoElement;
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
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }
  useEffect(() => {
    currentFileList &&
      setCurrentVideo(convertFileSrc(currentFileList[currentIndex]));
  }, [currentFileList, currentIndex]);

  return (
    <div className="w-full h-full">
      {currentFileList?.length > 0 ? (
        <>
          <div
            className="absolute w-full h-full z-50"
            onClick={handlePlayPause}
          >
            <div className="absolute bottom-2 w-full h-fit">
              <Button
                className="bg-transparent rounded-full"
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
            id="videoElement"
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
