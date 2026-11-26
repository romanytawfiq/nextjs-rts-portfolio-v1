export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-busy="true">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded-lg bg-line/70" />
        <div className="h-4 w-80 max-w-full rounded bg-line/50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-24 rounded-xl border border-line bg-surface" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 rounded-xl border border-line bg-surface" />
        <div className="h-48 rounded-xl border border-line bg-surface" />
      </div>

      <div className="h-64 rounded-xl border border-line bg-surface" />
    </div>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-surface lg:border-e lg:border-b-0">
        <div className="h-12 px-5 py-4">
          <div className="h-4 w-28 animate-pulse rounded bg-line/70" />
        </div>
        <div className="space-y-2 px-5 pb-5">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div key={key} className="h-8 animate-pulse rounded-lg bg-line/40" />
          ))}
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <div className="h-4 w-24 animate-pulse rounded bg-line/50" />
          <div className="h-8 w-20 animate-pulse rounded bg-line/50" />
        </div>
        <main className="mx-auto max-w-5xl px-5 py-10">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}
