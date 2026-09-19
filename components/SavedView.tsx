import React, { useState, useMemo, useEffect } from 'react';
import type { Collections, SavedItem, SurahData } from '../types';
import { UnifiedSavedItemCard } from './saved/UnifiedSavedItemCard';
import { TadabburPrintPage } from './saved/TadabburPrintPage';
import { generateAndDownloadWordDoc } from './saved/exportToWord';
import { QURAN_INDEX } from '../quranIndex';
import {
  PrinterIcon,
  SearchIcon,
  TrashIcon,
  CopyIcon,
  ArrowUpDownIcon,
  DownloadIcon,
  UploadIcon,
  BookOpenIcon,
  SparklesIcon,
  CheckIcon,
  FileTextIcon
} from './icons';

interface SavedViewProps {
  collections?: Collections;
  collectionId?: string | null;
  items?: SavedItem[];
  allQuranData?: { [key: string]: SurahData[] } | null;
  initialViewMode?: 'notebook' | 'print';
  onDeleteCollection?: (collectionId: string) => void;
  onDeleteSavedItem?: (collectionId: string, itemId: string) => void;
  onUpdateNotes?: (collectionId: string, itemId: string, notes: string) => void;
  onUpdateItem?: (itemId: string, updates: { notes?: string; customText?: string | null }) => void;
  onExportNotebook?: () => Promise<string>;
  onImportNotebook?: (content: string) => Promise<void>;
  onClearAll?: () => void;
  onReorderItems?: (items: SavedItem[]) => void;
  onMoveItem?: (itemId: string, direction: 'up' | 'down') => void;
}

type SortOption = 'custom' | 'quran' | 'newest' | 'oldest';

const SavedView: React.FC<SavedViewProps> = ({
  collections,
  collectionId,
  items: propsItems,
  allQuranData,
  initialViewMode,
  onDeleteSavedItem,
  onUpdateNotes,
  onUpdateItem,
  onExportNotebook,
  onImportNotebook,
  onClearAll,
  onReorderItems,
  onMoveItem,
}) => {
  // View mode: standard notebook list vs full dedicated print page
  const [viewMode, setViewMode] = useState<'notebook' | 'print'>(
    initialViewMode === 'print' || collectionId === 'print' ? 'print' : 'notebook'
  );

  useEffect(() => {
    if (initialViewMode === 'print' || collectionId === 'print') {
      setViewMode('print');
    }
  }, [initialViewMode, collectionId]);
  // Unified items list extracted from props or collections
  const rawItems: SavedItem[] = useMemo(() => {
    if (Array.isArray(propsItems)) return propsItems;
    if (collections) {
      if (collections.default && Array.isArray(collections.default.items)) {
        return collections.default.items;
      }
      const all: SavedItem[] = [];
      const seen = new Set<string>();
      Object.values(collections).forEach(col => {
        if (Array.isArray(col.items)) {
          col.items.forEach(it => {
            if (!seen.has(it.id)) {
              seen.add(it.id);
              all.push(it);
            }
          });
        }
      });
      return all;
    }
    return [];
  }, [propsItems, collections]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('quran');
  const [copyAllStatus, setCopyAllStatus] = useState(false);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    let result = [...rawItems];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        if (item.type === 'ayah') {
          const sName = QURAN_INDEX.find(s => s.number === item.surah)?.name || '';
          const matchSurah = sName.toLowerCase().includes(q) || `سورة ${sName}`.includes(q);
          const matchNumber = `${item.surah}:${item.ayah}`.includes(q) || `${item.ayah}` === q;
          const matchText = (item.text || '').toLowerCase().includes(q);
          const matchNotes = (item.notes || '').toLowerCase().includes(q);
          return matchSurah || matchNumber || matchText || matchNotes;
        } else {
          const matchQuery = (item.query || '').toLowerCase().includes(q);
          const matchNotes = (item.notes || '').toLowerCase().includes(q);
          return matchQuery || matchNotes;
        }
      });
    }

    // Apply sorting
    if (sortOption === 'newest') {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortOption === 'oldest') {
      result.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (sortOption === 'quran') {
      result.sort((a, b) => {
        if (a.type === 'ayah' && b.type === 'ayah') {
          if (a.surah !== b.surah) return a.surah - b.surah;
          return a.ayah - b.ayah;
        }
        return 0;
      });
    }

    return result;
  }, [rawItems, searchQuery, sortOption]);

  // Handle Delete single item
  const handleDeleteItem = (itemId: string) => {
    if (onDeleteSavedItem) {
      onDeleteSavedItem('default', itemId);
    }
  };

  // Handle Note Update
  const handleUpdateNotes = (itemId: string, notes: string) => {
    if (onUpdateItem) {
      onUpdateItem(itemId, { notes });
    } else if (onUpdateNotes) {
      onUpdateNotes('default', itemId, notes);
    }
  };

  // Handle Full Item Content Update (Ayah custom text, notes)
  const handleUpdateItem = (itemId: string, updates: { notes?: string; customText?: string | null }) => {
    if (onUpdateItem) {
      onUpdateItem(itemId, updates);
    } else if (onUpdateNotes && updates.notes !== undefined) {
      onUpdateNotes('default', itemId, updates.notes);
    }
  };

  // Handle Move item up/down
  const handleMove = (itemId: string, direction: 'up' | 'down') => {
    if (onMoveItem) {
      onMoveItem(itemId, direction);
    } else if (onReorderItems) {
      const index = rawItems.findIndex(i => i.id === itemId);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === rawItems.length - 1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const newItems = [...rawItems];
      const [moved] = newItems.splice(index, 1);
      newItems.splice(targetIndex, 0, moved);
      onReorderItems(newItems);
    }
  };

  // Copy all saved verses to clipboard
  const handleCopyAll = async () => {
    if (rawItems.length === 0) return;

    const formatted = rawItems
      .map((item, idx) => {
        if (item.type === 'ayah') {
          const sName = QURAN_INDEX.find(s => s.number === item.surah)?.name || `سورة ${item.surah}`;
          let text = `${idx + 1}. ﴿ ${item.text} ﴾ [${sName}: ${item.ayah}]`;
          if (item.notes && item.notes.trim()) {
            text += `\n   ✍️ فوائد وتدبر: ${item.notes.trim()}`;
          }
          return text;
        } else {
          let text = `${idx + 1}. بحث قرآني: "${item.query}"`;
          if (item.notes && item.notes.trim()) {
            text += `\n   ✍️ ملاحظات: ${item.notes.trim()}`;
          }
          return text;
        }
      })
      .join('\n\n');

    const header = `📖 الدفتر\nعدد الآيات: ${rawItems.length}\n${'='.repeat(40)}\n\n`;

    try {
      await navigator.clipboard.writeText(header + formatted);
      setCopyAllStatus(true);
      setTimeout(() => setCopyAllStatus(false), 2500);
    } catch (e) {
      console.error('Failed to copy all items', e);
    }
  };

  // Import Notebook file
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportNotebook) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          await onImportNotebook(content);
        } catch (err: any) {
          alert(err.message || 'حدث خطأ أثناء استيراد الدفتر');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Direct Word Export with default optimal settings
  const handleQuickWordExport = () => {
    if (rawItems.length === 0) return;
    generateAndDownloadWordDoc(
      filteredItems.length > 0 ? filteredItems : rawItems,
      {
        pageTitle: 'الدفتر',
        layoutModel: 'table',
        notesPosition: 'table',
        includeDate: false,
        includeTotalCount: false,
        includePageTitle: true,
        includeBismillah: true,
        includeSurahName: true,
        includeAyahNumber: true,
        includeSurahHeader: true,
        includeNotes: true,
        isMonochrome: false,
      },
      allQuranData
    );
  };

  // If in dedicated print page mode, render TadabburPrintPage directly as a standard full page
  if (viewMode === 'print') {
    return (
      <TadabburPrintPage
        items={filteredItems.length > 0 ? filteredItems : rawItems}
        allQuranData={allQuranData}
        onUpdateItem={handleUpdateItem}
        onBack={() => {
          setViewMode('notebook');
          if (window.location.hash.includes('saved/print')) {
            window.location.hash = '#/saved';
          }
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="bg-surface rounded-2xl border border-border-default shadow-md p-5 sm:p-7 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BookOpenIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-text-strong font-quran-title">
                  الدفتر
                </h1>
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                  جميع الآيات والملاحظات المحفوظة في مكان واحد بنقرة واحدة
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Print Studio Page Button */}
            <button
              type="button"
              onClick={() => {
                setViewMode('print');
                window.location.hash = '#/saved/print';
              }}
              disabled={rawItems.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-hover shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              title="الانتقال لصفحة إعداد الطباعة والتصدير"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>طباعة وتصدير</span>
            </button>

            {/* Save as Word (.doc) Button */}
            <button
              type="button"
              onClick={handleQuickWordExport}
              disabled={rawItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              title="تصدير الدفتر كملف وورد Word (.doc)"
            >
              <FileTextIcon className="w-4 h-4" />
              <span>ملف وورد</span>
            </button>

            {/* Copy All Button */}
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={rawItems.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                copyAllStatus
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-surface hover:bg-surface-hover border-border-default text-text-secondary disabled:opacity-40'
              }`}
              title="نسخ كافة الآيات مع الملاحظات"
            >
              {copyAllStatus ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              <span>{copyAllStatus ? 'تم النسخ!' : 'نسخ الكل'}</span>
            </button>

            {/* Export File Button */}
            {onExportNotebook && (
              <button
                type="button"
                onClick={() => onExportNotebook()}
                disabled={rawItems.length === 0}
                className="p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-colors disabled:opacity-40 cursor-pointer"
                title="تصدير كملف احتياطي (JSON)"
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
            )}

            {/* Import File Button */}
            {onImportNotebook && (
              <label
                className="p-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer"
                title="استيراد ملف دفتر تدبر"
              >
                <UploadIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}

            {/* Clear All Button */}
            {onClearAll && rawItems.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                title="مسح كافة الآيات من الدفتر"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الآيات أو الملاحظات..."
              className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-surface-subtle border border-border-default rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
            />
            <SearchIcon className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Selector & Stats */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted">
              <ArrowUpDownIcon className="w-3.5 h-3.5" />
              <span>الترتيب:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="خيارات ترتيب الآيات"
                className="bg-surface-subtle border border-border-default rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              >
                <option value="custom">مخصص (الترتيب اليدوي)</option>
                <option value="newest">الأحدث حفظاً</option>
                <option value="oldest">الأقدم حفظاً</option>
                <option value="quran">ترتيب المصحف الشريف</option>
              </select>
            </div>

            <span className="font-bold text-primary-text bg-primary/10 px-3 py-1 rounded-full">
              {rawItems.length} آية محفوظة
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Saved Items Cards List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <UnifiedSavedItemCard
              key={item.id}
              item={item}
              index={index}
              totalItems={filteredItems.length}
              allQuranData={allQuranData}
              onDelete={handleDeleteItem}
              onMove={handleMove}
              onUpdateNotes={handleUpdateNotes}
              onUpdateItem={handleUpdateItem}
            />
          ))}
        </div>
      ) : rawItems.length > 0 && searchQuery ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-border-default p-8">
          <p className="text-lg font-bold text-text-primary mb-2">لا توجد نتائج مطابقة لبحثك</p>
          <p className="text-sm text-text-muted mb-4">جرب البحث بكلمة أخرى من نص الآية أو اسم السورة</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-surface-subtle hover:bg-surface-hover text-primary font-bold rounded-xl border border-border-subtle text-xs transition-colors"
          >
            مسح البحث
          </button>
        </div>
      ) : (
        <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border-default p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-primary-text-strong mb-2 font-quran-title">
            الدفتر فارغ حالياً
          </h2>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
            عند تصفحك لأي سورة أو صفحة في المصحف أو نتائج البحث، اضغط على زر الحفظ بجانب الآية لحفظها هنا مباشرة بنقرة واحدة!
          </p>
          <a
            href="#/surah/1"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-md active:scale-95 transition-all"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>تصفح المصحف الشريف</span>
          </a>
        </div>
      )}

    </div>
  );
};

export default SavedView;
