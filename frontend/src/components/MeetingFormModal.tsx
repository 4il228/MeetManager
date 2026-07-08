import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import apiClient from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import ConflictModal from './ConflictModal';

interface User {
  id: string;
  username: string;
  full_name: string;
}

interface BusySlot {
  user_id: string;
  full_name: string;
  meeting_title: string;
  start_time: string;
  end_time: string;
}

interface Conflict {
  user_id: string;
  full_name: string;
  meeting_title: string;
  start_time: string;
  end_time: string;
}

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  initialHour?: number;
}

const MSK_TZ = 'Europe/Moscow';

function toLocalDatetimeString(date: Date): string {
  const msk = new TZDate(date, MSK_TZ);
  return format(msk, "yyyy-MM-dd'T'HH:mm");
}

function mskToUtcString(localDatetime: string): string {
  const [datePart, timePart] = localDatetime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const mskDate = new Date(year, month - 1, day, hours, minutes);
  const utcDate = new TZDate(mskDate, 'UTC');
  return format(utcDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

export default function MeetingFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialHour,
}: MeetingFormModalProps) {
  const { user: currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflict, setShowConflict] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedParticipants = useDebounce(selectedUserIds, 300);

  useEffect(() => {
    if (!isOpen) return;
    if (initialDate) {
      const base = initialHour !== undefined
        ? new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate(), initialHour, 0)
        : initialDate;
      setStartTime(toLocalDatetimeString(base));
      const end = new Date(base.getTime() + 60 * 60 * 1000);
      setEndTime(toLocalDatetimeString(end));
    } else {
      const now = new TZDate(new Date(), MSK_TZ);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
      setStartTime(toLocalDatetimeString(start));
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setEndTime(toLocalDatetimeString(end));
    }
    setTitle('');
    setSelectedUserIds([]);
    setSearchQuery('');
    setBusySlots([]);
    setConflicts([]);
    setShowConflict(false);
  }, [isOpen, initialDate, initialHour]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      try {
        const params = debouncedSearch ? { search: debouncedSearch } : {};
        const { data } = await apiClient.get('/users', { params });
        setUsers(data.filter((u: User) => u.id !== currentUser?.id));
      } catch {
        setUsers([]);
      }
    };
    fetchUsers();
  }, [debouncedSearch, isOpen, currentUser?.id]);

  const checkAvailability = useCallback(async () => {
    if (!startTime || !endTime || debouncedParticipants.length === 0) {
      setBusySlots([]);
      return;
    }
    setChecking(true);
    try {
      const { data } = await apiClient.post('/meetings/check-availability', {
        start_time: mskToUtcString(startTime),
        end_time: mskToUtcString(endTime),
        participant_ids: debouncedParticipants,
      });
      setBusySlots(data.busy || []);
    } catch {
      setBusySlots([]);
    } finally {
      setChecking(false);
    }
  }, [startTime, endTime, debouncedParticipants]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !startTime || !endTime) return;
    setLoading(true);
    try {
      await apiClient.post('/meetings', {
        title: title.trim(),
        start_time: mskToUtcString(startTime),
        end_time: mskToUtcString(endTime),
        participant_ids: selectedUserIds,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { conflicts?: Conflict[] } } };
      if (axiosErr.response?.status === 409 && axiosErr.response?.data?.conflicts) {
        setConflicts(axiosErr.response.data.conflicts);
        setShowConflict(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = (userId: string) => busySlots.some((b) => b.user_id === userId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Новая встреча</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название встречи"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Начало (МСК)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Конец (МСК)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Участники</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск коллег..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11 mb-2"
              />
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {users.map((u) => {
                  const selected = selectedUserIds.includes(u.id);
                  const busy = isBusy(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors min-h-11 ${
                        busy
                          ? 'bg-red-50 border border-red-200'
                          : selected
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                        }`}
                      >
                        {selected && (
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                      </div>
                      {busy && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          Занят
                        </span>
                      )}
                    </button>
                  );
                })}
                {users.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Нет результатов</p>
                )}
              </div>
              {checking && (
                <p className="text-xs text-gray-400 mt-1">Проверка доступности...</p>
              )}
            </div>
          </div>

          <div className="flex border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 text-sm font-semibold text-gray-600 active:bg-gray-50 transition-colors min-h-11"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="flex-1 py-3.5 text-sm font-semibold text-blue-600 active:bg-blue-50 transition-colors border-l border-gray-200 disabled:opacity-40 min-h-11"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      </div>

      {showConflict && (
        <ConflictModal conflicts={conflicts} onClose={() => setShowConflict(false)} />
      )}
    </>
  );
}
