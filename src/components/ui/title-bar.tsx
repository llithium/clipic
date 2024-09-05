import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { toggleFullscreen } from "@/lib/ui";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
const appWindow = getCurrentWebviewWindow();

function TitleBar() {
  const { playPause, currentVideo, currentIndex, currentFileList } =
    usePlayerStore();
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
      className={`absolute top-0 select-none w-full z-40 h-fit pt-2 bg-gradient-to-b from-black/30 ${currentFileList.length > 0 ? "opacity-0" : "bg-inherit h-[32px]"} transition-opacity duration-700 ease-fast-out hover:opacity-100`}
    >
      <h1 className="scroll-m-20 text-md font-extrabold break-words tracking-tight lg:text-lg text-center dark:text-neutral-50">
        {currentVideo?.name}{" "}
        {currentFileList.length > 1 &&
          `[${currentIndex + 1}/${currentFileList.length}]`}
      </h1>
      <div
        ref={draggableRef}
        className={`absolute flex top-0 justify-end w-full items-center ${currentFileList.length > 0 ? "pb-32" : null}`}
      >
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-8 h-8 p-2 hover:bg-neutral-400/20 relative z-50"
          onClick={() => appWindow.minimize()}
        >
          <Minus className="w-5 h-5 dark:text-neutral-50" />
        </Button>
        <Button
          size="icon"
          variant={"icon"}
          className="bg-transparent rounded-none w-7 h-7 p-2 hover:bg-neutral-400/20 relative z-50"
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
          className="bg-transparent rounded-none w-8 h-8 p-2 hover:bg-red-700/80 relative z-50"
          onClick={() => appWindow.close()}
        >
          <X className="w-5 h-5 dark:text-neutral-50" />
        </Button>
      </div>
    </div>
  );
}

export default TitleBar;
