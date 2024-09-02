import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { handleFullscreen } from "@/lib/ui";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useEffect, useRef } from "react";
const appWindow = getCurrentWebviewWindow();

const __root = () => {
  const { playPause, currentVideo, currentIndex, currentFileList } =
    usePlayerStore();
  const draggableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draggable = draggableRef.current;

    async function handleDrag(event: MouseEvent) {
      if (event.target === event.currentTarget && event.buttons === 1) {
        event.detail === 2
          ? playPause()
          : await getCurrentWindow().startDragging();
      }
    }

    draggable?.addEventListener("mousedown", handleDrag);

    return () => {
      draggable?.removeEventListener("mousedown", handleDrag);
    };
  }, [playPause]);

  return (
    <>
      <main className="dark:bg-black">
        <div
          className={`absolute top-0 select-none w-full z-40 h-fit pt-2 bg-gradient-to-b from-black/30 ${currentFileList.length > 0 && currentFileList[0].filePath !== "" ? "opacity-0" : "bg-inherit h-[32px]"} transition-opacity duration-500 ease-fast-out hover:opacity-100`}
        >
          <h1 className="scroll-m-20 text-md font-extrabold break-words tracking-tight lg:text-lg text-center dark:text-neutral-50">
            {currentVideo?.name}{" "}
            {currentFileList.length > 1 &&
              `[${currentIndex + 1}/${currentFileList.length}]`}
          </h1>
          <div
            ref={draggableRef}
            className={`absolute flex top-0 justify-end w-full items-center ${currentFileList.length > 0 && currentFileList[0].filePath !== "" ? "pb-32" : null}`}
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
                  ? handleFullscreen()
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

        <Outlet />
      </main>
    </>
  );
};

export const Route = createRootRoute({
  component: __root,
});
