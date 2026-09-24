import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Ayah, QuranEdition, SurahData } from '../types';
import { getAudioUrl, getBismillahAudioUrl, getSecondaryAudioUrl, getGlobalAyahNumber, getSurahAndAyahFromGlobalNumber } from '../utils/audio';
import { ALL_AUDIO_EDITIONS } from '../data/audioEditions';

export interface PlaybackOptions {
    isExplicitPlaylist?: boolean;
    repeatAyahTarget?: number;
    repeatPlaylistTarget?: number;
    delaySeconds?: number;
}

export const useAudioPlayer = (
    currentPath: string,
    allQuranData: { [key: string]: SurahData[] } | null,
    selectedAudioEdition: string,
    setSelectedAudioEdition: (id: string) => void,
    fetchCustomEditionData: (id: string) => void
) => {
    const [playbackInfo, setPlaybackInfo] = useState<{
        playlist: Ayah[]; 
        currentIndex: number; 
        isPlaying: boolean;
        trigger?: { 
            ayahsForPlaylist: Ayah[]; 
            audioEditionIdentifier: string; 
            startIndex?: number; 
            options?: PlaybackOptions;
        };
        isExplicitPlaylist?: boolean;
    } | null>(null);

    // Dhikr / Repetition settings
    const [repeatAyahTarget, setRepeatAyahTarget] = useState<number>(1); // 1 = play once, 3, 7, 10, 33, 100, 0 = infinite loop
    const [currentAyahRepeatCount, setCurrentAyahRepeatCount] = useState<number>(1); // 1-indexed counter
    const [repeatPlaylistTarget, setRepeatPlaylistTarget] = useState<number>(1); // 1 = play once, 3, 5, 0 = infinite loop
    const [currentPlaylistCycle, setCurrentPlaylistCycle] = useState<number>(1); // 1-indexed
    const [delaySeconds, setDelaySeconds] = useState<number>(0); // pause between repetitions in seconds
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.75, 1, 1.25, 1.5

    const handleStartPlayback = useCallback((
        ayahsForPlaylist: Ayah[], 
        audioEditionIdentifier: string, 
        startIndex: number = 0,
        options?: PlaybackOptions
    ) => {
        console.log('[AudioPlayer] Starting playback. ayahsForPlaylist length:', ayahsForPlaylist.length, 'startIndex:', startIndex, 'options:', options);
        
        const audioEditionDetails = ALL_AUDIO_EDITIONS.find(e => e.identifier === audioEditionIdentifier);
        if (!audioEditionDetails) {
            const fallback = ALL_AUDIO_EDITIONS.find(e => e.identifier === 'ar.alafasy');
            if (fallback) {
                setSelectedAudioEdition('ar.alafasy');
                handleStartPlayback(ayahsForPlaylist, 'ar.alafasy', startIndex, options);
            }
            return;
        }

        // Apply Dhikr options if provided
        if (options?.repeatAyahTarget !== undefined) {
            setRepeatAyahTarget(options.repeatAyahTarget);
        }
        if (options?.repeatPlaylistTarget !== undefined) {
            setRepeatPlaylistTarget(options.repeatPlaylistTarget);
        }
        if (options?.delaySeconds !== undefined) {
            setDelaySeconds(options.delaySeconds);
        }
        setCurrentAyahRepeatCount(1);
        setCurrentPlaylistCycle(1);

        const getPlaylistData = () => {
            const [path] = currentPath.substring(1).split('?');
            const pathParts = path.split('/').filter(Boolean);

            // CRITICAL FIX: If explicit ayahs are provided (such as search results, bookmarked ayahs, or user-selected items):
            // We MUST use ayahsForPlaylist as the playlist, and NEVER discard it for allAyahsContinuous!
            if (ayahsForPlaylist && ayahsForPlaylist.length > 0) {
                return ayahsForPlaylist.slice(startIndex);
            }

            const uthmaniData = allQuranData?.['quran-uthmani-quran-academy'] || allQuranData?.['quran-uthmani'];
            if (!uthmaniData) return [];

            const allAyahsContinuous = uthmaniData.flatMap(surah => 
                surah.ayahs.map(ayah => ({
                    ...ayah,
                    surah: { 
                        number: surah.number, 
                        name: surah.name, 
                        englishName: surah.englishName, 
                        englishNameTranslation: surah.englishNameTranslation, 
                        revelationType: surah.revelationType, 
                        numberOfAyahs: surah.numberOfAyahs 
                    }
                }))
            );

            // Case 1: Surah Playback
            if (pathParts[0] === 'surah' && pathParts[1]) {
                const surahNumber = parseInt(pathParts[1], 10);
                const firstIndex = allAyahsContinuous.findIndex(a => a.surah?.number === surahNumber);
                if (firstIndex !== -1) {
                    return allAyahsContinuous.slice(firstIndex + startIndex);
                }
            }
            
            // Case 2: Page Playback
            if (pathParts[0] === 'page' && pathParts[1]) {
                const pageNumber = parseInt(pathParts[1], 10);
                const firstIndex = allAyahsContinuous.findIndex(a => a.page === pageNumber);
                if (firstIndex !== -1) {
                    return allAyahsContinuous.slice(firstIndex + startIndex);
                }
            }

            return [];
        };

        const generatePlaylist = (basePlaylist: Ayah[]) => {
            if (basePlaylist.length === 0) return null;
            
            let finalPlaylist = basePlaylist.map(ayah => {
                let enrichedAyah = { ...ayah };
                if (!enrichedAyah.surah && enrichedAyah.number) {
                    const resolved = getSurahAndAyahFromGlobalNumber(enrichedAyah.number);
                    enrichedAyah.surah = {
                        number: resolved.surahNumber,
                        name: resolved.surahName || 'سورة',
                        englishName: '',
                        englishNameTranslation: '',
                        numberOfAyahs: 0,
                        revelationType: 'Meccan'
                    };
                    if (!enrichedAyah.numberInSurah) {
                        enrichedAyah.numberInSurah = resolved.numberInSurah;
                    }
                }

                let audioUrl = getAudioUrl(enrichedAyah, audioEditionDetails);
                const secondaryAudio = getSecondaryAudioUrl(enrichedAyah, audioEditionIdentifier);
                
                if (audioEditionDetails.sourceApi === 'alquran.cloud') {
                    const audioData = allQuranData?.[audioEditionIdentifier];
                    const audioSurah = audioData?.find(s => s.number === enrichedAyah.surah?.number);
                    const audioAyah = audioSurah?.ayahs.find(a => a.numberInSurah === enrichedAyah.numberInSurah);
                    if (audioAyah?.audio) {
                        audioUrl = String(audioAyah.audio).replace('http://', 'https://');
                    }
                }

                if (!audioUrl && enrichedAyah.surah) {
                    const globalNum = enrichedAyah.number || getGlobalAyahNumber(enrichedAyah.surah.number, enrichedAyah.numberInSurah);
                    audioUrl = `https://cdn.islamic.network/quran/audio/128/${audioEditionIdentifier || 'ar.alafasy'}/${globalNum}.mp3`;
                }

                return { 
                    ...enrichedAyah, 
                    audio: audioUrl,
                    audioSecondary: secondaryAudio ? [secondaryAudio] : undefined
                } as Ayah;
            }).filter((item): item is Ayah & { audio: string } => !!item.audio);

            // Bismillah should ONLY be added when reading full surah from start in Surah or Page mode,
            // never in search results or custom selected playlist!
            const [path] = currentPath.substring(1).split('?');
            const pathParts = path.split('/').filter(Boolean);
            const isSearchOrFiltered = pathParts[0] === 'search' || pathParts[0] === 'hm' || pathParts[0] === 'hawameem' || pathParts[0] === 'saved' || (ayahsForPlaylist && ayahsForPlaylist.length > 0);

            const firstAyahOfPlaylist = basePlaylist[0];
            const surahForPlaylist = firstAyahOfPlaylist?.surah;
            const needsBismillah = !isSearchOrFiltered && startIndex === 0 && firstAyahOfPlaylist?.numberInSurah === 1 && surahForPlaylist && surahForPlaylist.number !== 1 && surahForPlaylist.number !== 9;
            
            if (needsBismillah) {
                const bismillahAudioUrl = getBismillahAudioUrl(audioEditionDetails);
                if (bismillahAudioUrl) {
                    finalPlaylist.unshift({ number: 0, numberInSurah: 0, text: 'البسملة', audio: bismillahAudioUrl, surah: surahForPlaylist });
                }
            }
            return finalPlaylist;
        };

        const playlistBase = getPlaylistData();
        const finalPlaylist = generatePlaylist(playlistBase);
        
        console.log('[AudioPlayer] Generated finalPlaylist length:', finalPlaylist?.length);
        if (finalPlaylist && finalPlaylist.length > 0) {
            setPlaybackInfo({ 
                playlist: finalPlaylist, 
                currentIndex: 0, 
                isPlaying: true,
                isExplicitPlaylist: ayahsForPlaylist && ayahsForPlaylist.length > 0 
            });
        } else if (audioEditionDetails.sourceApi === 'alquran.cloud' && !allQuranData?.[audioEditionIdentifier]) {
            fetchCustomEditionData(audioEditionIdentifier);
            setPlaybackInfo({ 
                playlist: [], 
                currentIndex: 0, 
                isPlaying: false, 
                trigger: { ayahsForPlaylist, audioEditionIdentifier, startIndex, options } 
            });
        } else {
            console.warn("[useAudioPlayer] Could not generate playlist for audio playback.");
            setPlaybackInfo(null);
        }
    }, [allQuranData, fetchCustomEditionData, currentPath, setSelectedAudioEdition]);

    useEffect(() => {
        if (playbackInfo?.trigger && allQuranData?.[playbackInfo.trigger.audioEditionIdentifier]) {
            handleStartPlayback(
                playbackInfo.trigger.ayahsForPlaylist, 
                playbackInfo.trigger.audioEditionIdentifier, 
                playbackInfo.trigger.startIndex,
                playbackInfo.trigger.options
            );
        }
    }, [playbackInfo, allQuranData, handleStartPlayback]);

    const handlePlayPause = useCallback(() => {
        setPlaybackInfo(p => p ? { ...p, isPlaying: !p.isPlaying } : null);
    }, []);

    const handlePlay = useCallback(() => {
        setPlaybackInfo(p => p ? { ...p, isPlaying: true } : null);
    }, []);

    const handlePause = useCallback(() => {
        setPlaybackInfo(p => p ? { ...p, isPlaying: false } : null);
    }, []);

    const handleClosePlayback = useCallback(() => {
        setPlaybackInfo(null);
        setCurrentAyahRepeatCount(1);
        setCurrentPlaylistCycle(1);
    }, []);

    // Handles what happens when an ayah finishes playing
    const handleAyahEnded = useCallback((repeatSameAudioCallback?: () => void) => {
        // 1. Check if current ayah needs repeating (0 = infinite repeat)
        const isInfiniteAyahRepeat = repeatAyahTarget === 0;
        if (isInfiniteAyahRepeat || currentAyahRepeatCount < repeatAyahTarget) {
            setCurrentAyahRepeatCount(prev => prev + 1);
            if (repeatSameAudioCallback) {
                if (delaySeconds > 0) {
                    setTimeout(() => {
                        repeatSameAudioCallback();
                    }, delaySeconds * 1000);
                } else {
                    repeatSameAudioCallback();
                }
            }
            return { action: 'repeat' as const };
        }

        // 2. Target repeat count reached for this ayah! Reset ayah counter for the next ayah
        setCurrentAyahRepeatCount(1);

        // 3. Move to next ayah in playlist
        setPlaybackInfo(p => {
            if (!p) return null;
            const nextIndex = p.currentIndex + 1;
            if (nextIndex < p.playlist.length) {
                return { ...p, currentIndex: nextIndex };
            }

            // 4. End of playlist reached! Check playlist repeat target
            const isInfinitePlaylistRepeat = repeatPlaylistTarget === 0;
            if (isInfinitePlaylistRepeat || currentPlaylistCycle < repeatPlaylistTarget) {
                setCurrentPlaylistCycle(prev => prev + 1);
                return { ...p, currentIndex: 0 };
            }

            // 5. All cycles finished! Stop playback
            return null;
        });

        return { action: 'next' as const };
    }, [repeatAyahTarget, currentAyahRepeatCount, repeatPlaylistTarget, currentPlaylistCycle, delaySeconds]);

    const handleNext = useCallback(() => {
        setCurrentAyahRepeatCount(1);
        setPlaybackInfo(p => {
            if (!p) return null;
            const nextIndex = p.currentIndex + 1;
            if (nextIndex < p.playlist.length) {
                return { ...p, currentIndex: nextIndex };
            }
            // Loop if playlist repeat is enabled
            if (repeatPlaylistTarget === 0 || currentPlaylistCycle < repeatPlaylistTarget) {
                setCurrentPlaylistCycle(prev => prev + 1);
                return { ...p, currentIndex: 0 };
            }
            return null;
        });
    }, [repeatPlaylistTarget, currentPlaylistCycle]);

    const handlePrev = useCallback(() => {
        setCurrentAyahRepeatCount(1);
        setPlaybackInfo(p => {
            if (!p) return null;
            const prevIndex = p.currentIndex - 1;
            if (prevIndex >= 0) {
                return { ...p, currentIndex: prevIndex };
            }
            return p;
        });
    }, []);

    const currentlyPlayingAyahGlobalNumber = playbackInfo?.playlist[playbackInfo.currentIndex]?.number;
    const selectedAudioEditionDetails = useMemo(() => ALL_AUDIO_EDITIONS.find(e => e.identifier === selectedAudioEdition), [selectedAudioEdition]);

    return {
        playbackInfo,
        currentlyPlayingAyahGlobalNumber,
        selectedAudioEditionDetails,
        handleStartPlayback,
        handlePlayPause,
        handlePlay,
        handlePause,
        handleNext,
        handlePrev,
        handleAyahEnded,
        handleClosePlayback,
        ALL_AUDIO_EDITIONS,
        // Dhikr & Controls
        repeatAyahTarget,
        setRepeatAyahTarget,
        currentAyahRepeatCount,
        repeatPlaylistTarget,
        setRepeatPlaylistTarget,
        currentPlaylistCycle,
        delaySeconds,
        setDelaySeconds,
        playbackSpeed,
        setPlaybackSpeed,
    };
};
