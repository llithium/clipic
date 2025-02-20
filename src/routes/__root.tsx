import AppContextMenu from "@/components/app-context-menu";
import TitleBar from "@/components/title-bar";
import { createRootRoute, Outlet } from "@tanstack/react-router";

const __root = () => {
  return (
    <main className="select-none">
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
