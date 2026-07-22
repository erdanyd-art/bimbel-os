// Static blocks, shaped to mirror the real detail page's 4-card grid +
// metadata row so nothing shifts once data lands.
export default function ClassDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <div className="bg-muted h-4 w-32 rounded" />
      <div className="bg-muted h-7 w-48 rounded" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className="border-border flex flex-col gap-3 rounded-lg border p-4"
          >
            <div className="bg-muted h-3 w-20 rounded" />
            <div className="bg-muted h-4 w-40 rounded" />
          </div>
        ))}
      </div>

      <div className="border-border flex flex-col gap-4 rounded-lg border p-4">
        <div className="bg-muted h-3 w-20 rounded" />
        <div className="flex gap-10">
          <div className="flex flex-col gap-1.5">
            <div className="bg-muted h-2.5 w-16 rounded" />
            <div className="bg-muted h-4 w-32 rounded" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="bg-muted h-2.5 w-16 rounded" />
            <div className="bg-muted h-4 w-32 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
