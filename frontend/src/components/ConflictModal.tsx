interface Conflict {
  user_id: string;
  full_name: string;
  meeting_title: string;
  start_time: string;
  end_time: string;
}

interface ConflictModalProps {
  conflicts: Conflict[];
  onClose: () => void;
}

export default function ConflictModal({ conflicts, onClose }: ConflictModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-[calc(100%-2rem)] max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-amber-600 text-[28px]">warning</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Конфликт расписания</h2>
        </div>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {conflicts.map((conflict, i) => (
            <div
              key={i}
              className="bg-red-50 border border-red-200 rounded-xl p-3"
            >
              <p className="text-sm font-semibold text-gray-900">{conflict.full_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{conflict.meeting_title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {conflict.start_time.slice(11, 16)} - {conflict.end_time.slice(11, 16)}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm active:bg-blue-700 transition-colors min-h-11"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
