// Auth.js reads the session at request time. This boundary lets the admin
// shell stream immediately while the session check completes.
export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy="true">
      <span className="text-sm text-muted" aria-live="polite">
        …
      </span>
    </div>
  );
}
