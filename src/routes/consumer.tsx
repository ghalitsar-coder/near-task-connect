import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomTabBar } from "@/components/shell/BottomTabBar";

export const Route = createFileRoute("/consumer")({
  component: ConsumerLayout,
});

function ConsumerLayout() {
  return (
    <div className="min-h-screen bg-canvas-soft pb-20">
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
