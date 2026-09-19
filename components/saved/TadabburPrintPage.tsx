import React, { useState, useRef, useMemo } from 'react';
import type { SavedItem, SurahData } from '../../types';
import { QURAN_INDEX } from '../../quranIndex';
import {
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  ArrowRightIcon,
  FileTextIcon,
  PencilIcon,
  UnderlineIcon,
  BoldIcon,
  RotateCcwIcon,
  SparklesIcon,
  ArrowUpDownIcon
} from '../icons';
import { generateAndDownloadWordDoc } from './exportToWord';

export type PrintLayoutModel = 'table' | 'ultra-compact' | 'normal' | 'large';
export type NotesPosition = 'bottom' | 'side-left' | 'side-right' | 'table';
export type PrintFlowMode = 'contain' | 'split';
export type PrintSortOrder = 'quran' | 'saved';

interface TadabburPrintPageProps {
  items: SavedItem[];
  allQuranData?: { [key: string]: SurahData[] } | null;
  onUpdateItem?: (itemId: string, updates: { notes?: string; customText?: string | null }) => void;
  onBack?: () => void;
}

export const TadabburPrintPage: React.FC<TadabburPrintPageProps> = ({
  items,
  allQuranData,
  onUpdateItem,
  onBack,
}) => {
  // Title & Header Customization
  const [pageTitle, setPageTitle] = useState('الدفتر');
  const [includePageTitle, setIncludePageTitle] = useState(true);
  const [includeBismillah, setIncludeBismillah] = useState(true);

  // Corner Metadata (Compact in the corner without wasting lines)
  const [includeDate, setIncludeDate] = useState(false);
  const [includeTotalCount, setIncludeTotalCount] = useState(false);

  // Print & Layout Model
  const [layoutModel, setLayoutModel] = useState<PrintLayoutModel>('table');
  const [notesPosition, setNotesPosition] = useState<NotesPosition>('table');
  const [flowMode, setFlowMode] = useState<PrintFlowMode>('contain');
  const [isMonochrome, setIsMonochrome] = useState(false);

  // Content Options - Separate Surah Name and Ayah Number as requested
  const [includeSurahName, setIncludeSurahName] = useState(true);
  const [includeAyahNumber, setIncludeAyahNumber] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  // Sort Order - Quran order by default as requested
  const [sortOrder, setSortOrder] = useState<PrintSortOrder>('quran');

  // Custom Item Texts & Notes (allowing custom truncation, underline, bold)
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});

  // Active Item Editor state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTextDraft, setEditingTextDraft] = useState('');
  const [editingNoteDraft, setEditingNoteDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Status feedback
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  // Sorted items list
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortOrder === 'quran') {
      list.sort((a, b) => {
        if (a.type === 'ayah' && b.type === 'ayah') {
          if (a.surah !== b.surah) return a.surah - b.surah;
          return a.ayah - b.ayah;
        }
        return 0;
      });
    }
    return list;
  }, [items, sortOrder]);

  // Helper to get authentic Uthmani text if available in allQuranData
  const getAyahUthmaniText = (item: SavedItem): string => {
    if (item.type !== 'ayah') return item.query || '';
    if (allQuranData) {
      const uthmaniData =
        allQuranData['quran-uthmani'] ||
        allQuranData['quran-simple'] ||
        allQuranData['quran-tajweed'];
      if (uthmaniData) {
        const surahObj = uthmaniData.find((s) => s.number === item.surah);
        if (surahObj) {
          const ayahObj = surahObj.ayahs.find((a) => a.numberInSurah === item.ayah);
          if (ayahObj && ayahObj.text) {
            return ayahObj.text;
          }
        }
      }
    }
    return item.text || '';
  };

  const getItemEffectiveText = (item: SavedItem): string => {
    if (customTexts[item.id] !== undefined) {
      return customTexts[item.id];
    }
    if (item.type === 'ayah' && item.customText) {
      return item.customText;
    }
    return getAyahUthmaniText(item);
  };

  const getItemEffectiveNote = (item: SavedItem): string => {
    if (customNotes[item.id] !== undefined) {
      return customNotes[item.id];
    }
    return item.notes || '';
  };

  const getSurahName = (surahNumber: number): string => {
    const surah = QURAN_INDEX.find((s) => s.number === surahNumber);
    return surah ? surah.name : `سورة ${surahNumber}`;
  };

  // Start editing a specific item
  const handleStartEdit = (item: SavedItem) => {
    setEditingItemId(item.id);
    setEditingTextDraft(getItemEffectiveText(item));
    setEditingNoteDraft(getItemEffectiveNote(item));
  };

  // Save changes from editor (Persisting smart customText & notes to Notebook permanently)
  const handleSaveEdit = () => {
    if (editingItemId) {
      const targetItem = items.find((i) => i.id === editingItemId);
      const originalAyahText = targetItem ? getAyahUthmaniText(targetItem).trim() : '';
      const trimmedDraftText = editingTextDraft.trim();
      const trimmedDraftNote = editingNoteDraft.trim();

      // Only save customText if text is actually modified from the authentic ayah
      const isCustomized =
        targetItem?.type === 'ayah' &&
        trimmedDraftText !== originalAyahText &&
        trimmedDraftText !== '';
      const customTextValue = isCustomized ? trimmedDraftText : null;

      setCustomTexts((prev) => ({
        ...prev,
        [editingItemId]: trimmedDraftText,
      }));
      setCustomNotes((prev) => ({
        ...prev,
        [editingItemId]: trimmedDraftNote,
      }));

      // Permanently save to the notebook in localStorage
      if (onUpdateItem) {
        onUpdateItem(editingItemId, {
          customText: customTextValue,
          notes: trimmedDraftNote,
        });
      }

      setEditingItemId(null);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Revert single item to original full ayah
  const handleResetToOriginalAyah = (item: SavedItem) => {
    const original = getAyahUthmaniText(item);
    setEditingTextDraft(original);
    setCustomTexts((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });

    // Remove customText from permanent storage so only ayah ref is stored
    if (onUpdateItem) {
      onUpdateItem(item.id, {
        customText: null,
      });
    }
  };

  // Formatting helpers for editing textarea
  const handleInsertTag = (tag: 'u' | 'b') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = editingTextDraft;
    const selectedText = currentVal.substring(start, end);

    let replacement = '';
    if (selectedText) {
      replacement = `<${tag}>${selectedText}</${tag}>`;
    } else {
      replacement = `<${tag}>نص</${tag}>`;
    }

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setEditingTextDraft(newVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length + 2, start + replacement.length - tag.length - 3);
    }, 50);
  };

  // Dedicated Print / Save as PDF Function with iframe popup fallback
  const handlePrint = () => {
    try {
      // 1. Try standard window.print()
      window.print();
    } catch (e) {
      console.warn('Standard window.print failed, opening printable window:', e);
      handleOpenPrintWindow();
    }
  };

  // Opens a clean standalone print popup window with complete styling
  const handleOpenPrintWindow = () => {
    const printableElem = document.getElementById('printable-tadabbur-document');
    if (!printableElem) {
      window.print();
      return;
    }

    try {
      const printWin = window.open('', '_blank', 'width=900,height=800,menubar=yes,toolbar=yes');
      if (!printWin) {
        // Pop-up blocked, fallback to standard window.print
        window.print();
        return;
      }

      // Collect all current page styles & font imports
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((el) => el.outerHTML)
        .join('\n');

      printWin.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${pageTitle || 'الدفتر'}</title>
          ${styles}
          <style>
            body {
              background: #ffffff !important;
              color: #000000 !important;
              padding: 1.5cm 1cm !important;
              direction: rtl !important;
              font-family: 'Traditional Arabic', 'Amiri', 'Arial', sans-serif !important;
            }
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body dir="rtl">
          <div class="${
            layoutModel === 'table'
              ? 'print-layout-table'
              : layoutModel === 'ultra-compact'
              ? 'print-layout-ultra-compact'
              : layoutModel === 'normal'
              ? 'print-layout-normal'
              : 'print-layout-large'
          } ${isMonochrome ? 'print-monochrome' : ''}">
            ${printableElem.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
      setPrintFeedback('تم فتح نافذة الطباعة / حفظ PDF');
      setTimeout(() => setPrintFeedback(null), 3000);
    } catch (err) {
      console.error('Error opening print window:', err);
      window.print();
    }
  };

  // Export as formatted Word .doc with complete RTL support
  const handleWordExport = () => {
    generateAndDownloadWordDoc(
      sortedItems,
      {
        pageTitle,
        layoutModel,
        notesPosition,
        includeDate,
        includeTotalCount,
        includePageTitle,
        includeBismillah,
        includeSurahName,
        includeAyahNumber,
        includeNotes,
        isMonochrome,
        customTexts,
        customNotes,
      },
      allQuranData
    );
  };

  // Quick Copy
  const handleCopyText = async () => {
    if (sortedItems.length === 0) return;
    const formatted = sortedItems
      .map((item, idx) => {
        const text = getItemEffectiveText(item).replace(/<[^>]*>/g, '');
        const note = getItemEffectiveNote(item);
        if (item.type === 'ayah') {
          const sName = getSurahName(item.surah);
          let label = '';
          if (includeSurahName && includeAyahNumber) {
            label = ` [${sName}: ${item.ayah}]`;
          } else if (includeSurahName) {
            label = ` [${sName}]`;
          } else if (includeAyahNumber) {
            label = ` [آية ${item.ayah}]`;
          }
          let t = `${idx + 1}. ﴿ ${text} ﴾${label}`;
          if (includeNotes && note.trim()) {
            t += `\n   ✍️ ${note.trim()}`;
          }
          return t;
        } else {
          let t = `${idx + 1}. بحث: "${item.query}"`;
          if (includeNotes && note.trim()) {
            t += `\n   ✍️ ${note.trim()}`;
          }
          return t;
        }
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = '#/saved';
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-text-primary pb-16 animate-fade-in">
      
      {/* 1. Standard Page Navigation & Header (Hidden in Print) */}
      <div className="no-print bg-surface border-b border-border-default sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Back button & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <ArrowRightIcon className="w-4 h-4" />
              <span>العودة للدفتر</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-border-subtle" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-primary-text-strong font-quran-title">
                صفحة إعداد الطباعة والتصدير والتحرير
              </h1>
              <p className="text-[11px] text-text-muted">
                {sortedItems.length} آية / ذكر مرتبة بترتيب المصحف الشريف
              </p>
            </div>
          </div>

          {/* Action Buttons: PDF / Print & Word & Standalone Window & Copy */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Print / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-hover shadow-md active:scale-95 transition-all cursor-pointer"
              title="طباعة الصفحة أو حفظها كملف PDF"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            {/* Standalone Print Window Fallback button if popup preferred */}
            <button
              type="button"
              onClick={handleOpenPrintWindow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-primary font-bold text-xs transition-all cursor-pointer"
              title="فتح صفحة الطباعة في نافذة جديدة مستقلة لحفظ PDF بدون أي قيود"
            >
              <span>نافذة PDF مستقلة</span>
            </button>

            {/* Word Export (.doc) */}
            <button
              type="button"
              onClick={handleWordExport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              title="تصدير الدفتر كملف مايكروسوفت وورد Word (.doc) بمحاذاة كاملة لليمين"
            >
              <FileTextIcon className="w-4 h-4" />
              <span>حفظ كملف وورد (.doc)</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                copiedStatus
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 font-bold'
                  : 'bg-surface hover:bg-surface-hover border-border-default text-text-secondary'
              }`}
              title="نسخ النصوص"
            >
              {copiedStatus ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copiedStatus ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>
        </div>

        {printFeedback && (
          <div className="bg-emerald-500/10 text-emerald-600 text-xs text-center py-1 font-bold">
            {printFeedback}
          </div>
        )}
      </div>

      {/* 2. Print Settings Toolbar & Toggles (Hidden in Print) */}
      <div className="no-print max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 space-y-3">
        
        {/* Main Settings Card */}
        <div className="bg-surface rounded-2xl border border-border-default p-4 sm:p-5 shadow-sm space-y-4">
          
          {/* Row 1: Layout Model + Notes Position + Color Mode + Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* 1. Layout Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                نموذج الطباعة واستهلاك الورق:
              </label>
              <div className="grid grid-cols-4 gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutModel('table');
                    setNotesPosition('table');
                  }}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    layoutModel === 'table'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="جدول الأذكار والفوائد - يتيح طباعة عشرات الأذكار على ورقة واحدة"
                >
                  📋 جدول
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutModel('ultra-compact')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    layoutModel === 'ultra-compact'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="سرد متصل ومضغوط جداً"
                >
                  ⚡ مضغوط
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutModel('normal')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    layoutModel === 'normal'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="بطاقات متوازنة ومنسقة"
                >
                  📖 عادي
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutModel('large')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    layoutModel === 'large'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="كبير للدراسة والقراءة"
                >
                  🔍 كبير
                </button>
              </div>
            </div>

            {/* 2. Notes / Placement */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                موضع الفائدة:
              </label>
              <div className="grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setNotesPosition('bottom')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    notesPosition === 'bottom'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="إظهار الفائدة أسفل الآية"
                >
                  ⬇️ أسفلها
                </button>
                <button
                  type="button"
                  onClick={() => setNotesPosition('side-left')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    notesPosition === 'side-left'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="إظهار الفائدة بجانب الآية في عمود أيسر"
                >
                  ⬅️ يسار
                </button>
                <button
                  type="button"
                  onClick={() => setNotesPosition('table')}
                  className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer ${
                    notesPosition === 'table'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="جدول أذكار متكامل"
                >
                  📋 جدول
                </button>
              </div>
            </div>

            {/* 3. Color Mode & Ink Saver */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                حبر الطباعة:
              </label>
              <div className="grid grid-cols-2 gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsMonochrome(true)}
                  className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    isMonochrome
                      ? 'bg-neutral-900 text-white shadow-sm font-bold dark:bg-neutral-100 dark:text-neutral-900'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="طباعة بالأبيض والأسود لتوفير حبر الطابعة بالكامل"
                >
                  🖤 أبيض وأسود
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonochrome(false)}
                  className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    !isMonochrome
                      ? 'bg-emerald-700 text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="ألوان المصحف الطبيعية الخضراء"
                >
                  🎨 ألوان طبيعية
                </button>
              </div>
            </div>

            {/* 4. Sort Order Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                ترتيب الآيات:
              </label>
              <div className="grid grid-cols-2 gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSortOrder('quran')}
                  className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    sortOrder === 'quran'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="ترتيب الآيات حسب ترتيب سور وآيات المصحف الشريف (افتراضي)"
                >
                  📖 ترتيب المصحف
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('saved')}
                  className={`py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                    sortOrder === 'saved'
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                  title="ترتيب الآيات حسب وقت الإضافة في الدفتر"
                >
                  🕒 ترتيب الإضافة
                </button>
              </div>
            </div>

          </div>

          {/* Row 2: Header Customization & Toggles */}
          <div className="pt-3 border-t border-border-subtle space-y-3">
            
            {/* Title text input */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-[140px] text-xs font-bold text-text-secondary">
                <PencilIcon className="w-3.5 h-3.5 text-primary" />
                <span>عنوان الصفحة المطبوعة:</span>
              </div>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="مثال: أذكار الصباح والمساء / آيات الشفاء / الدفتر"
                className="flex-1 w-full bg-surface-subtle border border-border-default rounded-xl px-3 py-1.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
              />
            </div>

            {/* Checkbox Toggles - Including separate Surah Name & Ayah Number */}
            <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs pt-1">
              <span className="font-bold text-text-secondary">خيارات الظهور:</span>
              
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={includePageTitle}
                  onChange={(e) => setIncludePageTitle(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>عنوان الصفحة</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={includeBismillah}
                  onChange={(e) => setIncludeBismillah(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>البسملة الشريفة</span>
              </label>

              {/* SEPARATE SURAH NAME TOGGLE */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary font-medium">
                <input
                  type="checkbox"
                  checked={includeSurahName}
                  onChange={(e) => setIncludeSurahName(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>اسم السورة</span>
              </label>

              {/* SEPARATE AYAH NUMBER TOGGLE */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary font-medium">
                <input
                  type="checkbox"
                  checked={includeAyahNumber}
                  onChange={(e) => setIncludeAyahNumber(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>رقم الآية</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>الفائدة</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary" title="يظهر في زاوية الصفحة العلوية دون استهلاك أي سطر إضافي">
                <input
                  type="checkbox"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>تاريخ الطباعة (بالزاوية)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-text-secondary hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={includeTotalCount}
                  onChange={(e) => setIncludeTotalCount(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>إجمالي المحفوظات</span>
              </label>
            </div>

          </div>

        </div>

        {/* Tip / helper notice */}
        <div className="flex items-center justify-between text-[11px] text-text-muted px-2">
          <span>💡 <b>ملاحظة ذكية:</b> يمكنك الضغط على أيقونة القلم ✏️ بجانب أي آية لاقتطاع جزء منها وتنسيقه بالتسطير أو التغميق.</span>
          {Object.keys(customTexts).length > 0 && (
            <span className="text-primary font-bold">({Object.keys(customTexts).length} آية مخصصة ومعدلة)</span>
          )}
        </div>

      </div>

      {/* 3. Modal / Popup Editor for Customizing an Ayah Text */}
      {editingItemId && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface rounded-2xl border border-border-default shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <PencilIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-text-strong">
                    تخصيص نص الآية واقتطاع الذكر
                  </h3>
                  <p className="text-xs text-text-muted">
                    امسح الزوائد للإبقاء على الذكر المطلوب، أو ضع خطاً تحت كلمات معينة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-2 flex-wrap bg-surface-subtle p-2 rounded-xl border border-border-subtle text-xs">
              <span className="font-bold text-text-secondary ml-1">تنسيق النص:</span>
              
              <button
                type="button"
                onClick={() => handleInsertTag('u')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-default font-bold text-text-primary shadow-2xs transition-colors cursor-pointer"
                title="تسطير الكلمة المحددة (وضع خط تحتها)"
              >
                <UnderlineIcon className="w-3.5 h-3.5 text-primary" />
                <u>تسطير كلمة</u>
              </button>

              <button
                type="button"
                onClick={() => handleInsertTag('b')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-default font-bold text-text-primary shadow-2xs transition-colors cursor-pointer"
                title="تغميق الكلمة (عريض)"
              >
                <BoldIcon className="w-3.5 h-3.5 text-primary" />
                <b>تغميق (Bold)</b>
              </button>

              {sortedItems.find((it) => it.id === editingItemId) && (
                <button
                  type="button"
                  onClick={() => {
                    const it = sortedItems.find((x) => x.id === editingItemId);
                    if (it) handleResetToOriginalAyah(it);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer mr-auto"
                  title="استعادة نص الآية الأصلي كاملاً من المصحف"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" />
                  <span>استعادة الآية كاملة</span>
                </button>
              )}
            </div>

            {/* Ayah Text Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                نص الآية الكريمة / الذكر المقتطع:
              </label>
              <textarea
                ref={textareaRef}
                value={editingTextDraft}
                onChange={(e) => setEditingTextDraft(e.target.value)}
                rows={4}
                dir="rtl"
                className="w-full bg-surface-subtle border border-border-default rounded-xl p-3 text-base text-text-primary font-quran leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
                placeholder="اكتب أو اقتطع نص الذكر هنا..."
              />
            </div>

            {/* Note / Benefit Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                الفائدة / الغرض / الملاحظة (مثال: لغفران الذنوب / لطلب الشفاء):
              </label>
              <input
                type="text"
                value={editingNoteDraft}
                onChange={(e) => setEditingNoteDraft(e.target.value)}
                dir="rtl"
                className="w-full bg-surface-subtle border border-border-default rounded-xl px-3 py-2 text-xs sm:text-sm text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
                placeholder="مثال: لغفران الذنوب / عند الضيق والهم / أذكار الصباح..."
              />
            </div>

            {/* Live Preview */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle text-xs space-y-1">
              <span className="font-bold text-text-muted">معاينة حية:</span>
              <div
                className="text-sm font-quran text-primary-text leading-relaxed"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: editingTextDraft || '—' }}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover shadow-md active:scale-95 transition-all cursor-pointer"
              >
                حفظ التعديل
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Printable Paper Area / Live Page Preview */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-2">
        <div
          id="printable-tadabbur-document"
          className={`bg-white text-black p-4 sm:p-7 rounded-2xl shadow-xl border border-neutral-300 mx-auto transition-all ${
            layoutModel === 'table'
              ? 'print-layout-table'
              : layoutModel === 'ultra-compact'
              ? 'print-layout-ultra-compact'
              : layoutModel === 'normal'
              ? 'print-layout-normal'
              : 'print-layout-large'
          } ${isMonochrome ? 'print-monochrome' : ''}`}
          style={{ minHeight: '750px' }}
        >
          
          {/* Header Area (Corner Date + Bismillah + Editable Title without wasted lines) */}
          {(includePageTitle || includeBismillah || includeDate || includeTotalCount) && (
            <div className={`relative text-center pb-2 mb-3 border-b-2 ${isMonochrome ? 'border-black' : 'border-emerald-800'}`}>
              
              {/* Corner Metadata (Top-Left in RTL) - Conserves 100% of vertical lines */}
              {(includeDate || includeTotalCount) && (
                <div className="absolute top-0 left-0 text-left text-[10px] text-neutral-600 font-sans leading-tight">
                  {includeDate && <div>{new Date().toLocaleDateString('ar-SA')}</div>}
                  {includeTotalCount && <div>العدد: {sortedItems.length}</div>}
                </div>
              )}

              {/* Separate Bismillah */}
              {includeBismillah && (
                <p className={`font-bismillah text-base sm:text-lg font-bold mb-0.5 ${isMonochrome ? 'text-black' : 'text-emerald-900'}`}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              )}

              {/* Editable Page Title */}
              {includePageTitle && (
                <h2 className="text-base sm:text-lg font-bold text-black font-quran-title">
                  {pageTitle.trim() || 'الدفتر'}
                </h2>
              )}

            </div>
          )}

          {/* Empty State */}
          {sortedItems.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">
              <p className="text-base font-bold">لا توجد آيات محفوظة حالياً في الدفتر للطباعة.</p>
            </div>
          ) : layoutModel === 'table' ? (
            /* --- 1. TABLE / DHIKR SHEET FORMAT (جدول الأذكار والفوائد فائق التوفير) --- */
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm font-sans" dir="rtl">
                <thead>
                  <tr className={`border-b-2 ${isMonochrome ? 'bg-neutral-100 border-black text-black' : 'bg-emerald-50 border-emerald-700 text-emerald-950'} font-bold`}>
                    {/* First column: Slim Ayah rosette symbol ۝ instead of wide text */}
                    <th
                      className="py-1.5 px-1 text-center w-7 sm:w-9 whitespace-nowrap border border-neutral-300 font-quran text-base sm:text-lg leading-none"
                      title={includeAyahNumber ? 'رقم الآية' : 'م'}
                    >
                      {includeAyahNumber ? '۝' : 'م'}
                    </th>
                    <th className="py-1.5 px-3 border border-neutral-300">الآية</th>
                    {includeNotes && (
                      <th className="py-1.5 px-3 w-1/3 border border-neutral-300">الفائدة</th>
                    )}
                    <th className="py-1.5 px-1 text-center w-8 no-print border border-neutral-300">تحرير</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, index) => {
                    const effectiveText = getItemEffectiveText(item);
                    const effectiveNote = getItemEffectiveNote(item);
                    const surahName = item.type === 'ayah' ? getSurahName(item.surah) : '';
                    const displayAyahOrIndex = item.type === 'ayah' && includeAyahNumber ? item.ayah : index + 1;

                    return (
                      <tr
                        key={item.id || index}
                        className={`border-b border-neutral-300 group hover:bg-neutral-50/80 transition-colors ${
                          index % 2 === 1 ? (isMonochrome ? 'bg-neutral-50/50' : 'bg-emerald-50/20') : ''
                        }`}
                      >
                        {/* Ayah Number or Serial - Minimal width */}
                        <td className="py-2 px-1 text-center font-bold text-neutral-800 border border-neutral-300 align-top text-xs sm:text-sm whitespace-nowrap w-7 sm:w-9">
                          {displayAyahOrIndex}
                        </td>

                        {/* Verse / Dhikr Text */}
                        <td className="py-2 px-3 border border-neutral-300 align-top leading-relaxed">
                          <span
                            className={`quran-print-uthmani text-sm sm:text-base leading-[1.8] text-black ${
                              isMonochrome ? '' : 'text-neutral-950'
                            }`}
                            dangerouslySetInnerHTML={{ __html: effectiveText }}
                          />
                          {includeSurahName && item.type === 'ayah' && (
                            <span className={`inline-block mr-1.5 font-bold text-xs ${
                              isMonochrome ? 'text-black' : 'text-emerald-800'
                            }`}>
                              [{surahName}]
                            </span>
                          )}
                        </td>

                        {/* Note / Purpose */}
                        {includeNotes && (
                          <td className="py-2 px-3 text-neutral-800 border border-neutral-300 align-top text-xs leading-relaxed">
                            {effectiveNote ? (
                              <span className="font-medium text-neutral-900">{effectiveNote}</span>
                            ) : (
                              <span className="text-neutral-400">—</span>
                            )}
                          </td>
                        )}

                        {/* Quick In-Place Edit Button (Hidden in Print) */}
                        <td className="py-2 px-1 text-center border border-neutral-300 no-print align-top">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-1 rounded-md text-neutral-400 hover:text-primary hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="تعديل نص الآية أو الفائدة"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : layoutModel === 'ultra-compact' ? (
            /* --- 2. ULTRA COMPACT MODEL (سرد متصل ومضغوط جداً) --- */
            <div className="print-ultra-continuous text-justify leading-relaxed" dir="rtl">
              {sortedItems.map((item, index) => {
                const effectiveText = getItemEffectiveText(item);
                const effectiveNote = getItemEffectiveNote(item);
                const surahName = item.type === 'ayah' ? getSurahName(item.surah) : '';

                return (
                  <span key={item.id || index} className="print-ultra-item inline group">
                    {includeSurahName && item.type === 'ayah' && (
                      <span className={`inline-block mx-1 px-1.5 py-0.2 rounded text-[11px] font-bold ${
                        isMonochrome
                          ? 'bg-neutral-200 text-black border border-black'
                          : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      }`}>
                        [{surahName}]
                      </span>
                    )}

                    <span
                      className={`quran-print-uthmani text-base sm:text-lg leading-[1.9] text-black ${
                        isMonochrome ? '' : 'text-neutral-950'
                      }`}
                      dangerouslySetInnerHTML={{ __html: effectiveText }}
                    />

                    {item.type === 'ayah' && includeAyahNumber && (
                      <span className={`print-ayah-bracket mr-1 font-bold text-sm sm:text-base ${
                        isMonochrome ? 'text-black' : 'text-emerald-800'
                      }`}>
                        ﴿{item.ayah}﴾
                      </span>
                    )}

                    {/* Edit pen in preview */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="no-print inline-block mx-1 p-0.5 text-neutral-300 hover:text-primary transition-colors cursor-pointer align-middle"
                      title="تعديل هذا المقطع"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>

                    {/* Inline / Compact Note */}
                    {includeNotes && effectiveNote && effectiveNote.trim() && (
                      <span className={`block my-1 px-2 py-0.5 text-xs rounded border-r-2 ${
                        isMonochrome
                          ? 'bg-neutral-100 text-black border-black'
                          : 'bg-amber-50 text-neutral-900 border-amber-600'
                      }`}>
                        <b>✍️ فائدة:</b> {effectiveNote}
                      </span>
                    )}

                    <span className="inline-block w-2" />
                  </span>
                );
              })}
            </div>
          ) : (
            /* --- 3. NORMAL & LARGE CARD MODELS --- */
            <div className="space-y-3">
              {sortedItems.map((item, index) => {
                const effectiveText = getItemEffectiveText(item);
                const effectiveNote = getItemEffectiveNote(item);
                const surahName = item.type === 'ayah' ? getSurahName(item.surah) : '';
                const isSide = notesPosition === 'side-left' || notesPosition === 'side-right';

                // Combined Header Title for Normal / Large Card
                let cardTitle = '';
                if (item.type === 'ayah') {
                  if (includeSurahName && includeAyahNumber) {
                    cardTitle = `${surahName} ﴿الآية ${item.ayah}﴾`;
                  } else if (includeSurahName) {
                    cardTitle = surahName;
                  } else if (includeAyahNumber) {
                    cardTitle = `الآية ﴿${item.ayah}﴾`;
                  }
                } else {
                  cardTitle = `بحث: "${item.query}"`;
                }

                return (
                  <div
                    key={item.id || index}
                    className={`print-ayah-box relative group transition-colors ${
                      flowMode === 'split' ? 'print-split-page' : ''
                    }`}
                  >
                    {/* Top bar with Surah Name & Ayah Number & Edit Button */}
                    {(cardTitle || true) && (
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-1 mb-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          {cardTitle ? (
                            <span className={`font-bold ${isMonochrome ? 'text-black' : 'text-emerald-900'}`}>
                              {cardTitle}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-medium">ذكر محفوظ</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 text-[10px]">#{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="no-print p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-primary transition-colors cursor-pointer"
                            title="تعديل واقتطاع الآية"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content Body: Side-by-Side or Stacked */}
                    {isSide && includeNotes && effectiveNote ? (
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        {/* Ayah Column */}
                        <div className="flex-1 w-full text-justify">
                          <div
                            className={`quran-print-uthmani text-black ${
                              layoutModel === 'large' ? 'text-xl sm:text-2xl leading-[2.4]' : 'text-base sm:text-lg leading-[2.1]'
                            }`}
                            dir="rtl"
                            dangerouslySetInnerHTML={{ __html: effectiveText }}
                          />
                        </div>
                        {/* Side Note Column */}
                        <div className={`w-full sm:w-1/3 p-2.5 rounded-lg border-r-3 text-xs leading-relaxed ${
                          isMonochrome
                            ? 'bg-neutral-100 text-black border-black'
                            : 'bg-amber-50/80 text-neutral-900 border-amber-600'
                        }`}>
                          <span className={`font-bold block mb-0.5 ${isMonochrome ? 'text-black' : 'text-amber-900'}`}>
                            الفائدة:
                          </span>
                          <p className="whitespace-pre-wrap">{effectiveNote}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Full Width Ayah */}
                        <div
                          className={`quran-print-uthmani text-justify text-black ${
                            layoutModel === 'large' ? 'text-xl sm:text-2xl leading-[2.4]' : 'text-base sm:text-lg leading-[2.1]'
                          }`}
                          dir="rtl"
                          dangerouslySetInnerHTML={{ __html: effectiveText }}
                        />

                        {/* Bottom Note */}
                        {includeNotes && effectiveNote && effectiveNote.trim() && (
                          <div className={`mt-2 p-2 rounded-lg border-r-3 text-xs leading-relaxed ${
                            isMonochrome
                              ? 'bg-neutral-100 text-black border-black'
                              : 'bg-amber-50/80 text-neutral-900 border-amber-600'
                          }`}>
                            <span className={`font-bold ml-1 ${isMonochrome ? 'text-black' : 'text-amber-900'}`}>
                              ✍️ تدبر وخاطرة:
                            </span>
                            <span className="whitespace-pre-wrap">{effectiveNote}</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
