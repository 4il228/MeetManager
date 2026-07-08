import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px]">check_circle</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
