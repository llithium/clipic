import ReactPlayer from "react-player";
import { OpenComponent, usePlayerStore } from "@/hooks/usePlayerStore";
import PlayerControls from "@/components/player-controls";

interface onProgressProps {
  played: number;
  loaded: number;
  playedSeconds: number;
  loadedSeconds: number;
}

function VideoPlayer({
  draggableRef,
  draggableRef2,
  video,
  videoRef,
}: {
  draggableRef: React.RefObject<HTMLDivElement | null>;
  draggableRef2: React.RefObject<HTMLDivElement | null>;
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
    currentFileList,
    updateSliderValue,
    updatePlayedSeconds,
    updateVideoDuration,
  } = usePlayerStore();

  function handleProgress(progress: onProgressProps) {
    updateSliderValue([progress.played]);
    updatePlayedSeconds(progress.playedSeconds);
  }

  return (
    <div
      className={`w-full h-full ${
        openComponent !== OpenComponent.Video && "hidden"
      }`}
    >
      <div
        ref={draggableRef}
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
        <div
          id="draggableRef2"
          ref={draggableRef2}
          className={`relative w-full h-full z-10 select-none ${
            currentFileList.length === 0 && "cursor-pointer"
          }`}
        ></div>
      </div>
    </div>
  );
}

export default VideoPlayer;
