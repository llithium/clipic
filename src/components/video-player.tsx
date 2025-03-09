import ReactPlayer from "react-player";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { OpenComponent, SelectedFileList } from "@/lib/types";
import PlayerControls from "@/components/player-controls";
import { MouseEvent, useEffect } from "react";
import { generateThumbnails } from "@/lib/utils";

export interface onProgressProps {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

function VideoPlayer({ ref }: { ref: React.RefObject<ReactPlayer | null> }) {
  const {
    openComponent,
    isMuted,
    isPlaying,
    currentVolume,
    nextVideo,
    loop,
    currentVideo,
    updateSliderValue,
    updatePlayedSeconds,
    updateVideoDuration,
    playPause,
    updatePlayerReady,
    addRecentlyPlayed,
    currentFileList,
    currentIndex,
    videoDuration,
    playerReady,
  } = usePlayerStore();

  function handleProgress(progress: onProgressProps) {
    updateSliderValue([progress.played]);
    updatePlayedSeconds(progress.playedSeconds);
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target == ref.current?.getInternalPlayer()) {
      playPause();
    }
  }
  useEffect(() => {
    if (!playerReady || videoDuration <= 0) {
      return;
    }
    const generateAndAddThumbnail = async () => {
      const withThumbnail: SelectedFileList = (await generateThumbnails([
        currentFileList[currentIndex],
      ])) as SelectedFileList;
      withThumbnail[0].duration = videoDuration;
      addRecentlyPlayed(withThumbnail[0]);
    };
    generateAndAddThumbnail();
  }, [videoDuration]);
  return (
    <div
      className={`w-full h-full ${
        openComponent !== OpenComponent.Video && "hidden"
      }`}
    >
      <div
        id="click-handler"
        onClick={handleClick}
        className={`relative w-full h-full z-10 select-none`}
      >
        <PlayerControls videoRef={ref} />
        <ReactPlayer
          ref={ref}
          onReady={() => updatePlayerReady(true)}
          style={{ position: "absolute" }}
          width={"100%"}
          height={"100%"}
          muted={isMuted}
          playing={openComponent !== OpenComponent.Video ? false : isPlaying}
          volume={currentVolume}
          progressInterval={50}
          onDuration={(duration) => {
            updateVideoDuration(duration);
          }}
          onProgress={(onProgressProps) => {
            handleProgress(onProgressProps);
          }}
          onEnded={nextVideo}
          url={currentVideo?.url}
          loop={loop}
        ></ReactPlayer>
      </div>
    </div>
  );
}

export default VideoPlayer;
