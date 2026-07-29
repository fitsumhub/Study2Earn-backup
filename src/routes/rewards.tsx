import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/rewards")({
  component: RewardsLayout,
});

function RewardsLayout() {
  return <Outlet />;
}
