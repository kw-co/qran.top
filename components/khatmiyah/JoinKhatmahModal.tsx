import React, { useState } from 'react';

interface JoinKhatmahModalProps {
  onClose: () => void;
  onJoin: (id: string) => void;
}

const JoinKhatmahModal: React.FC<JoinKhatmahModalProps> = ({ onClose, onJoin }) => {
  const [inputVal, setInputVal] = useState('');

  const cleanId = (val: string) => {
    let clean = val.trim();
    // Handle pasted URLs like https://.../#/khatmah/KHT-2026
    if (clean.includes('/khatmah/')) {
      const parts = clean.split('/khatmah/');
      clean = parts[1] || clean;
    }
    return clean.replace(/^#\/?/, '').toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = cleanId(inputVal);
    if (finalId) {
      onJoin(finalId);
    }
  };

  const targetId = cleanId(inputVal);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[99999] flex items-center justify-center p-3 sm:p-4 animate-fade-in overscroll-contain"
      dir="rtl"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border-default rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90dvh] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 p-4 sm:p-5 border-b border-border-default flex items-center justify-between bg-surface-subtle">
          <h2 className="text-base sm:text-lg font-bold text-text-primary">الانضمام إلى ختمة</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 p-4 sm:p-6 space-y-3 overflow-y-auto overscroll-contain">
          <label htmlFor="khatmah-id" className="block text-xs sm:text-sm font-bold text-text-primary">
            أدخل كود الختمة أو رابطها
          </label>
          <input
            id="khatmah-id"
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="مثال: KHT-2026"
            required
            autoFocus
            className="w-full p-3.5 text-lg sm:text-xl font-mono tracking-wider text-center border rounded-2xl bg-surface border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-text-muted text-center">
            يمكنك إدخال كود الختمة مباشرة أو لصق الرابط المشارك معك
          </p>
        </div>
        <div className="shrink-0 p-3 sm:p-4 bg-surface-subtle border-t border-border-default flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:bg-surface border border-border-default hover:border-border-hover cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={!targetId}
            className="px-5 sm:px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            انضمام للختمة
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinKhatmahModal;
