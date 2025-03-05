import ReactPlayer from "react-player";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { OpenComponent } from "@/lib/types";
import PlayerControls from "@/components/player-controls";
import { MouseEvent } from "react";

export interface onProgressProps {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

function VideoPlayer({
  video,
  videoRef,
}: {
  video: ReactPlayer | null;
  videoRef: React.RefObject<ReactPlayer | null>;
}) {
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
  } = usePlayerStore();

  function handleProgress(progress: onProgressProps) {
    updateSliderValue([progress.played]);
    updatePlayedSeconds(progress.playedSeconds);
  }
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target == videoRef.current?.getInternalPlayer()) {
      playPause();
    }
  }
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
        <PlayerControls video={video} />
        <ReactPlayer
          ref={videoRef}
          style={{ position: "absolute" }}
          width={"100%"}
          height={"100%"}
          muted={isMuted}
          playing={openComponent !== OpenComponent.Video ? false : isPlaying}
          volume={currentVolume}
          progressInterval={50}
          onDuration={(duration) => updateVideoDuration(duration)}
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
