import { useState, useEffect, useCallback } from 'react';
import { addHours } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import apiClient from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import {
  MSK_TZ,
  mskNow,
  toMskDatetimeLocal,
  mskDatetimeLocalToUtc,
} from '../utils/timezone';
import ConflictModal from './ConflictModal';
import MskDatetimeInput from './MskDatetimeInput';

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

interface Meeting {
  id: string;
  title: string;
  creator_id: string;
  creator_name: string;
  start_time: string;
  end_time: string;
  participants: { id: string; full_name: string }[];
}

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meeting: Meeting) => void;
  initialDate?: Date;
  initialHour?: number;
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
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedParticipants = useDebounce(selectedUserIds, 300);

  useEffect(() => {
    if (!isOpen) return;
    if (initialDate) {
      const mskDay = new TZDate(initialDate, MSK_TZ);
      const base = initialHour !== undefined
        ? new TZDate(
            mskDay.getFullYear(),
            mskDay.getMonth(),
            mskDay.getDate(),
            initialHour,
            0,
            0,
            MSK_TZ,
          )
        : mskDay;
      setStartTime(toMskDatetimeLocal(base));
      setEndTime(toMskDatetimeLocal(addHours(base, 1)));
    } else {
      const now = mskNow();
      const start = new TZDate(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours() + 1,
        0,
        0,
        MSK_TZ,
      );
      setStartTime(toMskDatetimeLocal(start));
      setEndTime(toMskDatetimeLocal(addHours(start, 1)));
    }
    setTitle('');
    setSelectedUserIds([]);
    setSearchQuery('');
    setBusySlots([]);
    setConflicts([]);
    setShowConflict(false);
    setError('');
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
        start_time: mskDatetimeLocalToUtc(startTime),
        end_time: mskDatetimeLocalToUtc(endTime),
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
      const { data: createdMeeting } = await apiClient.post('/meetings', {
        title: title.trim(),
        start_time: mskDatetimeLocalToUtc(startTime),
        end_time: mskDatetimeLocalToUtc(endTime),
        participant_ids: selectedUserIds,
      });
      onSuccess(createdMeeting);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { detail?: string | { conflicts?: Conflict[] }; conflicts?: Conflict[] };
        };
      };
      if (axiosErr.response?.status === 409) {
        const data = axiosErr.response.data;
        const conflictsList =
          data?.conflicts ??
          (typeof data?.detail === 'object' && data?.detail !== null
            ? (data.detail as { conflicts?: Conflict[] }).conflicts
            : undefined);
        if (conflictsList?.length) {
          setConflicts(conflictsList);
          setShowConflict(true);
        }
      } else if (axiosErr.response?.status === 422) {
        const detail = axiosErr.response?.data?.detail;
        const msg = Array.isArray(detail) ? detail.map((d: { msg?: string }) => d.msg).join(', ') : String(detail);
        setError(msg || 'Ошибка валидации');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = (userId: string) => busySlots.some((b) => b.user_id === userId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Начало</label>
                <MskDatetimeInput value={startTime} onChange={setStartTime} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Конец</label>
                <MskDatetimeInput value={endTime} onChange={setEndTime} />
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left min-h-11 ${
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
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 min-w-[52px] text-center ${
                        busy
                          ? 'text-red-600 bg-red-100'
                          : 'text-transparent bg-transparent'
                      }`}>
                        {busy ? 'Занят' : '\u00A0'}
                      </span>
                    </button>
                  );
                })}
                {users.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Нет результатов</p>
                )}
              </div>
              <div className="min-h-4 mt-1">
                {checking && (
                  <p className="text-xs text-gray-400">Проверка доступности...</p>
                )}
              </div>
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
