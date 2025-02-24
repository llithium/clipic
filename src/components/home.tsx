import {
  OpenComponent,
  SelectedFile,
  SelectedFileList,
} from "@/hooks/usePlayerStore";
import { convertFileSrc } from "@tauri-apps/api/core";

function Home({
  recentlyPlayed,
  updateCurrentFileList,
  updateOpenComponent,
  updateIsPlaying,
}: {
  recentlyPlayed: SelectedFile[];
  updateCurrentFileList: (state: SelectedFileList) => void;
  updateOpenComponent: (state: OpenComponent) => void;
  toggleVideoHidden: () => void;
  updateIsPlaying: (state: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center mt-10 pb-4 px-4 gap-2 overflow-y-scroll">
      {recentlyPlayed.map((video, index) => (
        <div
          key={index}
          className="mt-4 flex flex-col w-44 h-56 rounded-2xl cursor-pointer gap-1"
          onClick={() => {
            updateCurrentFileList([recentlyPlayed[index]]);
            updateOpenComponent(OpenComponent.Video);
            updateIsPlaying(true);
          }}
        >
          <img
            className="object-cover aspect-square w-44 h-44 rounded bg-secondary"
            src={convertFileSrc(video.thumbnailPath || "")}
            // alt={video.fileName}
          />
          <span className="font-semibold text-sm overflow-hidden text-ellipsis line-clamp-2">
            {video.fileName}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Home;
