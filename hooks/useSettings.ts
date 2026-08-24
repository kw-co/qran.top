import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { QuranEdition, FontSize, BrowsingMode, FontStyleType, WordClickBehavior, MushafType } from '../types';
import { downloadAllMushafFonts, checkMushafFontsDownloaded } from '../utils/mushafFonts';

const QURAN_EDITION_KEY = 'qran_app_edition';
const FONT_SIZE_KEY = 'qran_app_font_size';
const FONT_STYLE_KEY = 'qran_app_font_style';
const MUSHAF_TYPE_KEY = 'qran_app_mushaf_type';
const AUDIO_EDITION_KEY = 'qran_app_audio_edition';
const BROWSING_MODE_KEY = 'qran_app_browsing_mode';
const TAJWEED_MODE_KEY = 'qran_app_enable_tajweed';
const WORD_AUDIO_KEY = 'qran_app_enable_word_audio';
const WORD_CLICK_BEHAVIOR_KEY = 'qran_app_word_click_behavior';
const ENABLE_MORPHOLOGY_KEY = 'qran_app_enable_morphology';
const DOWNLOADING_FONTS_KEY = 'qran_app_downloading_fonts';
const COPY_TEXT_FORMAT_KEY = 'qran_app_copy_text_format';
const COPY_CITATION_FORMAT_KEY = 'qran_app_copy_citation_format';
const COPY_MULTI_FORMAT_KEY = 'qran_app_copy_multi_format';
const SHOW_BOTTOM_NAV_BAR_KEY = 'qran_app_show_bottom_nav_bar';

const DEFAULT_EDITIONS: QuranEdition[] = [
    { identifier: "quran-simple-clean", language: "ar", name: "المصحف المبسط", englishName: "Simple Clean", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" },
    { identifier: "quran-uthmani-quran-academy", language: "ar", name: "الرسم العثماني", englishName: "Uthmani (Quran Academy)", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" }
];

export const useSettings = () => {
    const safeGetItem = (key: string, defaultValue: any) => {
        try {
            return localStorage.getItem(key) || defaultValue;
        } catch (e) {
            return defaultValue;
        }
    };

    const safeSetItem = (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    };

    const [fontSize, setFontSize] = useState<FontSize>(() => safeGetItem(FONT_SIZE_KEY, 'md') as FontSize);
    
    // Default to 'imlai_1' (Standard font) or 'mushaf'. If user had 'imlai_2' or 'uthmani', migrate to 'imlai_1' or 'mushaf'
    const [fontStyle, setFontStyle] = useState<FontStyleType>(() => {
        const stored = safeGetItem(FONT_STYLE_KEY, 'imlai_1');
        if (stored === 'mushaf') return 'mushaf';
        return 'imlai_1';
    });

    // Mushaf Type (only madinah)
    const [mushafType, setMushafType] = useState<MushafType>('madinah');

    // Default to 'quran-simple-clean' which is loaded instantly
    const [selectedEdition, setSelectedEdition] = useState<string>(
        () => safeGetItem(QURAN_EDITION_KEY, 'quran-simple-clean')
    );

    const activeEditions = DEFAULT_EDITIONS;

    const [selectedAudioEdition, setSelectedAudioEdition] = useState<string>(
        () => safeGetItem(AUDIO_EDITION_KEY, 'ar.muhammadayyoub')
    );

    const [enableTajweed, setEnableTajweed] = useState<boolean>(
        () => safeGetItem(TAJWEED_MODE_KEY, 'false') === 'true'
    );

    const [enableWordAudio, setEnableWordAudio] = useState<boolean>(
        () => safeGetItem(WORD_AUDIO_KEY, 'true') === 'true'
    );

    const [wordClickBehavior, setWordClickBehavior] = useState<WordClickBehavior>(
        () => safeGetItem(WORD_CLICK_BEHAVIOR_KEY, 'auto') as WordClickBehavior
    );

    const [enableMorphology, setEnableMorphology] = useState<boolean>(
        () => safeGetItem(ENABLE_MORPHOLOGY_KEY, 'true') === 'true'
    );

    const [copyTextFormat, setCopyTextFormat] = useState<CopyTextFormat>(
        () => safeGetItem(COPY_TEXT_FORMAT_KEY, 'imlaei') as CopyTextFormat
    );

    const [copyCitationFormat, setCopyCitationFormat] = useState<CopyCitationFormat>(
        () => safeGetItem(COPY_CITATION_FORMAT_KEY, 'short') as CopyCitationFormat
    );

    const [copyMultiFormat, setCopyMultiFormat] = useState<any>(
        () => safeGetItem(COPY_MULTI_FORMAT_KEY, 'consecutive')
    );

    const [showBottomNavBar, setShowBottomNavBar] = useState<boolean>(
        () => safeGetItem(SHOW_BOTTOM_NAV_BAR_KEY, 'false') === 'true'
    );

    // Madinah Font Download State
    const [fontDownloadProgress, setFontDownloadProgress] = useState(-1);
    const [isDownloadingFonts, setIsDownloadingFonts] = useState<boolean>(
        () => safeGetItem(DOWNLOADING_FONTS_KEY, 'false') === 'true'
    );
    const [isMushafDownloaded, setIsMushafDownloaded] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const checkFonts = useCallback(async () => {
        const downloaded = await checkMushafFontsDownloaded();
        setIsMushafDownloaded(downloaded);
        return downloaded;
    }, []);

    useEffect(() => {
        checkFonts();
    }, [checkFonts]);

    const cancelFontDownload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsDownloadingFonts(false);
        setFontDownloadProgress(-1);
        safeSetItem(DOWNLOADING_FONTS_KEY, 'false');
    }, []);

    const startFontDownload = useCallback(async () => {
        setIsDownloadingFonts(true);
        safeSetItem(DOWNLOADING_FONTS_KEY, 'true');
        setFontDownloadProgress(0);
        
        abortControllerRef.current = new AbortController();
        
        try {
            await downloadAllMushafFonts(
                (progress) => setFontDownloadProgress(progress),
                abortControllerRef.current.signal
            );
            // Finished successfully
            setIsDownloadingFonts(false);
            setFontDownloadProgress(-1);
            safeSetItem(DOWNLOADING_FONTS_KEY, 'false');
            setIsMushafDownloaded(true);
            
            // Auto-activate mushaf mode
            setFontStyle('mushaf');
            setSelectedEdition('quran-uthmani-quran-academy');
            
        } catch (e: any) {
            if (e.message !== 'Download cancelled') {
                console.warn("Font download interrupted or failed:", e);
                setIsDownloadingFonts(false);
                setFontDownloadProgress(-1);
                safeSetItem(DOWNLOADING_FONTS_KEY, 'false');
                checkFonts();
            }
        }
    }, [checkFonts]);

    const removeMushafFonts = useCallback(async () => {
        const { deleteMushafFonts } = await import('../utils/mushafFonts');
        await deleteMushafFonts();
        setIsMushafDownloaded(false);
        setFontDownloadProgress(-1);
        safeSetItem(DOWNLOADING_FONTS_KEY, 'false');
        if (fontStyle === 'mushaf') {
            setFontStyle('imlai_1');
        }
    }, [fontStyle]);

    // Resume download on load if it was interrupted
    useEffect(() => {
        if (isDownloadingFonts) {
            startFontDownload();
        }
    }, []); // Only run once on mount

    useEffect(() => { safeSetItem(QURAN_EDITION_KEY, selectedEdition); }, [selectedEdition]);
    useEffect(() => { safeSetItem(FONT_SIZE_KEY, fontSize); }, [fontSize]);
    useEffect(() => { safeSetItem(FONT_STYLE_KEY, fontStyle); }, [fontStyle]);
    useEffect(() => { safeSetItem(MUSHAF_TYPE_KEY, mushafType); }, [mushafType]);
    useEffect(() => { safeSetItem(AUDIO_EDITION_KEY, selectedAudioEdition); }, [selectedAudioEdition]);
    useEffect(() => { safeSetItem(TAJWEED_MODE_KEY, String(enableTajweed)); }, [enableTajweed]);
    useEffect(() => { safeSetItem(WORD_AUDIO_KEY, String(enableWordAudio)); }, [enableWordAudio]);
    useEffect(() => { safeSetItem(WORD_CLICK_BEHAVIOR_KEY, wordClickBehavior); }, [wordClickBehavior]);
    useEffect(() => { safeSetItem(ENABLE_MORPHOLOGY_KEY, String(enableMorphology)); }, [enableMorphology]);
    useEffect(() => { safeSetItem(COPY_TEXT_FORMAT_KEY, copyTextFormat); }, [copyTextFormat]);
    useEffect(() => { safeSetItem(COPY_CITATION_FORMAT_KEY, copyCitationFormat); }, [copyCitationFormat]);
    useEffect(() => { safeSetItem(COPY_MULTI_FORMAT_KEY, copyMultiFormat); }, [copyMultiFormat]);
    useEffect(() => { safeSetItem(SHOW_BOTTOM_NAV_BAR_KEY, String(showBottomNavBar)); }, [showBottomNavBar]);

    const displayEdition = useMemo(() => {
        const found = activeEditions.find(e => e.identifier === selectedEdition) || DEFAULT_EDITIONS[0];
        if (found.name.includes('القرآن الكريم')) {
            return { ...found, name: found.name.replace(/القرآن الكريم/g, 'المصحف الشريف') };
        }
        return found;
    }, [activeEditions, selectedEdition]);

    const [isDownloadMushafModalOpen, setIsDownloadMushafModalOpen] = useState(false);

    const openDownloadMushafModal = useCallback(() => {
        setIsDownloadMushafModalOpen(true);
    }, []);

    const closeDownloadMushafModal = useCallback(() => {
        setIsDownloadMushafModalOpen(false);
    }, []);

    return {
        fontSize, setFontSize,
        fontStyle, setFontStyle,
        mushafType, setMushafType,
        activeEditions,
        selectedEdition, setSelectedEdition,
        selectedAudioEdition, setSelectedAudioEdition,
        enableTajweed, setEnableTajweed,
        enableWordAudio, setEnableWordAudio,
        wordClickBehavior, setWordClickBehavior,
        copyTextFormat, setCopyTextFormat,
        copyCitationFormat, setCopyCitationFormat,
        copyMultiFormat, setCopyMultiFormat,
        enableMorphology, setEnableMorphology,
        showBottomNavBar, setShowBottomNavBar,
        displayEdition,
        fontDownloadProgress, setFontDownloadProgress,
        isDownloadingFonts, setIsDownloadingFonts,
        isMushafDownloaded,
        checkFonts,
        removeMushafFonts,
        cancelFontDownload, startFontDownload,
        isDownloadMushafModalOpen, setIsDownloadMushafModalOpen,
        openDownloadMushafModal, closeDownloadMushafModal
    };
};
