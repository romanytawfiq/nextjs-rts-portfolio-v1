import { DashboardSkeleton } from "@/components/admin/skeleton";

// This boundary sits below the shared dashboard layout, so it is reused for
// every sibling navigation without waiting for the full page payload.
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
