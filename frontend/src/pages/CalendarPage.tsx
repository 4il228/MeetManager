import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TZDate } from '@date-fns/tz';
import { useSwipeable } from 'react-swipeable';
import apiClient from '../api/client';
import { useAuth, isAdminUser } from '../context/AuthContext';
import { MSK_TZ, mskDateKey, utcToMsk } from '../utils/timezone';
import type { Meeting } from '../types/meeting';
import DayView from '../components/DayView';
import WeekView from '../components/WeekView';
import ColleagueSearch from '../components/ColleagueSearch';
import BottomNav from '../components/BottomNav';
import SkeletonCalendar from '../components/SkeletonCalendar';
import FabButton from '../components/FabButton';
import MeetingFormModal from '../components/MeetingFormModal';
import MeetingDetailModal from '../components/MeetingDetailModal';
import AdminUsersModal from '../components/AdminUsersModal';
import Toast from '../components/Toast';

export default function CalendarPage() {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<{ date: Date; hour?: number } | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const mskDate = new TZDate(currentDate, MSK_TZ);
      const startDate = viewMode === 'day'
        ? format(mskDate, 'yyyy-MM-dd')
        : format(startOfWeek(mskDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const endDate = viewMode === 'day'
        ? format(mskDate, 'yyyy-MM-dd')
        : format(addDays(startOfWeek(mskDate, { weekStartsOn: 1 }), 6), 'yyyy-MM-dd');

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

  const handleSlotClick = (hour: number) => {
    setInitialSlot({ date: currentDate, hour });
    setModalOpen(true);
  };

  const handleFabClick = () => {
    setInitialSlot(undefined);
    setModalOpen(true);
  };

  const handleMeetingSuccess = (newMeeting: Meeting) => {
    const meetingDay = mskDateKey(utcToMsk(newMeeting.start_time));
    const mskCurrent = new TZDate(currentDate, MSK_TZ);

    if (viewMode === 'day') {
      if (meetingDay !== format(mskCurrent, 'yyyy-MM-dd')) {
        setToast('Встреча создана');
        return;
      }
    } else {
      const weekStart = startOfWeek(mskCurrent, { weekStartsOn: 1 });
      const weekStartKey = format(weekStart, 'yyyy-MM-dd');
      const weekEndKey = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      if (meetingDay < weekStartKey || meetingDay > weekEndKey) {
        setToast('Встреча создана');
        return;
      }
    }

    setMeetings((prev) => [...prev, newMeeting]);
    setToast('Встреча создана');
  };

  const handleMeetingDelete = async (meetingId: string) => {
    await apiClient.delete(`/meetings/${meetingId}`);
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    setSelectedMeeting(null);
    setToast('Встреча удалена');
  };

  const handleUserDeleted = (deletedUserId: string) => {
    setMeetings((prev) =>
      prev
        .filter((meeting) => meeting.creator_id !== deletedUserId)
        .map((meeting) => ({
          ...meeting,
          participants: meeting.participants.filter(
            (participant) => participant.id !== deletedUserId,
          ),
        })),
    );

    setSelectedMeeting((prev) => {
      if (!prev) {
        return prev;
      }

      if (prev.creator_id === deletedUserId) {
        return null;
      }

      return {
        ...prev,
        participants: prev.participants.filter(
          (participant) => participant.id !== deletedUserId,
        ),
      };
    });

    if (selectedUserId === deletedUserId) {
      setSelectedUserId(null);
    }
  };

  const mskCurrent = new TZDate(currentDate, MSK_TZ);
  const dateDisplay = viewMode === 'day'
    ? format(mskCurrent, 'd MMMM yyyy', { locale: ru })
    : `${format(startOfWeek(mskCurrent, { weekStartsOn: 1 }), 'd', { locale: ru })} - ${format(addDays(startOfWeek(mskCurrent, { weekStartsOn: 1 }), 6), 'd MMMM', { locale: ru })}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 h-14 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className="p-2 min-h-11 min-w-11 hover:bg-gray-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">today</span>
          </button>
          <h1 className="text-lg font-bold text-blue-600">{dateDisplay}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePrev} className="p-2 min-h-11 min-w-11 hover:bg-gray-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-600">chevron_left</span>
          </button>
          <button onClick={handleNext} className="p-2 min-h-11 min-w-11 hover:bg-gray-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-600">chevron_right</span>
          </button>
          <button onClick={logout} className="p-2 min-h-11 min-w-11 hover:bg-gray-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-600">logout</span>
          </button>
        </div>
      </header>

      {/* Search and Tabs */}
      <section className="bg-white px-4 pb-3 flex flex-col gap-3">
        {isAdminUser(user) && (
          <button
            onClick={() => setAdminModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 active:bg-blue-100 transition-colors min-h-11"
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            Управление пользователями
          </button>
        )}
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
          <DayView
            meetings={meetings}
            onSlotClick={handleSlotClick}
            onMeetingClick={setSelectedMeeting}
          />
        ) : (
          <WeekView
            meetings={meetings}
            currentDate={currentDate}
            onDayClick={(date) => {
              setCurrentDate(date);
              setViewMode('day');
            }}
            onMeetingClick={setSelectedMeeting}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="pb-14">
        <BottomNav activeTab={viewMode} onTabChange={setViewMode} />
      </div>

      {/* FAB */}
      <FabButton onClick={handleFabClick} />

      {/* Meeting Form Modal */}
      <MeetingFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleMeetingSuccess}
        initialDate={initialSlot?.date}
        initialHour={initialSlot?.hour}
      />

      <MeetingDetailModal
        meeting={selectedMeeting}
        isOpen={selectedMeeting !== null}
        currentUserId={user?.id}
        onClose={() => setSelectedMeeting(null)}
        onDelete={handleMeetingDelete}
      />

      <AdminUsersModal
        isOpen={adminModalOpen}
        currentUserId={user?.id}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={(message, deletedUserId) => {
          setToast(message);
          if (deletedUserId) {
            handleUserDeleted(deletedUserId);
          }
        }}
      />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
