// Static blocks, no shimmer/pulse — matches the approved design review's
// "a static skeleton reads as calm" guidance. Shapes mirror the real
// page so nothing shifts once data arrives.
export default function StudentDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <div className="bg-muted h-4 w-32 rounded" />
      <div className="bg-muted h-7 w-48 rounded" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div
            key={sectionIndex}
            className="border-border flex flex-col gap-4 rounded-lg border p-4"
          >
            <div className="bg-muted h-3 w-20 rounded" />
            {Array.from({ length: 3 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="flex flex-col gap-1.5">
                <div className="bg-muted h-2.5 w-16 rounded" />
                <div className="bg-muted h-4 w-40 rounded" />
              </div>
            ))}
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
