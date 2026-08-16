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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border-default rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <h2 className="text-lg font-black text-text-primary">الانضمام إلى ختمة</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary text-sm font-bold"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-3">
          <label htmlFor="khatmah-id" className="block text-sm font-bold text-text-primary">
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
            className="w-full p-3.5 text-xl font-mono tracking-wider text-center border rounded-2xl bg-surface-subtle border-border-default text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-text-muted text-center">
            يمكنك إدخال كود الختمة مباشرة أو لصق الرابط المشارك معك
          </p>
        </div>
        <div className="p-4 bg-surface-subtle border-t border-border-default flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-sm font-bold text-text-secondary hover:bg-surface"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={!targetId}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl text-sm shadow transition-all disabled:opacity-50"
          >
            انضمام للختمة
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinKhatmahModal;
