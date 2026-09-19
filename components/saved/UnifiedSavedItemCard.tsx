import React, { useState } from 'react';
import type { SavedItem, SurahData } from '../../types';
import { QURAN_INDEX } from '../../quranIndex';
import {
  TrashIcon,
  BookOpenIcon,
  SearchIcon,
  PencilIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CopyIcon,
  RotateCcwIcon,
} from '../icons';
import { timeAgo } from '../../utils/date';

interface UnifiedSavedItemCardProps {
  item: SavedItem;
  index: number;
  totalItems: number;
  allQuranData?: { [key: string]: SurahData[] } | null;
  onDelete: (itemId: string) => void;
  onMove: (itemId: string, direction: 'up' | 'down') => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onUpdateItem?: (itemId: string, updates: { notes?: string; customText?: string | null }) => void;
}

export const UnifiedSavedItemCard: React.FC<UnifiedSavedItemCardProps> = ({
  item,
  index,
  totalItems,
  allQuranData,
  onDelete,
  onMove,
  onUpdateNotes,
  onUpdateItem,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(item.notes || '');
  const [copied, setCopied] = useState(false);

  // Retrieve authentic Uthmani text if available in dataset
  const uthmaniText = (() => {
    if (item.type !== 'ayah') return item.query || '';
    if (allQuranData) {
      const uthmaniData = allQuranData['quran-uthmani'] || allQuranData['quran-simple'] || allQuranData['quran-tajweed'];
      if (uthmaniData) {
        const surahObj = uthmaniData.find(s => s.number === item.surah);
        if (surahObj) {
          const ayahObj = surahObj.ayahs.find(a => a.numberInSurah === item.ayah);
          if (ayahObj && ayahObj.text) return ayahObj.text;
        }
      }
    }
    return item.text || '';
  })();

  const effectiveAyahText = (item.type === 'ayah' && item.customText) ? item.customText : uthmaniText;
  const isCustomized = Boolean(item.type === 'ayah' && item.customText && item.customText !== uthmaniText);

  const surahName = item.type === 'ayah' ? (QURAN_INDEX.find(s => s.number === item.surah)?.name || `سورة ${item.surah}`) : '';

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (href) window.location.hash = href;
  };

  const handleSaveNotes = () => {
    if (onUpdateItem) {
      onUpdateItem(item.id, { notes: noteText.trim() });
    } else {
      onUpdateNotes(item.id, noteText.trim());
    }
    setIsEditingNotes(false);
  };

  const handleResetToFullAyah = () => {
    if (onUpdateItem) {
      onUpdateItem(item.id, { customText: null });
    }
  };

  const handleKeyDownNotes = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveNotes();
    }
  };

  const handleCopy = async () => {
    let copyContent = '';
    if (item.type === 'ayah') {
      // Strip html tags if any
      const plainText = effectiveAyahText.replace(/<[^>]+>/g, '');
      copyContent = `﴿ ${plainText} ﴾ [${surahName}: ${item.ayah}]`;
      if (item.notes && item.notes.trim()) {
        copyContent += `\n\nفوائد وتدبر:\n${item.notes}`;
      }
    } else {
      copyContent = `بحث قرآني: "${item.query}"`;
      if (item.notes && item.notes.trim()) {
        copyContent += `\n\nملاحظات:\n${item.notes}`;
      }
    }

    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-default hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6 flex flex-col gap-4 group">
      
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
        {/* Left: Ayah reference or search badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold">
            {index + 1}
          </span>

          {item.type === 'ayah' ? (
            <a
              href={`#/surah/${item.surah}?ayah=${item.ayah}`}
              onClick={handleLinkClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle hover:bg-surface-hover text-primary-text-strong font-bold text-xs sm:text-sm border border-border-subtle transition-colors cursor-pointer"
              title="انتقل إلى موضع الآية في المصحف"
            >
              <BookOpenIcon className="w-3.5 h-3.5 text-primary" />
              <span>{surahName}</span>
              <span className="text-text-muted font-normal">|</span>
              <span className="font-mono text-primary font-bold">آية {item.ayah}</span>
            </a>
          ) : (
            <a
              href={`#/search/${encodeURIComponent(item.query)}`}
              onClick={handleLinkClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle hover:bg-surface-hover text-primary font-bold text-xs sm:text-sm border border-border-subtle transition-colors"
            >
              <SearchIcon className="w-3.5 h-3.5" />
              <span>بحث: {item.query}</span>
            </a>
          )}

          {isCustomized && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
              ✨ مقتطع / معدل
            </span>
          )}

          <span className="text-[11px] text-text-subtle">
            {timeAgo(item.createdAt)}
          </span>
        </div>

        {/* Right: Item Actions (Reorder Up/Down, Reset Custom, Copy, Delete) */}
        <div className="flex items-center gap-1">
          {isCustomized && (
            <button
              type="button"
              onClick={handleResetToFullAyah}
              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
              title="استعادة نص الآية الأصلي كاملاً وحذف التخصيص لتوفير الحفظ"
              aria-label="استعادة الآية كاملة"
            >
              <RotateCcwIcon className="w-4 h-4" />
            </button>
          )}

          {/* Reorder Up */}
          <button
            type="button"
            onClick={() => onMove(item.id, 'up')}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="تحريك لأعلى"
            aria-label="تحريك لأعلى"
          >
            <ArrowUpIcon className="w-4 h-4" />
          </button>

          {/* Reorder Down */}
          <button
            type="button"
            onClick={() => onMove(item.id, 'down')}
            disabled={index === totalItems - 1}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="تحريك لأسفل"
            aria-label="تحريك لأسفل"
          >
            <ArrowDownIcon className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-text-muted hover:text-primary hover:bg-surface-subtle'
            }`}
            title="نسخ نص الآية مع الفوائد"
            aria-label="نسخ"
          >
            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="حذف الآية من الدفتر"
            aria-label="حذف"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Ayah Text in Authentic Uthmanic Font with HTML formatting support */}
      <div className="px-1 sm:px-2 py-1">
        {item.type === 'ayah' ? (
          <p
            className="uthmani-font quran-text-md font-semibold text-text-primary text-justify leading-loose select-text"
            style={{ textAlign: 'justify', textJustify: 'inter-word' }}
          >
            <span dangerouslySetInnerHTML={{ __html: effectiveAyahText }} />
            <span className="text-primary mx-2 font-quran font-bold select-none inline-block">
              ﴿{item.ayah}﴾
            </span>
          </p>
        ) : (
          <p className="text-lg font-bold text-text-primary">
            نتيجة بحث محفوظ: "{item.query}"
          </p>
        )}
      </div>

      {/* Bottom: Notes Section */}
      <div className="border-t border-border-subtle pt-3">
        {isEditingNotes ? (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-bold flex items-center gap-1 text-primary">
                <PencilIcon className="w-3.5 h-3.5" />
                تدوين الفوائد والملاحظات:
              </span>
              <span>اضغط Ctrl+Enter للحفظ السريع</span>
            </div>
            <textarea
              id={`note-editor-${item.id}`}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleKeyDownNotes}
              placeholder="اكتب فوائدك، تأملاتك، أو ملاحظاتك حول هذه الآية الكريمة..."
              className="w-full p-3.5 border border-primary/30 rounded-xl bg-surface-subtle text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans leading-relaxed"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoteText(item.notes || '');
                  setIsEditingNotes(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle text-text-secondary transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                <span>حفظ الملاحظة</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            {item.notes && item.notes.trim() ? (
              <div className="flex-grow bg-amber-500/10 border-r-3 border-amber-500 rounded-lg p-3 text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
                  ✍️ فوائد وملاحظات:
                </span>
                {item.notes}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic flex-grow py-1">
                لا توجد ملاحظات مضافة بعد. اضغط لإضافة ملاحظتك...
              </p>
            )}

            <button
              type="button"
              onClick={() => setIsEditingNotes(true)}
              className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 cursor-pointer"
              title={item.notes ? 'تعديل الملاحظات' : 'إضافة ملاحظة'}
            >
              <PencilIcon className="w-3.5 h-3.5" />
              <span>{item.notes ? 'تعديل' : 'إضافة ملاحظة'}</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default UnifiedSavedItemCard;
