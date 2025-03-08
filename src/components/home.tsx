import { OpenComponent } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { CircleMinus } from "lucide-react";

function Home() {
  const {
    openFiles,
    toggleSettings,
    updateCurrentFileList,
    updateCurrentIndex,
    updateIsPlaying,
    recentlyPlayed,
    addRecentlyPlayed,
    updateOpenComponent,
    removeRecentlyPlayed,
  } = usePlayerStore();
  return (
    <div className="flex flex-col w-full">
      <div className="pt-14 pb-4 px-4 w-full flex ">
        <h1 className="scroll-m-20 text-xl font-bold tracking-tight lg:text-2xl">
          Recently Played
        </h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={toggleSettings} variant={"outline"}>
            Settings
          </Button>
          <Button onClick={openFiles} variant={"outline"}>
            Open Files
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center  pb-4 px-4 gap-2 overflow-y-scroll">
        {recentlyPlayed.map((video, index) => (
          <div
            key={index}
            className="mt-4 group relative flex hover:bg-foreground/5 flex-col w-44 p-1 h-60 rounded-lg cursor-pointer gap-1"
            onClick={() => {
              updateCurrentFileList([recentlyPlayed[index]]);

              updateCurrentIndex(0);
              addRecentlyPlayed(recentlyPlayed[index]);
              updateOpenComponent(OpenComponent.Video);
              updateIsPlaying(true);
            }}
          >
            <img
              className="object-cover aspect-square w-44 h-44 rounded bg-secondary"
              src={convertFileSrc(video.thumbnailPath || "")}
              // alt={video.fileName}
            />
            <span className="px-1 font-semibold text-sm overflow-hidden text-ellipsis line-clamp-2">
              {video.fileName}
            </span>
            <span className="text-xs px-1 pb-1 text-muted-foreground">
              {formatDuration(video.duration || 0)}
            </span>
            <button
              className="absolute right-2 top-2"
              onClick={(e) => {
                e.stopPropagation();
                removeRecentlyPlayed(index);
              }}
            >
              <CircleMinus
                size={20}
                className="text-accent-foreground opacity-0 rounded-full group-hover:bg-accent/50 group-hover:opacity-100 transition-opacity  "
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
