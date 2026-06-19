export default function Loading() {
  return (
    <div
      className="min-h-screen bg-[#0a0e1a] flex items-center justify-center"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl animate-pulse" aria-hidden="true">👻</div>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span
            className="w-4 h-4 border-2 border-gray-600 border-t-green-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          Loading…
        </div>
      </div>
    </div>
  );
}
