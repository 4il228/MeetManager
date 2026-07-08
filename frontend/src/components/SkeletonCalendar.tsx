export default function SkeletonCalendar() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-10 bg-gray-200 rounded-lg w-full" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded-lg flex-1" />
        <div className="h-8 bg-gray-200 rounded-lg flex-1" />
      </div>
      <div className="space-y-3 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-6 bg-gray-200 rounded w-12" />
            <div className="h-16 bg-gray-200 rounded-lg flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
