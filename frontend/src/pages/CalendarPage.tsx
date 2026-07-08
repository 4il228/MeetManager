import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSwipeable } from 'react-swipeable';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import DayView from '../components/DayView';
import WeekView from '../components/WeekView';
import ColleagueSearch from '../components/ColleagueSearch';
import BottomNav from '../components/BottomNav';
import SkeletonCalendar from '../components/SkeletonCalendar';

interface Meeting {
  id: string;
  title: string;
  creator_id: string;
  creator_name: string;
  start_time: string;
  end_time: string;
  participants: { id: string; full_name: string }[];
}

export default function CalendarPage() {
  const { logout } = useAuth();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = viewMode === 'day'
        ? format(currentDate, 'yyyy-MM-dd')
        : format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = viewMode === 'day'
        ? format(currentDate, 'yyyy-MM-dd')
        : format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd');

      const params: Record<string, string> = {
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T23:59:59Z`,
      };
      if (selectedUserId) {
        params.user_id = selectedUserId;
      }

      const { data } = await apiClient.get('/meetings', { params });
      setMeetings(data);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, selectedUserId]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handlePrev = () => {
    setCurrentDate(viewMode === 'day' ? subDays(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(viewMode === 'day' ? addDays(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: false,
    trackTouch: true,
  });

  const dateDisplay = viewMode === 'day'
    ? format(currentDate, 'd MMMM yyyy', { locale: ru })
    : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd', { locale: ru })} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'd MMMM', { locale: ru })}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 h-14 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className="p-2 hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">today</span>
          </button>
          <h1 className="text-lg font-bold text-blue-600">{dateDisplay}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined text-gray-600">chevron_left</span>
          </button>
          <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined text-gray-600">chevron_right</span>
          </button>
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full">
            <span className="material-symbols-outlined text-gray-600">logout</span>
          </button>
        </div>
      </header>

      {/* Search and Tabs */}
      <section className="bg-white px-4 pb-3 flex flex-col gap-3">
        <ColleagueSearch
          onSelectUser={setSelectedUserId}
          selectedUserId={selectedUserId}
        />
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('day')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            День
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            Неделя
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden" {...swipeHandlers}>
        {loading ? (
          <SkeletonCalendar />
        ) : viewMode === 'day' ? (
          <DayView meetings={meetings} />
        ) : (
          <WeekView meetings={meetings} currentDate={currentDate} onDayClick={(date) => {
            setCurrentDate(date);
            setViewMode('day');
          }} />
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="pb-14">
        <BottomNav activeTab={viewMode} onTabChange={setViewMode} />
      </div>

      {/* FAB */}
      <button className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </div>
  );
}
