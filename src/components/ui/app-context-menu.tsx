import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { handleFullscreen } from "@/lib/ui";

function AppContextMenu({ children }: { children: React.ReactNode }) {
  const {
    nextVideo,
    previousVideo,
    isSidePanelOpen,
    toggleSidePanel,
    toggleMute,
    openFiles,
  } = usePlayerStore();

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-screen w-screen">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onSelect={previousVideo} inset>
          Previous
          <ContextMenuShortcut></ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={nextVideo} inset>
          Next
          <ContextMenuShortcut></ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={toggleMute} inset>
          Mute
          <ContextMenuShortcut>M</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleFullscreen} inset>
          Fullscreen
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={openFiles} inset>
          Open Files
          <ContextMenuShortcut>Ctrl+O</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuCheckboxItem
          onSelect={toggleSidePanel}
          checked={isSidePanelOpen}
        >
          Show Side Panel
          <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
          <ContextMenuSeparator />
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default AppContextMenu;
