import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CheckIcon, ClearIcon, BookOpenIcon } from '../icons';
import { safeLocalStorage } from '../../utils/storage';

interface ReserveJuzModalProps {
  onClose: () => void;
  onReserve: (name: string, andReadNow?: boolean) => Promise<void>;
  juzNumber: number;
  juzSurahName?: string;
}

const LAST_NAME_KEY = 'qran_last_khatmah_reader_name';

const ReserveJuzModal: React.FC<ReserveJuzModalProps> = ({ onClose, onReserve, juzNumber, juzSurahName }) => {
  const [name, setName] = useState(() => {
    return safeLocalStorage.getItem(LAST_NAME_KEY) || '';
  });
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (andReadNow = false) => {
    if (!name.trim()) {
      setError('يرجى كتابة اسمك');
      return;
    }
    setIsReserving(true);
    setError(null);
    try {
      safeLocalStorage.setItem(LAST_NAME_KEY, name.trim());
      await onReserve(name.trim(), andReadNow);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حجز الجزء');
      setIsReserving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction(false);
  };

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
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-border-default flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📖</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary">حجز الجزء {juzNumber}</h2>
              {juzSurahName && (
                <p className="text-xs text-text-muted">{juzSurahName}</p>
              )}
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 sm:p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <ClearIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reserver-name" className="block text-xs sm:text-sm font-bold mb-1.5 text-text-primary">
              اسم القارئ / الحاجز <span className="text-red-500">*</span>
            </label>
            <input
              id="reserver-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              placeholder="اكتب اسمك أو كنيتك (سيظهر للجميع)"
              className="w-full p-3 border rounded-xl bg-surface border-border-default text-text-primary text-base focus:border-primary outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-text-muted">
              سيتم حجز الجزء باسمك فوراً ويظهر لجميع المشاركين في نفس اللحظة.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-surface-subtle border-t border-border-default flex flex-col sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-text-secondary hover:bg-surface rounded-xl border border-border-default hover:border-border-hover order-3 sm:order-1 cursor-pointer text-center"
          >
            إلغاء
          </button>
          
          <button
            type="button"
            onClick={() => handleAction(true)}
            disabled={isReserving || !name.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 order-2 disabled:opacity-50 cursor-pointer"
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>حجز وبدء القراءة</span>
          </button>

          <button
            type="submit"
            disabled={isReserving || !name.trim()}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 order-1 sm:order-3 disabled:opacity-50 cursor-pointer"
          >
            {isReserving ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
            <span>{isReserving ? 'جاري الحجز...' : 'تأكيد الحجز'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReserveJuzModal;
