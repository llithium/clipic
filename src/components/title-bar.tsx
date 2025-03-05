import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { OpenComponent } from "@/lib/types";
import { toggleFullscreen } from "@/lib/utils";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Minus, Square, X } from "lucide-react";
const appWindow = getCurrentWebviewWindow();

function TitleBar() {
  const {
    currentVideo,
    currentIndex,
    currentFileList,
    openComponent,
    isUiVisible,
    isPlaying,
  } = usePlayerStore();

  return (
    <div
      data-tauri-drag-region
      className={`absolute top-0 flex justify-center items-center select-none w-full z-50 h-10 bg-gradient-to-b from-black/30 ${
        openComponent !== OpenComponent.Video
          ? "bg-inherit"
          : currentFileList.length > 0
          ? "opacity-0"
          : "bg-inherit"
      } ${
        (isUiVisible || !isPlaying) && "opacity-100"
      } transition-opacity duration-700 ease-fast-out`}
    >
      <div data-tauri-drag-region>
        <h1
          className={`text-md font-extrabold break-words tracking-tight max-w-[70vw] overflow-ellipsis line-clamp-1 lg:text-lg text-center dark:text-neutral-50 ${
            openComponent !== OpenComponent.Video && "hidden"
          }`}
        >
          {currentVideo?.name}{" "}
          {currentFileList.length > 1 &&
            `[${currentIndex + 1}/${currentFileList.length}]`}
        </h1>
        <h1
          className={`text-md font-extrabold break-words tracking-tight lg:text-lg text-center dark:text-neutral-50 ${
            openComponent !== OpenComponent.Settings && "hidden"
          }`}
        >
          Settings
        </h1>
      </div>
      <div
        data-tauri-drag-region
        className={`absolute flex top-0 justify-end w-full items-center`}
      >
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-10 h-10 p-2 hover:bg-neutral-400/20 relative z-100"
          onClick={() => appWindow.minimize()}
        >
          <Minus className="w-5 h-5 dark:text-neutral-50" />
        </Button>
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-10 h-10 p-2 hover:bg-neutral-400/20 relative z-100"
          onClick={async () =>
            (await appWindow.isFullscreen())
              ? toggleFullscreen()
              : appWindow.toggleMaximize()
          }
        >
          <Square className="w-4 h-4 dark:text-neutral-50" />
        </Button>
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-10 h-10 p-2 hover:bg-red-700/80 relative z-100"
          onClick={() => appWindow.close()}
        >
          <X className="w-5 h-5 dark:text-neutral-50" />
        </Button>
      </div>
    </div>
  );
}

export default TitleBar;
