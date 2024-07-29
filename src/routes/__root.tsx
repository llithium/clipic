import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <main className="bg-black">
        <Outlet />
      </main>
    </>
  ),
});
