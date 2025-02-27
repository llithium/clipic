import { usePlayerStore } from "@/hooks/usePlayerStore";
import { SelectedFileList } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useCallback, forwardRef } from "react";

type SidePanelProps = object;

const SidePanel = forwardRef<HTMLDivElement, SidePanelProps>((_props, ref) => {
  const {
    currentFileList,
    updateCurrentFileList,
    currentIndex,
    updateCurrentIndex,
  } = usePlayerStore();

  const onDragEnd = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result: any) => {
      if (!result.destination) {
        return;
      }
      const currentVideoId = currentFileList[currentIndex].filePath;

      const updatedFileList: SelectedFileList = reorder(
        currentFileList,
        result.source.index,
        result.destination.index
      );
      updateCurrentFileList(updatedFileList);
      const newIndex = updatedFileList.findIndex(
        (video) => video.filePath === currentVideoId
      );
      updateCurrentIndex(newIndex);
    },
    [currentFileList, currentIndex, updateCurrentFileList, updateCurrentIndex]
  );

  const reorder = (
    list: SelectedFileList,
    startIndex: number,
    endIndex: number
  ): SelectedFileList => {
    const result: SelectedFileList = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ScrollArea
        ref={ref}
        className="rounded-tl-sm h-[calc(100vh-32px)] relative z-40 pl-1 py-2 pr-3 flex flex-col gap-1 overflow-y-auto"
      >
        <Droppable droppableId="droppable-1">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {currentFileList.map((video, i) => (
                <Draggable
                  key={`${video.filePath}-${i}`}
                  draggableId={`${video.filePath}-${i}`}
                  index={i}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`draggable-item hover:bg-accent cursor-pointer active:opacity-60 transition-all px-2 py-2 mb-1 rounded-lg ${
                        currentIndex === i && "bg-secondary"
                      }`}
                      onClick={() => updateCurrentIndex(i)}
                    >
                      <div className="text-xs overflow-hidden overflow-ellipsis whitespace-nowrap w-[260px]">
                        <span>{i + 1}. </span> {video.fileName}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </ScrollArea>
    </DragDropContext>
  );
});

export default SidePanel;
