import { useMemo } from 'react';
import { utcToMsk, formatMsk } from '../utils/timezone';

interface Meeting {
  id: string;
  title: string;
  creator_id: string;
  creator_name: string;
  start_time: string;
  end_time: string;
  participants: { id: string; full_name: string }[];
}

interface DayViewProps {
  meetings: Meeting[];
  onSlotClick?: (hour: number) => void;
}

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 20;

export default function DayView({ meetings, onSlotClick }: DayViewProps) {
  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );

  const positionedMeetings = useMemo(() => {
    return meetings.map((meeting) => {
      const startDate = utcToMsk(meeting.start_time);
      const endDate = utcToMsk(meeting.end_time);
      const startHour = startDate.getHours() + startDate.getMinutes() / 60;
      const endHour = endDate.getHours() + endDate.getMinutes() / 60;
      const top = (startHour - START_HOUR) * HOUR_HEIGHT;
      const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 32);
      return { ...meeting, top, height, startHour, endHour };
    });
  }, [meetings]);

  const now = new Date();
  const mskNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const currentHour = mskNow.getHours() + mskNow.getMinutes() / 60;
  const showCurrentTime = currentHour >= START_HOUR && currentHour <= END_HOUR;
  const currentTimeTop = (currentHour - START_HOUR) * HOUR_HEIGHT;

  return (
    <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="relative flex min-h-[{`${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px`}]">
        {/* Time Labels */}
        <aside className="w-16 flex-shrink-0 border-r border-gray-200">
          {hours.map((hour) => (
            <div key={hour} className="h-16 flex flex-col items-center justify-start pt-1">
              <span className="text-[10px] font-semibold text-gray-500 tracking-wider">
                {String(hour).padStart(2, '0')}:00 МСК
              </span>
            </div>
          ))}
        </aside>

        {/* Event Canvas */}
        <div className="flex-1 relative">
          {/* Grid Lines */}
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-gray-200 opacity-30" />
          ))}

          {/* Current Time Indicator */}
          {showCurrentTime && (
            <div
              className="absolute left-0 right-0 z-10"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className="h-0.5 bg-blue-600 relative">
                <div className="w-3 h-3 bg-blue-600 rounded-full -mt-[5px] -ml-1.5 shadow-md" />
              </div>
            </div>
          )}

          {/* Meeting Cards */}
          {positionedMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="absolute left-2 right-2 bg-blue-50 border-l-4 border-blue-600 rounded-lg p-3 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              style={{ top: `${meeting.top}px`, height: `${meeting.height}px` }}
            >
              <h3 className="text-sm font-semibold text-blue-700 truncate">
                {meeting.title}
              </h3>
              <p className="text-xs text-blue-600 opacity-80 mt-0.5">
                {formatMsk(meeting.start_time, 'HH:mm')} - {formatMsk(meeting.end_time, 'HH:mm')}
              </p>
              {meeting.height > 48 && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-600 font-medium truncate">
                    {meeting.participants.length > 0
                      ? meeting.participants.map((p) => p.full_name.split(' ')[0]).join(', ')
                      : meeting.creator_name.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Empty Slots */}
          {hours.slice(0, -1).map((hour) => {
            const hasMeeting = positionedMeetings.some(
              (m) => m.startHour < hour + 1 && m.endHour > hour
            );
            if (hasMeeting) return null;
            return (
              <div
                key={`slot-${hour}`}
                className="absolute left-2 right-2 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400/50 transition-colors active:bg-gray-50"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                onClick={() => onSlotClick?.(hour)}
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span className="text-xs font-medium">Забронировать</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
