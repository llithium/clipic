import { usePlayerStore } from "@/hooks/usePlayerStore";

function SidePanel() {
  const { currentFileList, currentIndex, updateCurrentIndex } =
    usePlayerStore();
  return (
    <div className="h-[calc(100vh-32px)] dark:bg-neutral-50 relative z-40 py-2 flex flex-col gap-1 overflow-y-auto">
      {currentFileList.map((video, i) => {
        return (
          <div
            key={i}
            className={`hover:opacity-80 cursor-pointer active:opacity-60 transition-all px-2 ${currentIndex === i && "bg-neutral-400/20"}`}
          >
            <div
              className="text-xs overflow-hidden overflow-ellipsis whitespace-nowrap"
              onClick={() => updateCurrentIndex(i)}
            >
              <span>{i + 1}. </span> {video.fileName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SidePanel;
