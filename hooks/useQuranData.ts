import { useState, useEffect, useCallback, useRef } from 'react';
import type { SurahData, QuranEdition } from '../types';
import { normalizeArabicText } from '../utils/text';
import { idbGet, idbSet } from '../utils/idb';

const DATA_VERSION_STORAGE_KEY = 'qran_offline_data_version';
const CURRENT_FALLBACK_VERSION = '1.2.0';

const CORE_EDITIONS: QuranEdition[] = [
    { identifier: "quran-simple-clean", language: "ar", name: "المصحف المبسط", englishName: "Simple Clean", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" },
    { identifier: "quran-simple", language: "ar", name: "الرسم الإملائي (مُشكل)", englishName: "Simple", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" },
    { identifier: "quran-uthmani-quran-academy", language: "ar", name: "الرسم العثماني", englishName: "Uthmani (Quran Academy)", format: "text", type: "quran", direction: "rtl", sourceApi: "alquran.cloud" }
];

export const useQuranData = () => {
    const [allQuranData, setAllQuranData] = useState<{ [key: string]: SurahData[] } | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [loadingEditions, setLoadingEditions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [dataSourceStatus, setDataSourceStatus] = useState<'primary' | 'fallback'>('primary');
    const [availableEditions] = useState<QuranEdition[]>(CORE_EDITIONS);

    const getEditionUrl = useCallback((edition: QuranEdition): string => {
        const { identifier } = edition;
        return `https://api.alquran.cloud/v1/quran/${identifier}`;
    }, []);

    const getEditionFallbackUrls = useCallback((edition: QuranEdition): string[] => {
        const { identifier } = edition;
        return [
            `https://api.alquran.cloud/v1/quran/${identifier}`,
            `https://cdn.islamic.network/quran/api/v1/quran/${identifier}`,
            `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ar-${identifier}.json`
        ];
    }, []);

    const processApiData = (apiData: any): SurahData[] => {
        if (apiData && apiData.code === 200 && apiData.data && apiData.data.surahs) {
            const surahs: SurahData[] = apiData.data.surahs;

            const fatiha = surahs.find(s => s.number === 1);
            const definitiveBismillahText = fatiha?.ayahs[0]?.text || 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
            const normalizedBismillahFingerprint = normalizeArabicText(definitiveBismillahText).replace(/\s/g, '');
            const bismillahWordCount = definitiveBismillahText.split(' ').length;

            const cleanedSurahs = surahs.map(surah => {
                if (surah.number === 1 || surah.number === 9 || surah.ayahs.length === 0) {
                    return surah;
                }

                const firstAyah = surah.ayahs[0];
                if (!firstAyah.text) return surah;

                const normalizedFirstAyahFingerprint = normalizeArabicText(firstAyah.text).replace(/\s/g, '');

                if (normalizedFirstAyahFingerprint.startsWith(normalizedBismillahFingerprint)) {
                    const words = firstAyah.text.split(' ');
                    const newText = words.length > bismillahWordCount ? words.slice(bismillahWordCount).join(' ') : '';
                    
                    const newFirstAyah = { ...firstAyah, text: newText.trim() };
                    const newAyahs = [newFirstAyah, ...surah.ayahs.slice(1)];
                    
                    return { ...surah, ayahs: newAyahs };
                }

                return surah;
            });

            return cleanedSurahs;
        }
        throw new Error('Invalid or unexpected API data structure');
    };

    // Helper: Try reading from CacheStorage if IndexedDB was cleared but SW cache still has it
    const tryReadFromCacheStorage = useCallback(async (editionIdentifier: string): Promise<SurahData[] | null> => {
        if (!('caches' in window)) return null;
        try {
            const urls = [
                `https://api.alquran.cloud/v1/quran/${editionIdentifier}`,
                `https://cdn.islamic.network/quran/api/v1/quran/${editionIdentifier}`
            ];
            for (const url of urls) {
                const match = await caches.match(url);
                if (match && match.ok) {
                    const json = await match.json();
                    const surahs = processApiData(json);
                    if (surahs && surahs.length > 0) {
                        idbSet(`edition_${editionIdentifier}`, surahs).catch(() => {});
                        return surahs;
                    }
                }
            }
        } catch {}
        return null;
    }, []);

    const fetchCustomEditionData = useCallback(async (editionIdentifier: string, forceRefresh = false) => {
        if (!forceRefresh && (allQuranData?.[editionIdentifier] || loadingEditions.includes(editionIdentifier))) {
            return;
        }

        // Step 1: Instant Offline-First check in IndexedDB
        if (!forceRefresh) {
            try {
                const cachedFromDb = await idbGet<SurahData[]>(`edition_${editionIdentifier}`);
                if (cachedFromDb && Array.isArray(cachedFromDb) && cachedFromDb.length > 0) {
                    setAllQuranData(prev => ({ ...prev, [editionIdentifier]: cachedFromDb }));
                    return;
                }
            } catch {}

            // Step 2: Check CacheStorage backup before touching the network
            const cachedFromSw = await tryReadFromCacheStorage(editionIdentifier);
            if (cachedFromSw && cachedFromSw.length > 0) {
                setAllQuranData(prev => ({ ...prev, [editionIdentifier]: cachedFromSw }));
                return;
            }
        }

        // Step 3: If device is offline and no local copy exists yet
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setDataSourceStatus('fallback');
            return;
        }

        setLoadingEditions(prev => (prev.includes(editionIdentifier) ? prev : [...prev, editionIdentifier]));
        setError(null);

        const editionToFetch = availableEditions.find(e => e.identifier === editionIdentifier);
        if (!editionToFetch) {
            setLoadingEditions(prev => prev.filter(id => id !== editionIdentifier));
            return;
        }

        const urls = getEditionFallbackUrls(editionToFetch);
        let successSurahs: SurahData[] | null = null;
        let lastError: any = null;

        try {
            successSurahs = await Promise.any(urls.map(async (url) => {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 8000);
                try {
                    const response = await fetch(url, { signal: controller.signal });
                    if (!response.ok) throw new Error(`Network error ${response.status}`);
                    const apiData = await response.json();
                    const surahs = processApiData(apiData);
                    if (surahs && surahs.length > 0) return surahs;
                    throw new Error("Invalid data");
                } finally {
                    clearTimeout(timer);
                }
            }));
        } catch (err) {
            lastError = err;
        }

        if (successSurahs) {
            setAllQuranData(prev => ({ ...prev, [editionIdentifier]: successSurahs! }));
            setDataSourceStatus('primary');
            idbSet(`edition_${editionIdentifier}`, successSurahs).catch(() => {});
        } else {
            setDataSourceStatus('fallback');
            // Only show error if we have NO editions loaded at all
            setAllQuranData(current => {
                if (!current || Object.keys(current).length === 0) {
                    setError(`تعذر الاتصال بالشبكة لتحميل البيانات لأول مرة. يُرجى التحقق من الاتصال بالإنترنت.`);
                }
                return current;
            });
            console.warn(`Failed all mirrors for edition ${editionIdentifier}:`, lastError);
        }

        setLoadingEditions(prev => prev.filter(id => id !== editionIdentifier));
    }, [availableEditions, getEditionFallbackUrls, allQuranData, loadingEditions, tryReadFromCacheStorage]);

    const fetchCustomEditionDataRef = useRef(fetchCustomEditionData);
    useEffect(() => {
        fetchCustomEditionDataRef.current = fetchCustomEditionData;
    }, [fetchCustomEditionData]);

    useEffect(() => {
        let isMounted = true;

        const initializeOfflineFirst = async () => {
            setIsInitialLoading(false);

            // 1. Load ALL locally cached editions from IndexedDB in parallel (< 30ms)
            const editionIds = ['quran-simple-clean', 'quran-uthmani-quran-academy', 'quran-simple'];
            const localResults = await Promise.all(
                editionIds.map(async (id) => {
                    try {
                        const fromDb = await idbGet<SurahData[]>(`edition_${id}`);
                        if (fromDb && Array.isArray(fromDb) && fromDb.length > 0) {
                            return { id, data: fromDb };
                        }
                        const fromCache = await tryReadFromCacheStorage(id);
                        if (fromCache && fromCache.length > 0) {
                            return { id, data: fromCache };
                        }
                    } catch {}
                    return { id, data: null };
                })
            );

            if (!isMounted) return;

            const initialMap: { [key: string]: SurahData[] } = {};
            const missingIds: string[] = [];

            for (const item of localResults) {
                if (item.data) {
                    initialMap[item.id] = item.data;
                } else {
                    missingIds.push(item.id);
                }
            }

            // If we have local data, mount it immediately with ZERO network wait!
            if (Object.keys(initialMap).length > 0) {
                // If one of simple-clean or uthmani is present, cross-fill temporarily if the other is missing
                if (!initialMap['quran-uthmani-quran-academy'] && initialMap['quran-simple-clean']) {
                    initialMap['quran-uthmani-quran-academy'] = initialMap['quran-simple-clean'];
                }
                if (!initialMap['quran-simple-clean'] && initialMap['quran-uthmani-quran-academy']) {
                    initialMap['quran-simple-clean'] = initialMap['quran-uthmani-quran-academy'];
                }
                setAllQuranData(initialMap);
            }

            // 2. If offline, stop right here — 100% instant offline operation!
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                setDataSourceStatus('fallback');
                return;
            }

            // 3. If all 3 editions are already stored locally, do a tiny 13-byte version check (/version.json)
            if (missingIds.length === 0) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000);
                    const res = await fetch('./version.json', {
                        cache: 'no-store',
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const versionData = await res.json();
                        const remoteVer = versionData?.v || CURRENT_FALLBACK_VERSION;
                        const storedVer = localStorage.getItem(DATA_VERSION_STORAGE_KEY);
                        if (!storedVer) {
                            localStorage.setItem(DATA_VERSION_STORAGE_KEY, remoteVer);
                        } else if (storedVer === remoteVer) {
                            // Version matches! Zero network downloads needed!
                            return;
                        } else {
                            // Update stored version marker
                            localStorage.setItem(DATA_VERSION_STORAGE_KEY, remoteVer);
                        }
                    }
                } catch {
                    // Network glitch or offline — keep using local copy seamlessly
                    return;
                }
                return;
            }

            // 4. Only fetch missing editions in the background
            setIsBackgroundLoading(true);
            await Promise.all(
                missingIds.map(id => fetchCustomEditionDataRef.current(id))
            );
            if (isMounted) {
                setIsBackgroundLoading(false);
                try {
                    localStorage.setItem(DATA_VERSION_STORAGE_KEY, CURRENT_FALLBACK_VERSION);
                } catch {}
            }
        };

        initializeOfflineFirst();

        // Automatically recover if user opens app offline for the first time and then connects
        const handleOnline = () => {
            setDataSourceStatus('primary');
            setError(null);
            initializeOfflineFirst();
        };
        window.addEventListener('online', handleOnline);

        return () => {
            isMounted = false;
            window.removeEventListener('online', handleOnline);
        };
    }, [tryReadFromCacheStorage]);

    return {
        allQuranData, isInitialLoading, isBackgroundLoading, loadingEditions, error,
        clearError: () => setError(null),
        dataSourceStatus, availableEditions,
        fetchCustomEditionData, getEditionUrl,
    };
};