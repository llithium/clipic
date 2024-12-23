import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { toggleFullscreen } from "@/lib/ui";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
const appWindow = getCurrentWebviewWindow();

function TitleBar() {
  const {
    playPause,
    currentVideo,
    currentIndex,
    currentFileList,
    isVideoHidden,
    isSettingsOpen,
  } = usePlayerStore();
  const draggableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draggable = draggableRef.current;

    async function handleDrag(event: MouseEvent) {
      if (event.target === event.currentTarget && event.buttons === 1) {
        if (event.detail === 2) {
          playPause();
        } else if (!(await appWindow.isFullscreen())) {
          await getCurrentWindow().startDragging();
        }
      }
    }
    draggable?.addEventListener("mousedown", handleDrag);
    return () => {
      draggable?.removeEventListener("mousedown", handleDrag);
    };
  }, [playPause]);

  return (
    <div
      className={`absolute top-0 flex justify-center items-center select-none w-full z-50 h-8 bg-gradient-to-b from-black/30 ${isVideoHidden ? "bg-inherit" : currentFileList.length > 0 ? "opacity-0" : "bg-inherit"} transition-opacity duration-700 ease-fast-out hover:opacity-100`}
    >
      <div>
        <h1
          className={`text-md font-extrabold break-words tracking-tight lg:text-lg text-center dark:text-neutral-50 ${isVideoHidden && "hidden"}`}
        >
          {currentVideo?.name}{" "}
          {currentFileList.length > 1 &&
            `[${currentIndex + 1}/${currentFileList.length}]`}
        </h1>
        <h1
          className={`text-md font-extrabold break-words tracking-tight lg:text-lg text-center dark:text-neutral-50 ${!isSettingsOpen && "hidden"}`}
        >
          Settings
        </h1>
      </div>
      <div
        ref={draggableRef}
        className={`absolute flex top-0 justify-end w-full items-center`}
      >
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-8 h-8 p-2 hover:bg-neutral-400/20 relative z-100"
          onClick={() => appWindow.minimize()}
        >
          <Minus className="w-5 h-5 dark:text-neutral-50" />
        </Button>
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-7 h-7 p-2 hover:bg-neutral-400/20 relative z-100"
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
          className="bg-transparent rounded-none w-8 h-8 p-2 hover:bg-red-700/80 relative z-100"
          onClick={() => appWindow.close()}
        >
          <X className="w-5 h-5 dark:text-neutral-50" />
        </Button>
      </div>
    </div>
  );
}

export default TitleBar;
