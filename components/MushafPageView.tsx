import React, { useState, useEffect, useMemo } from 'react';
import { fetchPageVersesV4, QuranV4Verse } from '../services/quranApiV4';
import { QURAN_INDEX } from '../quranIndex';
import { useSettingsContext } from '../contexts/SettingsContext';
import { renderWordWithHaMeem, hasHaMeem } from '../utils/haMeemHighlight';
import { renderWordWithNoorani, isWordPureNoorani } from '../utils/nooraniHighlight';
import { injectMushafFontFaces, ensurePageFontLoaded, preloadAdjacentPageFonts } from '../utils/mushafFonts';
import { openQuranSymbolModal } from '../data/quranSymbolsData';
import { CopyPageModal, PageAyahForCopy } from './CopyPageModal';
import { CopyIcon } from './icons';
import { normalizeArabicText } from '../utils/text';

interface MushafPageViewProps {
  pageNumber: number;
  onPageChange: (newPage: number) => void;
  onWordClick?: (wordText: string, surahNum: number, ayahNum: number, wordIndex: number) => void;
  isSelectionMode?: boolean;
  selectedAyahKeys?: string[];
  onAyahClick?: (e: React.MouseEvent, surahNum: number, ayahNum: number, text: string) => void;
  onAyahActionClick?: (e: React.MouseEvent, surahNum: number, ayahNum: number) => void;
  highlightAyahNumber?: number | null;
  targetSurahNumber?: number | null;
  currentlyPlayingAyahGlobalNumber?: number | null;
}

export const MushafPageView: React.FC<MushafPageViewProps> = ({
  pageNumber,
  onPageChange,
  onWordClick,
  isSelectionMode,
  selectedAyahKeys,
  onAyahClick,
  onAyahActionClick,
  highlightAyahNumber,
  targetSurahNumber,
  currentlyPlayingAyahGlobalNumber
}) => {
  const [verses, setVerses] = useState<QuranV4Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCopyPageModalOpen, setIsCopyPageModalOpen] = useState(false);
  const { fontStyle, mushafFrameStyle, highlightHaMeem, highlightNoorani, highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta, hideMushafFrames, ayahHighlightDuration } = useSettingsContext();
  const [isFontReady, setIsFontReady] = useState(false);
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('');

  // Manage temporary or permanent ayah highlight
  const [activeHighlightAyah, setActiveHighlightAyah] = useState<number | null>(highlightAyahNumber ?? null);

  useEffect(() => {
    setActiveHighlightAyah(highlightAyahNumber ?? null);
    if (highlightAyahNumber && ayahHighlightDuration !== 'permanent') {
      const ms = ayahHighlightDuration === '3s' ? 3000 : 5000;
      const timer = setTimeout(() => {
        setActiveHighlightAyah(null);
      }, ms);
      return () => clearTimeout(timer);
    }
  }, [highlightAyahNumber, pageNumber, ayahHighlightDuration]);

  useEffect(() => {
    const handleLiveSearch = (e: any) => {
      const q = typeof e?.detail?.query === 'string' ? e.detail.query.trim() : '';
      setLiveSearchQuery(q);
    };
    window.addEventListener('quran-live-search', handleLiveSearch);
    return () => window.removeEventListener('quran-live-search', handleLiveSearch);
  }, []);

  const totalPages = 604;

  const pageAyahsForCopy = useMemo<PageAyahForCopy[]>(() => {
    return verses.map(v => {
      const [sNumStr, aNumStr] = (v.verse_key || '1:1').split(':');
      const sNum = parseInt(sNumStr, 10) || 1;
      const aNum = parseInt(aNumStr, 10) || v.verse_number || 1;
      const sName = QURAN_INDEX.find(s => s.number === sNum)?.name || `سورة ${sNum}`;
      const uthmaniText = v.text_uthmani || v.words?.filter(w => w.char_type_name === 'word').map(w => w.text_uthmani).filter(Boolean).join(' ') || '';
      return {
        surahNumber: sNum,
        surahName: sName,
        ayahNumberInSurah: aNum,
        textUthmani: uthmaniText,
        juz: v.juz_number
      };
    });
  }, [verses]);

  useEffect(() => {
    if (fontStyle === 'mushaf') {
      injectMushafFontFaces();
      setIsFontReady(true);
    } else {
      setIsFontReady(false);
    }
  }, [fontStyle]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadDataAndFont = async () => {
      // Fetch verses data and ensure font for this page is ready simultaneously
      const [data] = await Promise.all([
        fetchPageVersesV4(pageNumber),
        ensurePageFontLoaded(pageNumber)
      ]);

      if (isMounted) {
        setVerses(data);
        setLoading(false);
        // Preload next and previous pages in background for instant flipping
        preloadAdjacentPageFonts(pageNumber);
      }
    };

    loadDataAndFont();
    return () => { isMounted = false; };
  }, [pageNumber]);

  // Scroll to highlighted ayah when page and verses load
  useEffect(() => {
    if (highlightAyahNumber && !loading) {
      const targetSurah = targetSurahNumber || (verses.length > 0 ? parseInt(verses[0].verse_key.split(':')[0], 10) : 1);
      const elementId = `ayah-${targetSurah}-${highlightAyahNumber}`;
      
      let attempts = 0;
      const intervalId = setInterval(() => {
        const element = document.getElementById(elementId);
        attempts++;
        if (element) {
          clearInterval(intervalId);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (attempts > 30) {
          clearInterval(intervalId);
        }
      }, 100);

      return () => clearInterval(intervalId);
    }
  }, [loading, highlightAyahNumber, targetSurahNumber, pageNumber]);

  // Scroll to playing ayah during audio playback
  useEffect(() => {
    if (currentlyPlayingAyahGlobalNumber && !loading && verses.length > 0) {
      const playingVerse = verses.find(v => v.id === currentlyPlayingAyahGlobalNumber);
      if (playingVerse) {
        const sNum = parseInt(playingVerse.verse_key.split(':')[0], 10);
        const elementId = `ayah-${sNum}-${playingVerse.verse_number}`;
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentlyPlayingAyahGlobalNumber, loading, verses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group words by line_number
  const linesMap: Record<number, any[]> = {};
  verses.forEach(verse => {
    verse.words.forEach(word => {
      const lineNum = word.line_number || 1;
      if (!linesMap[lineNum]) linesMap[lineNum] = [];
      linesMap[lineNum].push({ word, verse });
    });
  });

  const maxLines = (pageNumber === 1 || pageNumber === 2) ? 8 : 15;
  const lineNumbers = [];
  for (let i = 1; i <= maxLines; i++) lineNumbers.push(i);

  const getMissingLineInfo = (lineNum: number) => {
    const nextVerse = verses.find(v => (v.words[0]?.line_number || 1) > lineNum);
    if (nextVerse) {
        const nextSurahNum = parseInt(nextVerse.verse_key.split(':')[0], 10);
        const nextVerseNum = nextVerse.verse_number;
        if (nextVerseNum === 1) {
            const firstWordLine = nextVerse.words[0]?.line_number || 1;
            if (nextSurahNum === 1) {
                if (lineNum === firstWordLine - 1) return { type: 'chapter_header', surahNumber: 1 };
            } else if (nextSurahNum === 9) {
                if (lineNum === firstWordLine - 1) return { type: 'chapter_header', surahNumber: 9 };
            } else {
                if (lineNum === firstWordLine - 1) return { type: 'bismillah', surahNumber: nextSurahNum };
                if (lineNum === firstWordLine - 2) return { type: 'chapter_header', surahNumber: nextSurahNum };
            }
        }
    } else {
        const lastSurahOnPage = verses.length > 0 ? parseInt(verses[verses.length - 1].verse_key.split(':')[0], 10) : 1;
        const nextSurahNum = lastSurahOnPage + 1;
        if (nextSurahNum <= 114) {
             const lastPopulatedLine = Object.keys(linesMap).length > 0 ? Math.max(...Object.keys(linesMap).map(Number)) : 0;
             if (nextSurahNum === 9) {
                  if (lineNum === lastPopulatedLine + 1) return { type: 'chapter_header', surahNumber: 9 };
             } else {
                  if (lineNum === lastPopulatedLine + 1) return { type: 'chapter_header', surahNumber: nextSurahNum };
                  if (lineNum === lastPopulatedLine + 2) return { type: 'bismillah', surahNumber: nextSurahNum };
             }
        }
    }
    return null;
  };

  // Page info
  const firstVerse = verses[0];
  let surahName = '';
  let juzNumber = 1;
  if (firstVerse) {
    const sId = parseInt(firstVerse.verse_key.split(':')[0], 10);
    const surahInfo = QURAN_INDEX.find(s => s.number === sId);
    if (surahInfo) surahName = String(surahInfo.name).replace(/^سُورَةُ\s*/, '').trim();
    if (firstVerse.juz_number) juzNumber = firstVerse.juz_number;
  }

  const isOddPage = pageNumber % 2 !== 0;

  const isFirstLineChapterHeader = () => {
      const line1 = linesMap[1];
      if (!line1 || line1.length === 0) {
          const missingInfo = getMissingLineInfo(1);
          return missingInfo?.type === 'chapter_header';
      }
      return line1.some(i => i.word.char_type_name === 'chapter_header');
  };

  const showSurahName = !isFirstLineChapterHeader();
  const frameClass = hideMushafFrames ? 'frame-none minimal-margins' : `frame-${mushafFrameStyle || 'classic'}`;

  return (
    <div className={`mushaf-page ${frameClass} mx-auto w-full max-w-2xl relative select-text ${hideMushafFrames ? 'shadow-none! p-1 sm:p-2' : 'shadow-2xl'}`} dir="rtl">
      {/* Header */}
      <header className={`mushaf-header flex justify-between px-2 font-bold text-amber-700/80 dark:text-amber-500/80 text-xs sm:text-sm ${hideMushafFrames ? 'border-b border-amber-200/25 pb-1 mb-1.5' : 'border-b border-amber-200/50 pb-2 mb-2 sm:mb-4'}`}>
        {isOddPage ? (
            <>
                <span>{showSurahName ? `سورة ${surahName}` : ''}</span>
                <button
                    type="button"
                    onClick={() => openQuranSymbolModal({ type: 'juz', juzNumber: juzNumber })}
                    className="hover:text-amber-900 dark:hover:text-amber-300 hover:underline transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    title={`شرح وتفاصيل الجزء ${juzNumber} - اضغط لمعرفة التفاصيل`}
                >
                    <span>📖</span>
                    <span>الجزء {juzNumber.toLocaleString('ar-EG')}</span>
                </button>
            </>
        ) : (
            <>
                <button
                    type="button"
                    onClick={() => openQuranSymbolModal({ type: 'juz', juzNumber: juzNumber })}
                    className="hover:text-amber-900 dark:hover:text-amber-300 hover:underline transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    title={`شرح وتفاصيل الجزء ${juzNumber} - اضغط لمعرفة التفاصيل`}
                >
                    <span>📖</span>
                    <span>الجزء {juzNumber.toLocaleString('ar-EG')}</span>
                </button>
                <span>{showSurahName ? `سورة ${surahName}` : ''}</span>
            </>
        )}
      </header>

      {/* Main 15 Lines */}
      <main className="flex flex-col justify-between w-full h-full" style={{ minHeight: '60vh', padding: hideMushafFrames ? '0 0.15rem' : '0 0.5rem' }}>
        {(() => {
          const assignedAyahIds = new Set<string>();

          return lineNumbers.map((lineNum, index) => {
            const lineItems = linesMap[lineNum];
            
            if (!lineItems || lineItems.length === 0) {
               const missingInfo = getMissingLineInfo(lineNum);
               if (missingInfo) {
                   if (missingInfo.type === 'chapter_header') {
                       const sName = QURAN_INDEX.find(s => s.number === missingInfo.surahNumber)?.name || '';
                       return (
                           <div key={`missing-${lineNum}`} className="w-full text-center py-1 sm:py-2 my-1 sm:my-2 border-y-2 border-amber-600/30 bg-amber-50/50 dark:bg-slate-800/50">
                               <h2 className="font-quran-title text-xl sm:text-2xl text-amber-800 dark:text-amber-400 font-bold">{sName}</h2>
                           </div>
                       );
                   }
                   if (missingInfo.type === 'bismillah') {
                       return (
                           <div key={`missing-${lineNum}`} className="w-full text-center py-1 sm:py-2 font-bismillah text-xl sm:text-2xl text-amber-800 dark:text-amber-400">
                               بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                           </div>
                       );
                   }
               }
               return <div key={lineNum} className="w-full h-8 sm:h-12 flex-1"></div>;
            }

            // Check if this line is a Surah Header
            const isSurahHeader = lineItems.some(i => i.word.char_type_name === 'chapter_header' || i.word.char_type_name === 'bismillah');
            
            if (isSurahHeader) {
               const type = lineItems[0].word.char_type_name;
               if (type === 'chapter_header') {
                  const sNum = parseInt(lineItems[0].verse.verse_key.split(':')[0], 10);
                  const sName = QURAN_INDEX.find(s => s.number === sNum)?.name || '';
                  return (
                      <div key={lineNum} className="w-full text-center py-1 sm:py-2 my-1 sm:my-2 border-y-2 border-amber-600/30 bg-amber-50/50 dark:bg-slate-800/50">
                          <h2 className="font-quran-title text-xl sm:text-2xl text-amber-800 dark:text-amber-400 font-bold">{sName}</h2>
                      </div>
                  );
               }
               if (type === 'bismillah') {
                  return (
                      <div key={lineNum} className="w-full text-center py-1 sm:py-2 font-bismillah text-xl sm:text-2xl text-amber-800 dark:text-amber-400">
                          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                      </div>
                  );
               }
            }

            // If line has very few words, center it to avoid stretching
            const shouldCenter = lineItems.length < 5;

            // Group pause marks with previous word
            const groupedItems: any[] = [];
            lineItems.forEach((item) => {
               if (item.word.char_type_name === 'pause_mark') {
                  if (groupedItems.length > 0) {
                     if (!groupedItems[groupedItems.length - 1].pauseMarks) {
                        groupedItems[groupedItems.length - 1].pauseMarks = [];
                     }
                     groupedItems[groupedItems.length - 1].pauseMarks.push(item.word);
                  } else {
                     groupedItems.push(item);
                  }
               } else {
                  groupedItems.push(item);
               }
            });

            const useMadinahGlyphFont = fontStyle === 'mushaf' && isFontReady;
            const lineFontClass = useMadinahGlyphFont ? '' : 'uthmani-font';

            return (
              <div 
                key={lineNum} 
                className={`w-full flex items-center ${shouldCenter ? 'justify-center gap-2' : 'justify-between'} ${lineFontClass} leading-relaxed sm:leading-loose text-text-primary`}
                style={
                  useMadinahGlyphFont 
                    ? { padding: '0', fontSize: 'clamp(1.25rem, 5.2vw, 2.4rem)', justifyContent: shouldCenter ? 'center' : 'space-between' } 
                    : { padding: '0.1rem 0', fontSize: 'clamp(0.85rem, 3.8vw, 1.75rem)' }
                }
              >
                {groupedItems.map(({ word, verse, pauseMarks }, idx) => {
                  const isEnd = word.char_type_name === 'end';
                  const sNum = parseInt(verse.verse_key.split(':')[0], 10);
                  const ayahNum = verse.verse_number;
                  const ayahKey = `${sNum}:${ayahNum}`;

                  let ayahElementId: string | undefined = undefined;
                  if (!assignedAyahIds.has(ayahKey)) {
                      assignedAyahIds.add(ayahKey);
                      ayahElementId = `ayah-${sNum}-${ayahNum}`;
                  }

                  const isTargetSurah = !targetSurahNumber || targetSurahNumber === sNum;
                  const isHighlighted = isTargetSurah && activeHighlightAyah !== null && activeHighlightAyah !== undefined && ayahNum === activeHighlightAyah;
                  const isPlaying = currentlyPlayingAyahGlobalNumber !== null && verse.id === currentlyPlayingAyahGlobalNumber;
                  const isSelected = selectedAyahKeys?.includes(verse.verse_key);

                  let highlightClass = '';
                  if (isPlaying) {
                      highlightClass = 'bg-yellow-300/70 dark:bg-yellow-400/40 text-yellow-950 dark:text-yellow-100 ring-2 ring-yellow-500 rounded px-0.5';
                  } else if (isHighlighted) {
                      highlightClass = 'bg-amber-300/50 dark:bg-amber-400/35 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/70 rounded px-0.5 animate-highlight-pulse transition-all duration-700';
                  } else if (isSelected) {
                      highlightClass = 'bg-primary/20 dark:bg-primary/40 rounded px-0.5';
                  }
                  
                  let displayText = word.text_uthmani;
                  let wordFontClass = '';
                  const isHaMeemWord = highlightHaMeem && hasHaMeem(word.text_uthmani);
                  const isPureNooraniGlyphWord = useMadinahGlyphFont && highlightNoorani && isWordPureNoorani(word.text_uthmani, highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta);
                  const isLiveSearchWord = liveSearchQuery.length > 0 && word.text_uthmani && 
                      normalizeArabicText(word.text_uthmani).includes(normalizeArabicText(liveSearchQuery));

                  if (useMadinahGlyphFont && word.code_v1) {
                      displayText = word.code_v1;
                      wordFontClass = `font-p${word.v1_page || pageNumber}`;
                  }

                  return (
                    <span 
                      key={word.id || idx}
                      id={ayahElementId}
                      className={`hover:text-amber-600 transition-all cursor-pointer shrink-0 inline-flex items-baseline ${highlightClass} ${wordFontClass} ${
                        isLiveSearchWord 
                          ? 'bg-amber-400/60 dark:bg-amber-400/45 text-amber-950 dark:text-amber-50 ring-2 ring-amber-500 rounded px-1 font-bold scale-105 shadow-xs z-10'
                          : isPureNooraniGlyphWord 
                            ? 'noorani-letter-highlight' 
                            : (isHaMeemWord ? 'text-amber-600 dark:text-amber-400 font-bold' : '')
                      }`}
                      onClick={(e) => {
                          if (isSelectionMode || e.ctrlKey || e.metaKey) {
                              const fullText = verse.words.filter((w:any) => w.char_type_name === 'word').map((w:any) => w.text_uthmani).join(' ');
                              if (onAyahClick) onAyahClick(e, sNum, verse.verse_number, fullText);
                              return;
                          }
                          if (isEnd && onAyahActionClick) {
                              onAyahActionClick(e, sNum, verse.verse_number);
                              return;
                          }
                          if (onWordClick && word.char_type_name === 'word') {
                              onWordClick(word.text_uthmani, sNum, verse.verse_number, word.position);
                          }
                      }}
                    >
                      {isEnd ? (
                          useMadinahGlyphFont ? (
                              <span className={wordFontClass}>{word.code_v1 || word.text_uthmani}</span>
                          ) : (
                              <span className="mx-1 text-amber-600 text-[1.1em]">{`\u06DD${word.text_uthmani || verse.verse_number.toLocaleString('ar-EG')}`}</span>
                          )
                      ) : (
                          useMadinahGlyphFont 
                            ? displayText 
                            : (highlightNoorani 
                                ? renderWordWithNoorani(displayText, true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta) 
                                : renderWordWithHaMeem(displayText, highlightHaMeem))
                      )}
                      {pauseMarks && pauseMarks.map((pm: any, pmidx: number) => {
                          const pmText = useMadinahGlyphFont && pm.code_v1 ? pm.code_v1 : pm.text_uthmani;
                          const pmClass = useMadinahGlyphFont && pm.code_v1 ? `font-p${pm.v1_page || pageNumber}` : '';
                          return (
                              <span key={pmidx} className={`text-amber-700/80 mx-0.5 ${pmClass}`} style={useMadinahGlyphFont ? {} : { fontSize: '0.85em', transform: 'translateY(-0.15em)' }}>{pmText}</span>
                          );
                      })}
                    </span>
                  );
                })}
              </div>
            );
          });
        })()}
      </main>

      {/* Footer */}
      <footer className="mushaf-footer flex items-center justify-between mt-4 sm:mt-6 pt-2 border-t border-amber-200/50">
         <button 
           onClick={() => pageNumber > 1 && onPageChange(pageNumber - 1)}
           disabled={pageNumber <= 1}
           className="px-3 py-1 bg-amber-100 dark:bg-slate-800 rounded disabled:opacity-50 cursor-pointer"
         >
           السابق
         </button>
         <button 
           type="button"
           onClick={() => setIsCopyPageModalOpen(true)}
           className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 transition-all cursor-pointer shadow-xs hover:shadow hover:scale-105"
           title="انقر لنسخ الصفحة الحالية كنص مع خيارات التشكيل والتوثيق"
           aria-label={`نسخ الصفحة ${pageNumber} كنص`}
         >
           <CopyIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
           <span className="font-bold font-mono text-lg">{pageNumber}</span>
         </button>
         <button 
           onClick={() => pageNumber < totalPages && onPageChange(pageNumber + 1)}
           disabled={pageNumber >= totalPages}
           className="px-3 py-1 bg-amber-100 dark:bg-slate-800 rounded disabled:opacity-50 cursor-pointer"
         >
           التالي
         </button>
      </footer>

      {/* Copy Page Modal */}
      {isCopyPageModalOpen && (
        <CopyPageModal
          isOpen={isCopyPageModalOpen}
          onClose={() => setIsCopyPageModalOpen(false)}
          pageNumber={pageNumber}
          juzNumber={verses[0]?.juz_number}
          ayahs={pageAyahsForCopy}
        />
      )}
    </div>
  );
};
