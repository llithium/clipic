import { SelectedFileList, usePlayerStore } from "@/hooks/usePlayerStore";
import { ScrollArea } from "./scroll-area";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useCallback } from "react";

function SidePanel() {
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

      const updatedFileList: SelectedFileList = reorder(
        currentFileList,
        result.source.index,
        result.destination.index
      );
      updateCurrentFileList(updatedFileList);
    },
    [currentFileList, updateCurrentFileList]
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
      <ScrollArea className="rounded-tl-sm h-[calc(100vh-32px)] relative z-40 py-2 flex flex-col gap-1 overflow-y-auto">
        <Droppable droppableId="droppable-1">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              // style={getListStyle(snapshot.isDraggingOver)}
            >
              {currentFileList.map((video, i) => (
                <Draggable
                  key={`${video.fileName}-${i}`}
                  draggableId={`${video.fileName}-${i}`}
                  index={i}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`hover:opacity-80 cursor-pointer active:opacity-60 transition-all px-2 py-1 ${
                        currentIndex === i && "bg-border/50"
                      }`}
                      onClick={() => updateCurrentIndex(i)}
                    >
                      <div className="text-xs overflow-hidden overflow-ellipsis whitespace-nowrap">
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
}

export default SidePanel;
