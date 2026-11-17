export function DetailSkeleton() {
  return (
    <div className="flex flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row" aria-label="Loading listing">
      <div className="min-h-[320px] animate-pulse bg-[#242526] lg:flex-1" />
      <div className="w-full space-y-3 p-4 lg:w-[400px] lg:border-l lg:border-line">
        <div className="h-7 w-3/4 animate-pulse rounded bg-field" />
        <div className="h-6 w-1/4 animate-pulse rounded bg-field" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-field" />
        <div className="h-9 animate-pulse rounded-lg bg-field" />
        <div className="h-24 animate-pulse rounded-lg bg-field" />
      </div>
    </div>
  );
}
