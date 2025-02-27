import { OpenComponent, SelectedFile, SelectedFileList } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";

function Home({
  recentlyPlayed,
  updateCurrentFileList,
  updateOpenComponent,
  updateIsPlaying,
  addRecentlyPlayed,
}: {
  recentlyPlayed: SelectedFile[];
  updateCurrentFileList: (state: SelectedFileList) => void;
  updateOpenComponent: (state: OpenComponent) => void;
  toggleVideoHidden: () => void;
  updateIsPlaying: (state: boolean) => void;
  addRecentlyPlayed: (file: SelectedFile) => void;
}) {
  const { openFiles, toggleSettings } = usePlayerStore();
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
            className="mt-4 flex hover:bg-foreground/5 flex-col w-44 p-1 h-60 rounded-lg cursor-pointer gap-1"
            onClick={() => {
              updateCurrentFileList([recentlyPlayed[index]]);
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
