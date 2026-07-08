import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Meeting } from '../types/meeting';
import { utcToMsk, formatTimeRange } from '../utils/timezone';

interface MeetingDetailModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  currentUserId?: string;
  onClose: () => void;
  onDelete: (meetingId: string) => Promise<void>;
}

function formatDuration(startUtc: string, endUtc: string): string {
  const start = utcToMsk(startUtc);
  const end = utcToMsk(endUtc);
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins < 60) return `${mins} мин`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export default function MeetingDetailModal({
  meeting,
  isOpen,
  currentUserId,
  onClose,
  onDelete,
}: MeetingDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setConfirmDelete(false);
    setDeleting(false);
    setError('');
  }, [meeting?.id, isOpen]);

  if (!isOpen || !meeting) return null;

  const isCreator = currentUserId === meeting.creator_id;
  const startMsk = utcToMsk(meeting.start_time);
  const dateLabel = format(startMsk, 'd MMMM yyyy, EEEE', { locale: ru });

  const handleClose = () => {
    setConfirmDelete(false);
    setError('');
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await onDelete(meeting.id);
      setConfirmDelete(false);
    } catch {
      setError('Не удалось удалить встречу');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                Встреча
              </p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight break-words">
                {meeting.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 min-h-11 min-w-11 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined text-gray-500">close</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">schedule</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{dateLabel}</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {formatTimeRange(meeting.start_time, meeting.end_time)} МСК
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Длительность: {formatDuration(meeting.start_time, meeting.end_time)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">person</span>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Создатель</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{meeting.creator_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">groups</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Участники ({meeting.participants.length})
                </p>
                <ul className="space-y-2">
                  {meeting.participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-sm font-semibold">
                          {p.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 truncate">{p.full_name}</span>
                      {p.id === meeting.creator_id && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          создатель
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {isCreator && (
            <div className="pt-2 border-t border-gray-100">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 active:bg-red-100 transition-colors min-h-11"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Удалить встречу
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 text-center">
                    Удалить встречу «{meeting.title}»?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl min-h-11 disabled:opacity-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl min-h-11 disabled:opacity-50"
                    >
                      {deleting ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
