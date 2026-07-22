// Static blocks, no shimmer/pulse, shaped to match the real table so
// nothing shifts when data lands.
export default function ClassesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-6 w-24 rounded" />
          <div className="bg-muted h-4 w-72 rounded" />
        </div>
        <div className="bg-muted h-8 w-28 rounded-lg" />
      </div>

      <div className="bg-muted h-8 w-full max-w-sm rounded-lg" />

      <div className="border-border overflow-hidden rounded-lg border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border-border flex h-11 items-center gap-6 border-t px-4 first:border-t-0"
          >
            <div className="bg-muted h-3 w-28 rounded" />
            <div className="bg-muted h-3 w-20 rounded" />
            <div className="bg-muted h-3 w-16 rounded" />
            <div className="bg-muted h-3 w-24 rounded" />
            <div className="bg-muted h-3 w-32 rounded" />
            <div className="bg-muted h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
