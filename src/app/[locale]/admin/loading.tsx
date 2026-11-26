import { AdminShellSkeleton } from "@/components/admin/skeleton";

// Initial entry into the admin segment can still block on the Auth.js session.
// This boundary renders the full shell skeleton while that check completes.
export default function AdminLoading() {
  return <AdminShellSkeleton />;
}
