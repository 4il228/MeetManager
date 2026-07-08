import { useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import type { Meeting } from '../types/meeting';
import { utcToMsk, formatMsk, mskNow, mskDateKey, MSK_TZ } from '../utils/timezone';
import { assignColumns } from '../utils/overlap';

interface WeekViewProps {
  meetings: Meeting[];
  currentDate: Date;
  onDayClick?: (date: Date) => void;
  onMeetingClick?: (meeting: Meeting) => void;
}

const HOUR_HEIGHT = 48;
const START_HOUR = 8;
const END_HOUR = 20;
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function WeekView({ meetings, currentDate, onDayClick, onMeetingClick }: WeekViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(new TZDate(currentDate, MSK_TZ), { weekStartsOn: 1 }),
    [currentDate],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      map.set(key, []);
    });
    meetings.forEach((meeting) => {
      const mskDate = utcToMsk(meeting.start_time);
      const key = format(mskDate, 'yyyy-MM-dd');
      const existing = map.get(key);
      if (existing) existing.push(meeting);
    });
    return map;
  }, [meetings, weekDays]);

  const today = mskDateKey(mskNow());

  return (
    <div className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Day Headers */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex">
        <div className="w-10 flex-shrink-0" />
        {weekDays.map((day, i) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const isToday = dayKey === today;
          return (
            <button
              key={dayKey}
              onClick={() => onDayClick?.(day)}
              className={`flex-1 py-2 flex flex-col items-center ${
                isToday ? 'bg-blue-600 text-white rounded-full mx-0.5' : ''
              }`}
            >
              <span className={`text-[10px] font-semibold ${isToday ? 'text-white' : 'text-gray-500'}`}>
                {DAY_NAMES[i]}
              </span>
              <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-900'}`}>
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline Grid */}
      <div className="relative flex">
        {/* Hour Labels */}
        <aside className="w-10 flex-shrink-0 border-r border-gray-200">
          {hours.map((hour) => (
            <div key={hour} className="h-12 flex items-start justify-center pt-0.5">
              <span className="text-[9px] font-semibold text-gray-400">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </aside>

        {/* Day Columns */}
        {weekDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayMeetings = meetingsByDay.get(dayKey) || [];
          const isToday = dayKey === today;

          return (
            <div key={dayKey} className={`flex-1 relative ${isToday ? 'bg-blue-50/30' : ''}`}>
              {/* Hour grid lines */}
              {hours.map((hour) => (
                <div key={hour} className="h-12 border-b border-gray-100" />
              ))}

              {/* Meeting blocks */}
              {assignColumns(
                dayMeetings.map((meeting) => {
                  const startDate = utcToMsk(meeting.start_time);
                  const endDate = utcToMsk(meeting.end_time);
                  const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                  const endHour = endDate.getHours() + endDate.getMinutes() / 60;
                  const top = (startHour - START_HOUR) * HOUR_HEIGHT;
                  const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20);
                  return { ...meeting, top, height, bottom: top + height };
                }),
              ).map((meeting) => {
                const widthPct = 100 / meeting.cols;
                return (
                  <div
                    key={meeting.id}
                    className="absolute bg-blue-100 border-l-2 border-blue-600 rounded px-1 py-0.5 overflow-hidden cursor-pointer"
                    style={{
                      top: `${meeting.top}px`,
                      height: `${meeting.height}px`,
                      left: `calc(${meeting.col * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                    }}
                    onClick={() => onMeetingClick?.(meeting)}
                  >
                    <p className="text-[9px] font-semibold text-blue-700 truncate leading-tight">
                      {meeting.title}
                    </p>
                    {meeting.height > 24 && (
                      <p className="text-[8px] text-blue-600 truncate leading-tight">
                        {formatMsk(meeting.start_time, 'HH:mm')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
