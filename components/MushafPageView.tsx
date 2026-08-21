import React, { useState, useEffect } from 'react';
import { fetchPageVersesV4, QuranV4Verse } from '../services/quranApiV4';
import { QURAN_INDEX } from '../quranIndex';
import { useSettingsContext } from '../contexts/SettingsContext';
import { injectMushafFontFaces, checkMushafFontsDownloaded } from '../utils/mushafFonts';

interface MushafPageViewProps {
  pageNumber: number;
  onPageChange: (newPage: number) => void;
  onWordClick?: (wordText: string, surahNum: number, ayahNum: number, wordIndex: number) => void;
  isSelectionMode?: boolean;
  selectedAyahKeys?: string[];
  onAyahClick?: (e: React.MouseEvent, surahNum: number, ayahNum: number, text: string) => void;
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
  highlightAyahNumber,
  targetSurahNumber,
  currentlyPlayingAyahGlobalNumber
}) => {
  const [verses, setVerses] = useState<QuranV4Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const { fontStyle, fontSize } = useSettingsContext();
  const [isFontReady, setIsFontReady] = useState(false);

  useEffect(() => {
    if (fontStyle === 'mushaf') {
        checkMushafFontsDownloaded().then(downloaded => {
            if (downloaded) {
                injectMushafFontFaces();
                setIsFontReady(true);
            } else {
                setIsFontReady(false);
            }
        });
    } else {
        setIsFontReady(false);
    }
  }, [fontStyle]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchPageVersesV4(pageNumber).then(data => {
      if (isMounted) {
        setVerses(data);
        setLoading(false);
      }
    });
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
    if (surahInfo) surahName = surahInfo.name.replace(/^سُورَةُ\s*/, '').trim();
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

  return (
    <div className="mushaf-page mx-auto w-full max-w-2xl shadow-2xl relative select-text" dir="rtl">
      {/* Header */}
      <header className="mushaf-header flex justify-between px-4 font-bold text-amber-700/80 dark:text-amber-500/80 text-xs sm:text-sm border-b border-amber-200/50 pb-2 mb-2 sm:mb-4">
        {isOddPage ? (
            <>
                <span>{showSurahName ? `سورة ${surahName}` : ''}</span>
                <span>الجزء {juzNumber.toLocaleString('ar-EG')}</span>
            </>
        ) : (
            <>
                <span>الجزء {juzNumber.toLocaleString('ar-EG')}</span>
                <span>{showSurahName ? `سورة ${surahName}` : ''}</span>
            </>
        )}
      </header>

      {/* Main 15 Lines */}
      <main className="flex flex-col justify-between w-full h-full" style={{ minHeight: '60vh', padding: '0 0.5rem' }}>
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

            // Check if this line is a Surah Header (some APIs might return it)
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

            // If this is the last line of a surah, we might want to center it instead of justify-between
            const isLastLineOfSurah = index === lineNumbers.length - 1 && lineItems[lineItems.length - 1].word.char_type_name === 'end';
            // Also, if the line has very few words, justify-center is better to prevent ugly stretching
            const shouldCenter = lineItems.length < 5;

            // Group pause marks with the previous word so justify-between doesn't separate them
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

            const useMushafFont = fontStyle === 'mushaf' && isFontReady;

            return (
              <div 
                key={lineNum} 
                className={`w-full flex items-center ${shouldCenter ? 'justify-center gap-2' : 'justify-between'} ${useMushafFont ? '' : 'uthmani-font'} leading-relaxed sm:leading-loose text-text-primary overflow-visible`}
                style={useMushafFont ? { padding: '0', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', justifyContent: shouldCenter ? 'center' : 'space-between' } : { padding: '0.1rem 0', fontSize: 'clamp(0.9rem, 4.2vw, 1.8rem)' }}
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
                  const isHighlighted = isTargetSurah && highlightAyahNumber !== null && highlightAyahNumber !== undefined && ayahNum === highlightAyahNumber;
                  const isPlaying = currentlyPlayingAyahGlobalNumber !== null && verse.id === currentlyPlayingAyahGlobalNumber;
                  const isSelected = selectedAyahKeys?.includes(verse.verse_key);

                  let highlightClass = '';
                  if (isPlaying) {
                      highlightClass = 'bg-yellow-300/70 dark:bg-yellow-400/40 text-yellow-950 dark:text-yellow-100 ring-2 ring-yellow-500 rounded px-0.5';
                  } else if (isHighlighted) {
                      highlightClass = 'bg-amber-300/50 dark:bg-amber-400/35 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/70 rounded px-0.5 animate-highlight-pulse';
                  } else if (isSelected) {
                      highlightClass = 'bg-primary/20 dark:bg-primary/40 rounded px-0.5';
                  }
                  
                  const displayText = useMushafFont && word.code_v1 ? word.code_v1 : word.text_uthmani;
                  const fontClass = useMushafFont && word.code_v1 ? `font-p${word.v1_page || pageNumber}` : '';

                  return (
                    <span 
                      key={word.id || idx}
                      id={ayahElementId}
                      className={`hover:text-amber-600 transition-all cursor-pointer shrink-0 inline-flex items-baseline ${highlightClass} ${fontClass}`}
                      onClick={(e) => {
                          if (isSelectionMode || e.ctrlKey || e.metaKey) {
                              const fullText = verse.words.filter((w:any) => w.char_type_name === 'word').map((w:any) => w.text_uthmani).join(' ');
                              if (onAyahClick) onAyahClick(e, sNum, verse.verse_number, fullText);
                              return;
                          }
                          if (onWordClick && word.char_type_name === 'word') {
                              onWordClick(word.text_uthmani, sNum, verse.verse_number, word.position);
                          }
                      }}
                    >
                      {isEnd ? (
                          useMushafFont ? (
                              <span className={fontClass}>{word.code_v1 || word.text_uthmani}</span>
                          ) : (
                              <span className="mx-1 text-amber-600 text-[1.1em]">{`\u06DD${word.text_uthmani || verse.verse_number.toLocaleString('ar-EG')}`}</span>
                          )
                      ) : (
                          displayText
                      )}
                      {pauseMarks && pauseMarks.map((pm: any, pmidx: number) => {
                          const pmText = useMushafFont && pm.code_v1 ? pm.code_v1 : pm.text_uthmani;
                          const pmClass = useMushafFont && pm.code_v1 ? `font-p${pm.v1_page || pageNumber}` : '';
                          return (
                              <span key={pmidx} className={`text-amber-700/80 mx-0.5 ${pmClass}`} style={useMushafFont ? {} : { fontSize: '0.8em', transform: 'translateY(-0.2em)' }}>{pmText}</span>
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
           className="px-3 py-1 bg-amber-100 dark:bg-slate-800 rounded disabled:opacity-50"
         >
           السابق
         </button>
         <span className="font-bold font-mono text-lg text-amber-800 dark:text-amber-500">{pageNumber}</span>
         <button 
           onClick={() => pageNumber < 604 && onPageChange(pageNumber + 1)}
           disabled={pageNumber >= 604}
           className="px-3 py-1 bg-amber-100 dark:bg-slate-800 rounded disabled:opacity-50"
         >
           التالي
         </button>
      </footer>
    </div>
  );
};
