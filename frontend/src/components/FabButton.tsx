interface FabButtonProps {
  onClick: () => void;
}

export default function FabButton({ onClick }: FabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform"
      aria-label="Создать встречу"
    >
      <span className="material-symbols-outlined text-[32px]">add</span>
    </button>
  );
}
