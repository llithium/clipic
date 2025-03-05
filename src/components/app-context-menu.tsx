import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { toggleFullscreen } from "@/lib/utils";
import { useEffect, useState } from "react";

function AppContextMenu({ children }: { children: React.ReactNode }) {
  const {
    nextVideo,
    previousVideo,
    isSidePanelOpen,
    toggleSidePanel,
    toggleMute,
    openFiles,
    openDirectory,
    updateShortcutsDisabled,
    toggleSettings,
    loop,
    toggleLoop,
    toggleHome,
  } = usePlayerStore();
  const [dialogOpen] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      updateShortcutsDisabled(true);
    } else {
      updateShortcutsDisabled(false);
    }
  }, [dialogOpen, updateShortcutsDisabled]);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block h-screen w-screen">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onSelect={toggleHome} inset>
          Home
          <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
        </ContextMenuItem>
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
        <ContextMenuCheckboxItem onSelect={toggleLoop} checked={loop}>
          Loop
        </ContextMenuCheckboxItem>
        <ContextMenuItem onSelect={toggleFullscreen} inset>
          Fullscreen
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={openFiles} inset>
          Open Files
          <ContextMenuShortcut>Ctrl+O</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>Open</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={openDirectory}>Folder</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuCheckboxItem
          onSelect={toggleSidePanel}
          checked={isSidePanelOpen}
        >
          Show Side Panel
          <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
        </ContextMenuCheckboxItem>
        {/* <ContextMenuSeparator /> */}
        <ContextMenuItem onSelect={toggleSettings} inset>
          Open Settings
          <ContextMenuShortcut>Ctrl+P</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default AppContextMenu;
