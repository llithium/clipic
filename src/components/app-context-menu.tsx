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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

function AppContextMenu({ children }: { children: React.ReactNode }) {
  const {
    nextVideo,
    previousVideo,
    isSidePanelOpen,
    toggleSidePanel,
    toggleMute,
    openFiles,
    openDirectory,
    updateCurrentVideo,
    updateShortcutsDisabled,
    toggleSettings,
    loop,
    toggleLoop,
    toggleHome,
  } = usePlayerStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (dialogOpen) {
      updateShortcutsDisabled(true);
    } else {
      updateShortcutsDisabled(false);
    }
  }, [dialogOpen, updateShortcutsDisabled]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <DialogTrigger asChild>
                <ContextMenuItem>URL</ContextMenuItem>
              </DialogTrigger>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>URL</DialogTitle>
          <DialogDescription>Enter URL</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateCurrentVideo({
              name: e.currentTarget.url.value,
              url: e.currentTarget.url.value,
              extension: "",
            });
            setDialogOpen(false);
          }}
        >
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="url" className="sr-only">
                URL
              </Label>
              <Input type="url" id="url" />
            </div>
            <Button type="submit" size="sm">
              Load
            </Button>
          </div>
        </form>
        <DialogFooter className="sm:justify-start">
          <DialogClose>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AppContextMenu;
