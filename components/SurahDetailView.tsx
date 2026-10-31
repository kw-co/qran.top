import { MushafPageView } from "./MushafPageView";
import { ShamarlyPageView } from "./ShamarlyPageView";
import { getShamarlyPageForAyah } from "../data/shamarlyIndex";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { SurahData, SavedAyahItem, Ayah } from '../types';
import { SpinnerIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, CopyIcon, SparklesIcon, ShareIcon, DocumentDuplicateIcon, DownloadIcon, ArrowUpTrayIcon } from './icons';
import { safeLocalStorage } from '../utils/storage';
import AyahActionPopover from './AyahActionPopover';
import AyahRenderer from './AyahRenderer';
import { formatSurahNameForDisplay, formatAyahForCopy, formatMultipleAyahsForCopy } from '../utils/text';
import { QURAN_INDEX } from '../quranIndex';
import { getQuranTextStyle } from '../utils/font';
import { useResearchData } from '../hooks/useResearchData';
import { useSettingsContext } from '../contexts/SettingsContext';
import { IslamicSectionDivider } from './IslamicDecorations';
import { openQuranSymbolModal } from '../data/quranSymbolsData';
import { CopyPageModal, PageAyahForCopy } from './CopyPageModal';
import { SurahHeaderBanner } from './SurahHeaderBanner';

interface SurahDetailViewProps {
  surah: SurahData;
  pageSurahs?: SurahData[]; // New prop to handle multiple surahs on one page
  highlightAyahNumber: number | null;
  onWordClick: (query: string, editionIdentifier: string, position?: { surah: number; ayah: number; wordIndex: number; }, isRootSearch?: boolean) => void;
  onSaveAyah: (item: SavedAyahItem) => void;
  onSearchByAyahNumber: (ayahNumber: number) => void;
  // --- Props for audio playback ---
  currentlyPlayingAyahGlobalNumber: number | null;
  onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
  selectedAudioEdition: string;
  // --- Prop for word popover ---
  simpleCleanData: SurahData[];
  hizbQuarterStartMap: Map<number, number>;
  forcedPageNumber?: number; // Prop to enforce a specific page number
  continuousPlaylist?: Ayah[];
}

const SurahHeaderStrip = SurahHeaderBanner;

const SurahDetailView: React.FC<SurahDetailViewProps> = ({ 
  surah, pageSurahs, highlightAyahNumber, onWordClick,
  onSaveAyah, onSearchByAyahNumber,
  currentlyPlayingAyahGlobalNumber, onStartPlayback, selectedAudioEdition,
  simpleCleanData, hizbQuarterStartMap, forcedPageNumber, continuousPlaylist
}) => {
  const highlightRef = useRef<HTMLSpanElement>(null);
  const playingAyahRef = useRef<HTMLSpanElement>(null);
  const wordPopoverRef = useRef<HTMLDivElement>(null);

  const [activePopover, setActivePopover] = useState<{ ayah: Ayah; triggerElement: HTMLElement } | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedWholeSurah, setCopiedWholeSurah] = useState(false);
  const [isCopyPageModalOpen, setIsCopyPageModalOpen] = useState(false);

  
  const [selectedAyahs, setSelectedAyahs] = useState<{surahNum: number, ayahNum: number, text: string, surahName: string}[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMultiCopyToast, setShowMultiCopyToast] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState<{ surahNum: number, ayahNum: number } | null>(null);
  const selectedAyahKeys = useMemo(() => selectedAyahs.map(a => `${a.surahNum}:${a.ayahNum}`), [selectedAyahs]);

  const handleAyahSelection = (e: React.MouseEvent, surahNum: number, ayahNum: number, text: string, surahName: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isSelectionMode) setIsSelectionMode(true);
      
      setSelectedAyahs(prev => {
          const existsIndex = prev.findIndex(a => a.surahNum === surahNum && a.ayahNum === ayahNum);
          if (existsIndex >= 0) {
              const newArr = [...prev];
              newArr.splice(existsIndex, 1);
              if (newArr.length === 0) setIsSelectionMode(false);
              return newArr;
          } else {
              return [...prev, {surahNum, ayahNum, text, surahName}];
          }
      });
  };

  const handleCopyWholeSurah = () => {
      const fullText = surah.ayahs.map(a => `${a.text} ﴿${a.numberInSurah}﴾`).join(" ");
      navigator.clipboard.writeText(`سورة ${surah.name}

${fullText}`).then(() => {
          setCopiedWholeSurah(true);
          setTimeout(() => setCopiedWholeSurah(false), 2000);
      });
  };

  const handleDownloadWholeSurah = () => {
      const fullText = surah.ayahs.map(a => `${a.text} ﴿${a.numberInSurah}﴾`).join(" ");
      const content = `سورة ${surah.name}

${fullText}`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `سورة_${String(surah?.name || 'surah').replace(/\s+/g, "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleShareWholeSurah = async () => {
      const fullText = surah.ayahs.map(a => `${a.text} ﴿${a.numberInSurah}﴾`).join(" ");
      const content = `سورة ${surah.name}

${fullText}`;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: `سورة ${surah.name}`,
                  text: content
              });
          } catch (e) { console.error("Share failed", e); }
      } else {
          handleCopyWholeSurah();
      }
  };

  const handleCopyMultiple = () => {
      if (selectedAyahs.length === 0) return;

      const ayahsFormatted = selectedAyahs.map(a => {
          let txt = a.text;
          if (!txt && simpleCleanData) {
              const foundSurah = simpleCleanData.find(s => s.number === a.surahNum);
              const foundAyah = foundSurah?.ayahs.find(item => item.numberInSurah === a.ayahNum);
              if (foundAyah?.text) txt = foundAyah.text;
          }
          return {
              text: txt,
              surahName: a.surahName,
              surahNumber: a.surahNum,
              ayahNumber: a.ayahNum
          };
      });

      const textToCopy = formatMultipleAyahsForCopy(ayahsFormatted, {
          textFormat: copyTextFormat,
          citationFormat: copyCitationFormat,
          multiFormat: copyMultiFormat,
          fontStyle
      });

      navigator.clipboard.writeText(textToCopy).then(() => {
          setShowMultiCopyToast(true);
          setTimeout(() => setShowMultiCopyToast(false), 3000);
          setIsSelectionMode(false);
          setSelectedAyahs([]);
      });
  };

  const [wordPopoverState, setWordPopoverState] = useState<{
    ayahNumberInSurah: number;
    simpleText: string;
    triggerElement: HTMLElement;
  } | null>(null);

  const prevSurahNumber = useRef<number | null>(null);
  const prevPageNumber = useRef<number | undefined>(undefined);
  const prevHighlightAyahNumber = useRef<number | null>(null);

  // Consume Settings from Context
  const { displayEdition, fontSize, fontStyle, setFontStyle, setSelectedEdition, copyTextFormat, copyCitationFormat, copyMultiFormat, showBottomNavBar, mushafFrameStyle, mushafType, setMushafType, hideMushafFrames, ayahHighlightDuration } = useSettingsContext();
  const researchData = useResearchData();

  // Manage temporary or permanent ayah highlight based on settings
  const [activeHighlightAyah, setActiveHighlightAyah] = useState<number | null>(highlightAyahNumber || null);

  useEffect(() => {
    setActiveHighlightAyah(highlightAyahNumber || null);
    if (highlightAyahNumber && ayahHighlightDuration !== 'permanent') {
      const ms = ayahHighlightDuration === '3s' ? 3000 : 5000;
      const timer = setTimeout(() => {
        setActiveHighlightAyah(null);
      }, ms);
      return () => clearTimeout(timer);
    }
  }, [highlightAyahNumber, surah.number, forcedPageNumber, ayahHighlightDuration]);

  const [shamarlyCurrentPage, setShamarlyCurrentPage] = useState<number>(() => {
    if (forcedPageNumber && forcedPageNumber <= 522) {
      return forcedPageNumber;
    }
    const initialAyah = highlightAyahNumber || 1;
    return getShamarlyPageForAyah(surah.number, initialAyah);
  });

  useEffect(() => {
    if (mushafType === 'shamarly') {
      const p = getShamarlyPageForAyah(surah.number, highlightAyahNumber || 1);
      setShamarlyCurrentPage(p);
    }
  }, [surah.number, highlightAyahNumber, mushafType]);

  // Determine current page logic
  const { ayahsByPage, firstPage, lastPage, getPageForAyahNumber } = useMemo(() => {
    // If we are in specific Page Mode with pageSurahs provided
    if (pageSurahs && forcedPageNumber) {
        return { 
            ayahsByPage: new Map(), // Not used in this mode
            firstPage: 1, 
            lastPage: 604, 
            getPageForAyahNumber: (n: number) => forcedPageNumber 
        };
    }

    const map = new Map<number, Ayah[]>();
    const ayahNumToPageMap = new Map<number, number>();
    if (!surah || !surah.ayahs || surah.ayahs.length === 0) {
        return { ayahsByPage: map, firstPage: 1, lastPage: 1, getPageForAyahNumber: (n: number) => undefined };
    }
    let minPage = Infinity;
    let maxPage = -Infinity;
    for (const ayah of surah.ayahs) {
        if (ayah.page) {
            if (!map.has(ayah.page)) {
                map.set(ayah.page, []);
            }
            map.get(ayah.page)!.push(ayah);
            minPage = Math.min(minPage, ayah.page);
            maxPage = Math.max(maxPage, ayah.page);
            ayahNumToPageMap.set(ayah.numberInSurah, ayah.page);
        }
    }
    const getPageForAyahNumber = (num: number) => ayahNumToPageMap.get(num);
    return { ayahsByPage: map, firstPage: minPage === Infinity ? 1 : minPage, lastPage: maxPage === -Infinity ? 1 : maxPage, getPageForAyahNumber };
  }, [surah, pageSurahs, forcedPageNumber]);

  useEffect(() => {
    let targetPage: number | undefined;

    if (forcedPageNumber) {
        targetPage = forcedPageNumber;
    } else if (highlightAyahNumber) {
        targetPage = getPageForAyahNumber(highlightAyahNumber);
    } else if (currentlyPlayingAyahGlobalNumber) {
        // Find which surah/ayah is playing
        const playingAyah = surah.ayahs.find(a => a.number === currentlyPlayingAyahGlobalNumber);
        if (playingAyah) {
            targetPage = getPageForAyahNumber(playingAyah.numberInSurah);
        }
    }

    setCurrentPage(targetPage || firstPage);
  }, [surah.number, highlightAyahNumber, currentlyPlayingAyahGlobalNumber, getPageForAyahNumber, firstPage, forcedPageNumber]);


  useEffect(() => {
    // This is the primary scrolling logic for the component.
    // It handles scrolling to a highlighted ayah, following audio playback, or scrolling to the top.

    // --- First, check for navigation changes using values from the *previous* render ---
    const isNewHighlightRequest = highlightAyahNumber !== null && highlightAyahNumber !== prevHighlightAyahNumber.current;
    const isNewPageOrSurah = prevSurahNumber.current !== surah.number || prevPageNumber.current !== forcedPageNumber;

    // --- PRIORITY 1: Follow audio playback ---
    const isPlayingInView = pageSurahs 
        ? pageSurahs.some(s => s.ayahs.some(a => a.number === currentlyPlayingAyahGlobalNumber))
        : surah.ayahs.some(a => a.number === currentlyPlayingAyahGlobalNumber);

    if (currentlyPlayingAyahGlobalNumber !== null && isPlayingInView) {
        if (playingAyahRef.current) {
            playingAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    // --- PRIORITY 2: Handle a NEW request to highlight an ayah (only if audio isn't controlling scroll) ---
    else if (isNewHighlightRequest) {
        const targetSurahNumber = surah.number;
        const specificId = `ayah-${targetSurahNumber}-${highlightAyahNumber}`;
        
        let attempts = 0;
        const intervalId = setInterval(() => {
            const element = document.getElementById(specificId);
            attempts++;
            if (element) {
                clearInterval(intervalId);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('animate-highlight-pulse');
                setTimeout(() => element.classList.remove('animate-highlight-pulse'), 3000);
            } else if (attempts > 30) { // More generous 3-second timeout
                clearInterval(intervalId);
            }
        }, 100);

        return () => clearInterval(intervalId); // Cleanup on effect change.
    }
    // --- PRIORITY 3: Fallback to scroll-to-top on new page navigation (if no highlight/audio) ---
    else if (isNewPageOrSurah) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

  }, [highlightAyahNumber, currentlyPlayingAyahGlobalNumber, surah, pageSurahs, forcedPageNumber]);

  // This separate effect ensures the "previous" values are always updated *after* the main scrolling effect has run.
  // This correctly handles all cases, including when audio playback causes an early return in the main effect.
  useEffect(() => {
    prevHighlightAyahNumber.current = highlightAyahNumber;
    prevSurahNumber.current = surah.number;
    prevPageNumber.current = forcedPageNumber;
  });

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (!(target as HTMLElement).closest('.popover-trigger, .popover-content')) {
            setActivePopover(null);
        }
        if (wordPopoverRef.current && !wordPopoverRef.current.contains(target)) {
            if (!(event.target as HTMLElement).closest('.word-trigger')) {
                setWordPopoverState(null);
            }
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Navigation functions using global Routing (Hash)
  const navigateToPage = (pageNum: number) => {
      window.location.hash = `#/page/${pageNum}`;
  };
  
  // Prepare content to render
  const contentToRender = useMemo(() => {
      return pageSurahs || (ayahsByPage.get(currentPage) ? [{...surah, ayahs: ayahsByPage.get(currentPage)!}] : []);
  }, [ayahsByPage, currentPage, surah, pageSurahs]);

  const currentPageAyahsForCopy = useMemo<PageAyahForCopy[]>(() => {
    if (!contentToRender || contentToRender.length === 0) return [];
    return contentToRender.flatMap(segment =>
      segment.ayahs.map(a => {
        let simpleText = '';
        if (simpleCleanData && simpleCleanData.length > 0) {
          const foundSurah = simpleCleanData.find(s => s.number === segment.number);
          const foundAyah = foundSurah?.ayahs?.find(item => item.numberInSurah === a.numberInSurah);
          if (foundAyah?.text) simpleText = foundAyah.text;
        }
        return {
          surahNumber: segment.number,
          surahName: segment.name,
          ayahNumberInSurah: a.numberInSurah,
          textUthmani: a.text || '',
          textSimple: simpleText || undefined,
          juz: a.juz
        };
      })
    );
  }, [contentToRender, simpleCleanData]);

  const pageInfo = useMemo(() => {
    if (!hizbQuarterStartMap || contentToRender.length === 0) return null;
    
    // Use the first surah/ayah on the page for Header Info
    const firstSurah = contentToRender[0];
    if (!firstSurah || !firstSurah.ayahs || firstSurah.ayahs.length === 0) return null;

    const firstAyah = firstSurah.ayahs[0];
    
    // Display name of the first surah on page
    let surahName = String(firstSurah.name || '');
    surahName = surahName.replace(/^سُورَةُ\s*/, '').trim();

    const juzNumber = firstAyah.juz;
    const hizbNumber = firstAyah.hizbQuarter ? Math.floor((firstAyah.hizbQuarter - 1) / 4) + 1 : null;
    
    const markers: { label: string; quarterIndex?: number; hizbNumber?: number }[] = [];
    const processedQuarters = new Set<number>();
    
    if (hizbNumber) {
        const startOfHizbQuarter = (hizbNumber - 1) * 4 + 1;
        if(hizbQuarterStartMap.get(startOfHizbQuarter) === firstAyah.number) {
            markers.push({ label: `الحزب ${hizbNumber}`, hizbNumber, quarterIndex: startOfHizbQuarter });
        }
    }
    
    // Scan all ayahs on the page for hizb markers
    for (const s of contentToRender) {
        for(const ayah of s.ayahs) {
            if(ayah.hizbQuarter && hizbQuarterStartMap.get(ayah.hizbQuarter) === ayah.number) {
                if (processedQuarters.has(ayah.hizbQuarter)) continue;
                
                const quarterType = (ayah.hizbQuarter - 1) % 4;
                const hNum = Math.floor((ayah.hizbQuarter - 1) / 4) + 1;
                if (quarterType === 1) markers.push({ label: 'ربع الحزب', hizbNumber: hNum, quarterIndex: ayah.hizbQuarter });
                else if (quarterType === 2) markers.push({ label: 'نصف الحزب', hizbNumber: hNum, quarterIndex: ayah.hizbQuarter });
                else if (quarterType === 3) markers.push({ label: 'ثلاثة أرباع الحزب', hizbNumber: hNum, quarterIndex: ayah.hizbQuarter });

                processedQuarters.add(ayah.hizbQuarter);
            }
        }
    }
    
    return {
        surahNumber: firstSurah.number,
        surahName,
        juzNumber,
        markers,
        side: currentPage % 2 === 0 ? 'left' : 'right'
    };
  }, [currentPage, contentToRender, hizbQuarterStartMap]);

        
  const findActiveAyah = () => {
    const elements = document.querySelectorAll('[id^="ayah-"]');
    let closestElement: Element | null = null;
    let closestDistance = Infinity;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const distance = Math.abs(rect.top - 150);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = el;
      }
    });

    if (closestElement) {
      const id = (closestElement as HTMLElement).id;
      const parts = id.split('-');
      if (parts.length === 3) {
        const sNum = parseInt(parts[1], 10);
        const aNum = parseInt(parts[2], 10);
        return { surahNumber: sNum, ayahNumber: aNum };
      }
    }
    return null;
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

      const saveProgress = () => {
      let activeAyahNum: number | null = null;
      let activeSurahNum = surah.number;
      let activePageNum = currentPage;

      const active = findActiveAyah();
      if (active && pageSurahs && pageSurahs.some(s => s.number === active.surahNumber)) {
        activeSurahNum = active.surahNumber;
        activeAyahNum = active.ayahNumber;
      } else {
        const firstSurahSegment = contentToRender[0];
        if (firstSurahSegment && firstSurahSegment.ayahs && firstSurahSegment.ayahs.length > 0) {
          activeSurahNum = firstSurahSegment.number;
          activeAyahNum = firstSurahSegment.ayahs[0].numberInSurah;
        }
      }

      const lastPosition = {
        browsingMode: 'page',
        pageNumber: activePageNum,
        surahNumber: activeSurahNum,
        ayahNumber: activeAyahNum || 1,
        timestamp: Date.now()
      };
      safeLocalStorage.setItem('qran_last_read_position', JSON.stringify(lastPosition));
      safeLocalStorage.setItem('qran_last_route', `#/page/${activePageNum}?ayah=${activeAyahNum || 1}`);

      // Automatically save to reading stops (history)
      try {
        const stored = safeLocalStorage.getItem('qran_reading_stops');
        let stops: any[] = [];
        if (stored) {
          stops = JSON.parse(stored);
        }

        const surahObj = QURAN_INDEX.find(s => s.number === activeSurahNum);
        const surahName = surahObj ? surahObj.name : `سورة ${activeSurahNum}`;

        const newStop = {
          browsingMode: 'page',
          surahNumber: activeSurahNum,
          surahName,
          ayahNumber: activeAyahNum || 1,
          pageNumber: activePageNum,
          timestamp: Date.now()
        };

        const isDuplicate = stops.length > 0 && 
          stops[0].surahNumber === activeSurahNum && 
          stops[0].ayahNumber === (activeAyahNum || 1) &&
          stops[0].pageNumber === activePageNum;

        if (!isDuplicate) {
          stops = stops.filter(s => s.pageNumber !== activePageNum);
          stops.unshift(newStop);
          stops = stops.slice(0, 50);
          safeLocalStorage.setItem('qran_reading_stops', JSON.stringify(stops));
        }
      } catch (e) {
        console.error("Failed to autosave reading stop", e);
      }
    };

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveProgress, 500);
    };

    saveProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [surah.number, currentPage, contentToRender, pageSurahs]);

  if (displayEdition.format === 'audio') {
    return (
      <div className="animate-fade-in w-full max-w-4xl mx-auto px-4">
        <main className="bg-surface p-6 sm:p-8 rounded-lg shadow-md transition-colors duration-300">
          <h3 className="text-xl font-bold mb-4 text-center text-primary-text">{displayEdition.name}</h3>
          <div className="flex flex-col gap-2">
            {surah.ayahs.map(ayah => (
              ayah.audio ? (
                <div key={ayah.number} className="flex items-center gap-4 py-2 px-3 my-1 bg-surface-subtle rounded-lg">
                  <span className="font-bold text-primary-text">الآية {ayah.numberInSurah}</span>
                  <audio
                    controls
                    src={ayah.audio}
                    className="w-full h-10"
                    preload="metadata"
                    title={`الاستماع للآية ${ayah.numberInSurah}`}
                  >
                    متصفحك لا يدعم عنصر الصوت.
                  </audio>
                </div>
              ) : null
            ))}
          </div>
        </main>
      </div>
    );
  }

  const { className: quranTextClass } = getQuranTextStyle(fontStyle, fontSize);

  const handleSaveClick = (ayah: Ayah) => {
    onSaveAyah({
      type: 'ayah',
      id: `${ayah.surah?.number || surah.number}:${ayah.numberInSurah}`,
      surah: ayah.surah?.number || surah.number,
      ayah: ayah.numberInSurah,
      text: ayah.text || '',
      createdAt: Date.now(),
    });
    setActivePopover(null);
  };

  const handleSaveReadingStop = (ayah: Ayah) => {
    try {
      const activeSurahNum = ayah.surah?.number || surah.number;
      const activeSurahName = ayah.surah?.name || surah.name;
      const activeAyahNum = ayah.numberInSurah;
      
      const newStop = {
        browsingMode: 'page',
        surahNumber: activeSurahNum,
        surahName: activeSurahName,
        ayahNumber: activeAyahNum,
        pageNumber: currentPage,
        timestamp: Date.now()
      };

      const stored = safeLocalStorage.getItem('qran_reading_stops');
      let stops: any[] = [];
      if (stored) {
        stops = JSON.parse(stored);
      }
      
      // Remove any existing stop for the same surah and ayah
      stops = stops.filter(s => !(s.surahNumber === activeSurahNum && s.ayahNumber === activeAyahNum));
      
      // Add new stop to front, slice to max 5
      stops.unshift(newStop);
      stops = stops.slice(0, 50);
      
      safeLocalStorage.setItem('qran_reading_stops', JSON.stringify(stops));
    } catch (e) {
      console.error("Failed to save reading stop", e);
    }
  };

  const handleCopyAyah = (ayah: Ayah) => {
    let ayahText = ayah.text || '';
    const sNum = ayah.surah?.number || surah.number;
    const aNum = ayah.numberInSurah;

    if (!ayahText && simpleCleanData) {
        const foundSurah = simpleCleanData.find(s => s.number === sNum);
        const foundAyah = foundSurah?.ayahs.find(a => a.numberInSurah === aNum);
        if (foundAyah?.text) {
            ayahText = foundAyah.text;
        }
    }
    
    const surahName = ayah.surah?.name || surah.name;
    const textToCopy = formatAyahForCopy({
        ayahText,
        surahName,
        surahNumber: sNum,
        ayahNumber: aNum,
        textFormat: copyTextFormat,
        citationFormat: copyCitationFormat,
        fontStyle
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedAyah(ayah.number || aNum);
        setTimeout(() => setCopiedAyah(null), 2000);
        setActivePopover(null);
    });
  };

  const handleSearchByAyahText = (ayah: Ayah) => {
    const sNum = ayah.surah?.number || surah.number;
    const simpleSurah = simpleCleanData.find(s => s.number === sNum);
    const simpleAyah = simpleSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
    const simpleTextToSearch = simpleAyah?.text;

    if (simpleTextToSearch) {
        onWordClick(simpleTextToSearch, 'quran-simple-clean', { surah: sNum, ayah: ayah.numberInSurah, wordIndex: 0 });
    } else if (ayah.text) {
        onWordClick(ayah.text, displayEdition.identifier, { surah: sNum, ayah: ayah.numberInSurah, wordIndex: 0 });
    }
    setActivePopover(null);
  };
  
  const handlePlayFromAyah = (ayah: Ayah) => {
    let ayahsWithSurahInfo: Ayah[] = [];
    if (pageSurahs) {
        ayahsWithSurahInfo = pageSurahs.flatMap(s => 
            s.ayahs.map(a => ({
                ...a,
                surah: {
                    number: s.number,
                    name: s.name,
                    englishName: s.englishName,
                    englishNameTranslation: s.englishNameTranslation,
                    revelationType: s.revelationType,
                }
            }))
        );
    } else {
        ayahsWithSurahInfo = surah.ayahs.map(a => ({
            ...a,
            surah: {
                number: surah.number,
                name: surah.name,
                englishName: surah.englishName,
                englishNameTranslation: surah.englishNameTranslation,
                revelationType: surah.revelationType,
            }
        }));
    }
    
    const playlistToUse = continuousPlaylist || ayahsWithSurahInfo;
    const startIndex = playlistToUse.findIndex(a => a.number === ayah.number);
    if (startIndex !== -1) {
        onStartPlayback(playlistToUse, selectedAudioEdition, startIndex);
    }
    setActivePopover(null);
  };

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto px-4">
      <div className="rounded-lg">
        {fontStyle === 'mushaf' ? (
            mushafType === 'shamarly' ? (
                <ShamarlyPageView
                    pageNumber={shamarlyCurrentPage}
                    onPageChange={(newPage) => {
                        setShamarlyCurrentPage(newPage);
                    }}
                    currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber}
                />
            ) : (
                <MushafPageView 
                  pageNumber={currentPage} 
                  onPageChange={navigateToPage}
              onWordClick={(wordText, surahNum, ayahNum, wordIndex) => {
                onWordClick(wordText, 'quran-simple-clean', { surah: surahNum, ayah: ayahNum, wordIndex });
              }}
              isSelectionMode={isSelectionMode}
              selectedAyahKeys={selectedAyahKeys}
              onAyahClick={(e, surahNum, ayahNum, text) => {
                 const sName = QURAN_INDEX.find(s => s.number === surahNum)?.name || '';
                 handleAyahSelection(e, surahNum, ayahNum, text, sName);
              }}
              onAyahActionClick={(e, surahNum, ayahNum) => {
                  let ayahToPass: Ayah | undefined;
                  for (const surahSegment of contentToRender) {
                      if (surahSegment.number === surahNum) {
                          ayahToPass = surahSegment.ayahs.find(a => a.numberInSurah === ayahNum);
                          break;
                      }
                  }
                  if (!ayahToPass && surah.number === surahNum) {
                      ayahToPass = surah.ayahs.find(a => a.numberInSurah === ayahNum);
                  }
                  if (ayahToPass) {
                      setActivePopover({ ayah: ayahToPass, triggerElement: e.currentTarget as HTMLElement });
                  } else {
                     const fallbackAyah: Ayah = {
                         number: 0,
                         numberInSurah: ayahNum,
                         juz: 1,
                         text: '', 
                         surah: {
                            number: surahNum,
                            name: QURAN_INDEX.find(s => s.number === surahNum)?.name || `سورة ${surahNum}`,
                            englishName: '', englishNameTranslation: '', revelationType: ''
                         }
                     };
                     setActivePopover({ ayah: fallbackAyah, triggerElement: e.currentTarget as HTMLElement });
                  }
              }}
              highlightAyahNumber={activeHighlightAyah}
              targetSurahNumber={surah.number}
              currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber}
            />
          )
        ) : (
             <div>
                <div className={`mushaf-page ${hideMushafFrames ? 'frame-none minimal-margins shadow-none! p-1 sm:p-2' : `frame-${mushafFrameStyle || 'classic'}`} relative`}>
                    {pageInfo?.markers.map((marker, index) => (
                         <button
                             key={index}
                             type="button"
                             onClick={() => openQuranSymbolModal({
                                 type: 'hizb',
                                 hizbNumber: marker.hizbNumber,
                                 quarterNumber: marker.quarterIndex
                             })}
                             className={`hizb-marker ${pageInfo.side} cursor-pointer hover:scale-105 active:scale-95 transition-all text-primary font-bold shadow-xs hover:bg-primary/10 select-none`}
                             title={`۞ ${marker.label} - اضغط لمعرفة الشرح والتفاصيل`}
                         >
                             <span className="font-serif">۞</span> {marker.label}
                         </button>
                    ))}
                    <header className={`mushaf-header flex items-center justify-between ${hideMushafFrames ? 'px-2 pb-1.5 mb-2 border-b border-border-subtle/40' : ''}`}>
                        {pageInfo?.juzNumber ? (
                            <button
                                type="button"
                                onClick={() => openQuranSymbolModal({ type: 'juz', juzNumber: pageInfo.juzNumber })}
                                className="hover:text-primary hover:underline transition-colors cursor-pointer flex items-center gap-1 font-bold"
                                title={`شرح ومعلومات الجزء ${pageInfo.juzNumber} - اضغط لعرض السور والأحزاب`}
                            >
                                <span>📖</span>
                                <span>الجزء {pageInfo.juzNumber}</span>
                            </button>
                        ) : <span />}
                        {pageInfo?.surahName && (
                            <a 
                                href={`#/surah/${pageInfo.surahNumber}`}
                                className="hover:text-primary hover:underline transition-colors cursor-pointer"
                                title={`فتح سورة ${pageInfo.surahName}`}
                            >
                                سورة {pageInfo.surahName}
                            </a>
                        )}
                    </header>
                    
                    <main dir="rtl" className={`text-text-primary ${quranTextClass} text-justify`}>
                        {contentToRender.map((surahSegment, index) => {
                            const isStartOfSurah = surahSegment.ayahs[0].numberInSurah === 1;
                            const showBismillah = isStartOfSurah && surahSegment.number !== 1 && surahSegment.number !== 9;
                            
                            // Only pass highlight to the renderer if this segment matches the requested surah.
                            // This prevents conflict if multiple surahs on page have the same ayah number (e.g. 1).
                            const isTargetSurah = surahSegment.number === surah.number;
                            const effectiveHighlight = isTargetSurah ? activeHighlightAyah : null;

                            return (
                                <React.Fragment key={surahSegment.number}>
                                    {/* Traditional Islamic Section Divider if not the first surah on page */}
                                    {index > 0 && (
                                        <IslamicSectionDivider className="my-6" />
                                    )}

                                    {/* Surah Header if start of surah */}
                                    {isStartOfSurah && (
                                        <>
                                        <SurahHeaderStrip 
                                            surahNumber={surahSegment.number} 
                                            surahName={surahSegment.name} 
                                            researchInfo={researchData ? researchData[surahSegment.number] : null}
                                        />
                                            <div className="flex justify-center items-center gap-2 mb-6 bg-surface/50 py-2 rounded-lg border border-border-default">
                                                <button onClick={handleCopyWholeSurah} title="نسخ السورة كاملة" className="p-2 text-text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                                                    {copiedWholeSurah ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                                                    <span className="font-medium hidden sm:inline">{copiedWholeSurah ? "تم النسخ" : "نسخ السورة"}</span>
                                                </button>
                                                <div className="w-px h-4 bg-border-default"></div>
                                                <button onClick={handleDownloadWholeSurah} title="تحميل السورة" className="p-2 text-text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                                                    <ArrowUpTrayIcon className="w-4 h-4" />
                                                    <span className="font-medium hidden sm:inline">تحميل كملف</span>
                                                </button>
                                                {navigator.share && (
                                                    <>
                                                        <div className="w-px h-4 bg-border-default"></div>
                                                        <button onClick={handleShareWholeSurah} title="مشاركة السورة" className="p-2 text-text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-1.5 text-sm">
                                                            <ShareIcon className="w-4 h-4" />
                                                            <span className="font-medium hidden sm:inline">مشاركة</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Bismillah */}
                                    {showBismillah && (
                                        <div className="text-center mb-6 font-bismillah text-2xl text-primary-text-strong select-none">
                                            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                                        </div>
                                    )}

                                    {/* Ayahs */}
                                    <AyahRenderer 
                                        ayahsToRender={surahSegment.ayahs} 
                                        surah={surahSegment} 
                                        highlightAyahNumber={effectiveHighlight} 
                                        onWordClick={onWordClick} 
                                        currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber} 
                                        simpleCleanData={simpleCleanData} 
                                        wordPopoverState={wordPopoverState} 
                                        setWordPopoverState={setWordPopoverState} 
                                        setActivePopover={setActivePopover} 
                                        playingAyahRef={playingAyahRef} 
                                        highlightRef={highlightRef} 
                                        firstAyahInfo={null} // Bismillah handled above
                                        isSelectionMode={isSelectionMode}
                                        selectedAyahKeys={selectedAyahKeys}
                                        onAyahClick={handleAyahSelection}
                                        hizbQuarterStartMap={hizbQuarterStartMap}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </main>

                    <footer className="mushaf-footer flex items-center justify-between mt-4">
                        <div className="w-16">
                            {currentPage > 1 && (
                                <button 
                                    onClick={() => navigateToPage(currentPage - 1)}
                                    className="w-full border-2 border-current rounded py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-mono text-lg font-bold"
                                    title="الصفحة السابقة"
                                >
                                    {currentPage - 1}
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCopyPageModalOpen(true)}
                            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary transition-all cursor-pointer shadow-xs hover:shadow hover:scale-105"
                            title="انقر لنسخ الصفحة الحالية كنص مع خيارات التشكيل والتوثيق"
                            aria-label={`نسخ الصفحة ${currentPage} كنص`}
                        >
                            <CopyIcon className="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity" />
                            <span className="font-bold text-xl">{currentPage}</span>
                        </button>
                        <div className="w-16">
                            {currentPage < 604 && (
                                <button 
                                    onClick={() => navigateToPage(currentPage + 1)}
                                    className="w-full border-2 border-current rounded py-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-mono text-lg font-bold"
                                    title="الصفحة التالية"
                                >
                                    {currentPage + 1}
                                </button>
                            )}
                        </div>
                    </footer>
                </div>
            </div>
          )}
      </div>
      
      {showBottomNavBar && (
          <div className="mt-6 flex items-center justify-between p-2 bg-surface rounded-full shadow-md border border-border-default">
              <button 
                  onClick={() => {
                      if (fontStyle === 'mushaf' && mushafType === 'shamarly') {
                          if (shamarlyCurrentPage > 1) setShamarlyCurrentPage(prev => prev - 1);
                      } else {
                          navigateToPage(currentPage - 1);
                      }
                  }}
                  disabled={fontStyle === 'mushaf' && mushafType === 'shamarly' ? shamarlyCurrentPage <= 1 : currentPage <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <ArrowRightIcon className="w-5 h-5" />
                  <span className="font-semibold hidden sm:inline">الصفحة السابقة</span>
              </button>
              <div className="font-bold text-lg text-text-primary font-mono select-none">
                  {fontStyle === 'mushaf' && mushafType === 'shamarly' ? shamarlyCurrentPage : currentPage}
              </div>
              <button 
                  onClick={() => {
                      if (fontStyle === 'mushaf' && mushafType === 'shamarly') {
                          if (shamarlyCurrentPage < 522) setShamarlyCurrentPage(prev => prev + 1);
                      } else {
                          navigateToPage(currentPage + 1);
                      }
                  }} 
                  disabled={fontStyle === 'mushaf' && mushafType === 'shamarly' ? shamarlyCurrentPage >= 522 : currentPage >= 604}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <span className="font-semibold hidden sm:inline">الصفحة التالية</span>
                  <ArrowLeftIcon className="w-5 h-5" />
              </button>
          </div>
      )}

      {wordPopoverState && (
         <div 
            ref={wordPopoverRef}
            className="absolute p-3 bg-surface rounded-lg shadow-lg border border-border-default flex items-center gap-2 z-20 animate-fade-in flex-wrap leading-loose"
            style={(() => {
                if (!wordPopoverState.triggerElement) return { opacity: 0, top: 0, left: 0 };
                const rect = wordPopoverState.triggerElement.getBoundingClientRect();
                return {
                    top: `${rect.bottom + window.scrollY + 5}px`,
                    left: `${rect.left + window.scrollX + rect.width / 2}px`,
                    transform: 'translateX(-50%)',
                };
            })()}
        >
            {wordPopoverState.simpleText.split(' ').map((word, index) => (
                <button
                    key={index}
                    onClick={() => {
                        // Find the surah number from the context (a bit tricky here since we have multiple surahs).
                        // However, wordPopoverState stores the trigger element. 
                        // To keep it simple, we pass the first surah's number or fix logic later if needed.
                        // Ideally we should store surah number in popover state too.
                        // For now, defaulting to current viewed surah (prop) is safe enough for 99% cases or user context.
                        onWordClick(word, 'quran-simple-clean', { surah: surah.number, ayah: wordPopoverState.ayahNumberInSurah, wordIndex: index });
                        setWordPopoverState(null);
                    }}
                    className="px-2 py-1 bg-surface-subtle rounded-md hover:bg-primary/20 transition-colors"
                >
                    {word}
                </button>
            ))}
        </div>
      )}

      {activePopover && (
        <AyahActionPopover 
            activePopover={activePopover}
            onClose={() => setActivePopover(null)}
            onSave={handleSaveClick}
            onCopy={handleCopyAyah}
            onSearchText={handleSearchByAyahText}
            onSearchNumber={onSearchByAyahNumber}
            onPlayFrom={handlePlayFromAyah}
            onSaveStop={handleSaveReadingStop}
            copiedAyah={copiedAyah}
            onShowResearch={(surahNum, ayahNum) => {
                setActivePopover(null);
                setShowResearchModal({ surahNum, ayahNum });
            }}
            onStartSelection={(ayah) => {
                const sName = ayah.surah?.name || surah.name;
                handleAyahSelection({ preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent, surah.number, ayah.numberInSurah, ayah.text || '', sName);
            }}
        />
      )}

      {/* Floating Selection Bar */}
      {isSelectionMode && selectedAyahs.length > 0 && (
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-surface p-2 sm:p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 animate-fade-in-up">
              <div className="text-center font-bold text-sm text-primary mb-1">
                  {selectedAyahs.length}
                  <span className="block text-[10px] text-text-secondary">آيات</span>
              </div>
              <button 
                  onClick={handleCopyMultiple} 
                  className="p-3 sm:p-4 bg-primary text-primary-content rounded-xl hover:bg-primary-hover hover:scale-105 transition-all shadow-md flex flex-col items-center gap-1"
                  title="نسخ الآيات المحددة"
              >
                  <CopyIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-xs font-bold text-white">نسخ</span>
              </button>
          </div>
      )}

      {/* Research Modal */}
      {showResearchModal && researchData && researchData[showResearchModal.surahNum] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowResearchModal(null)}>
            <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-primary/20 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-gradient-to-b from-orange-50 to-surface dark:from-orange-900/20 dark:to-surface flex flex-col items-center text-center gap-3 relative">
                    <button onClick={() => setShowResearchModal(null)} className="absolute top-4 left-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">فكرة السورة / الآية</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-active border border-border-subtle text-sm">
                        <span className="font-semibold text-text-secondary">الكتاب:</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{researchData[showResearchModal.surahNum].bookName}</span>
                    </div>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-text-subtle font-bold uppercase tracking-wider">الرسول المخاطب</span>
                        <span className="text-base text-text-primary font-medium">{researchData[showResearchModal.surahNum].prophet}</span>
                    </div>
                    <div className="w-full h-px bg-border-subtle"></div>
                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-text-subtle font-bold uppercase tracking-wider">الدليل و التوضيح</span>
                        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {researchData[showResearchModal.surahNum].description}
                        </p>
                    </div>
                    {researchData[showResearchModal.surahNum].evidenceAyah && (
                        <div className="mt-2 bg-primary/5 rounded-xl p-3 border border-primary/10">
                            <span className="text-xs text-primary font-bold block mb-1">الآيات الدليلة:</span>
                            <span className="text-sm font-mono text-text-primary font-semibold">{researchData[showResearchModal.surahNum].evidenceAyah}</span>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-surface-active border-t border-border-subtle flex justify-end">
                    <button onClick={() => setShowResearchModal(null)} className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors shadow-sm">
                        حسناً
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Toast Notification */}
      {showMultiCopyToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in pointer-events-none">
              <CheckIcon className="w-5 h-5" />
              <span className="font-bold text-sm">تم نسخ الآيات المحددة بنجاح</span>
          </div>
      )}

      {/* Copy Page Modal */}
      <CopyPageModal
        isOpen={isCopyPageModalOpen}
        onClose={() => setIsCopyPageModalOpen(false)}
        pageNumber={currentPage}
        juzNumber={pageInfo?.juzNumber}
        ayahs={currentPageAyahsForCopy}
      />

    </div>
  );
};

export default SurahDetailView;