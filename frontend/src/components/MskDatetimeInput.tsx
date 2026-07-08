const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseValue(value: string) {
  if (!value) return { date: '', hour: '09', minute: '00' };
  const [date, time] = value.split('T');
  const [hour = '09', minute = '00'] = (time || '').split(':');
  return { date, hour: hour.padStart(2, '0'), minute: minute.padStart(2, '0') };
}

function joinValue(date: string, hour: string, minute: string) {
  return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

interface MskDatetimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MskDatetimeInput({ value, onChange }: MskDatetimeInputProps) {
  const { date, hour, minute } = parseValue(value);

  const update = (patch: Partial<{ date: string; hour: string; minute: string }>) => {
    const next = { date, hour, minute, ...patch };
    if (!next.date) return;
    onChange(joinValue(next.date, next.hour, next.minute));
  };

  return (
    <div className="space-y-2">
      <input
        type="date"
        value={date}
        onChange={(e) => update({ date: e.target.value })}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
      />
      <div className="flex items-center gap-2">
        <select
          value={hour}
          onChange={(e) => update({ hour: e.target.value })}
          aria-label="Часы"
          className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11 bg-white"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-gray-500 font-semibold">:</span>
        <select
          value={minute}
          onChange={(e) => update({ minute: e.target.value })}
          aria-label="Минуты"
          className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11 bg-white"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">МСК</span>
      </div>
    </div>
  );
}
