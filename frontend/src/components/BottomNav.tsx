interface BottomNavProps {
  activeTab: 'day' | 'week';
  onTabChange: (tab: 'day' | 'week') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <footer className="bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-2 pt-2 rounded-t-xl">
      <button
        onClick={() => onTabChange('day')}
        className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-transform duration-150 ${
          activeTab === 'day'
            ? 'bg-blue-600 text-white scale-95'
            : 'text-gray-500 hover:text-blue-600'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">calendar_view_day</span>
        <span className="text-[10px] font-semibold mt-0.5">День</span>
      </button>
      <button
        onClick={() => onTabChange('week')}
        className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-transform duration-150 ${
          activeTab === 'week'
            ? 'bg-blue-600 text-white scale-95'
            : 'text-gray-500 hover:text-blue-600'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">calendar_view_week</span>
        <span className="text-[10px] font-semibold mt-0.5">Неделя</span>
      </button>
    </footer>
  );
}
