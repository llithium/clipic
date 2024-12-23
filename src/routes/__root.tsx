import AppContextMenu from "@/components/ui/app-context-menu";
import TitleBar from "@/components/ui/title-bar";
import { createRootRoute, Outlet } from "@tanstack/react-router";

const __root = () => {
  return (
    <main className="dark:bg-black select-none">
      <AppContextMenu>
        <TitleBar />
        <Outlet />
      </AppContextMenu>
    </main>
  );
};

export const Route = createRootRoute({
  component: __root,
});
