import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Ayah, QuranEdition } from '../types';
import { 
    PlayIcon, PauseIcon, ForwardIcon, BackwardIcon, XIcon, SpinnerIcon, 
    SpeakerWaveIcon, SparklesIcon, DhikrIcon, RepeatIcon 
} from './icons';
import { formatSurahNameForDisplay } from '../utils/text';
import RecitersModal from './RecitersModal';
import DhikrModal from './DhikrModal';

export interface AudioPlayerBarProps {
    playlist: Ayah[];
    currentIndex: number;
    isPlaying: boolean;
    isLoading: boolean;
    onPlayPause: () => void;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onEnded: () => void;
    onAyahEnded?: (repeatSameAudio: () => void) => void;
    onClose: () => void;
    audioEdition: QuranEdition | undefined;
    // Dhikr & Repetition Props
    repeatAyahTarget?: number;
    setRepeatAyahTarget?: (count: number) => void;
    currentAyahRepeatCount?: number;
    repeatPlaylistTarget?: number;
    setRepeatPlaylistTarget?: (count: number) => void;
    currentPlaylistCycle?: number;
    delaySeconds?: number;
    setDelaySeconds?: (seconds: number) => void;
    // Speed Control
    playbackSpeed?: number;
    setPlaybackSpeed?: (speed: number) => void;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 0.75];

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ 
    playlist, 
    currentIndex, 
    isPlaying, 
    isLoading, 
    onPlayPause, 
    onPlay, 
    onPause, 
    onNext, 
    onPrev, 
    onEnded, 
    onAyahEnded,
    onClose, 
    audioEdition,
    repeatAyahTarget = 1,
    setRepeatAyahTarget,
    currentAyahRepeatCount = 1,
    repeatPlaylistTarget = 1,
    setRepeatPlaylistTarget,
    currentPlaylistCycle = 1,
    delaySeconds = 0,
    setDelaySeconds,
    playbackSpeed = 1,
    setPlaybackSpeed,
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const currentAyah = playlist[currentIndex];
    
    // UI Modals
    const [isRecitersModalOpen, setIsRecitersModalOpen] = useState(false);
    const [isDhikrModalOpen, setIsDhikrModalOpen] = useState(false);

    // Audio playback state
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isSeeking, setIsSeeking] = useState<boolean>(false);
    const [audioErrorNotice, setAudioErrorNotice] = useState<string | null>(null);

    // Synchronize audio element source on track change
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentAyah?.audio) return;
        
        setAudioErrorNotice(null);
        setCurrentTime(0);
        setDuration(0);

        const currentSrcAttr = audio.getAttribute('src');
        const currentSrcProp = audio.src;
        const primarySrc = currentAyah.audio;
        const fallbackSrcs = currentAyah.audioSecondary || [];

        const isSameSrc = currentSrcAttr === primarySrc || currentSrcProp === primarySrc || currentSrcProp.endsWith(primarySrc) ||
            fallbackSrcs.some(fallback => currentSrcAttr === fallback || currentSrcProp === fallback || currentSrcProp.endsWith(fallback));

        if (!isSameSrc) {
            audio.src = primarySrc;
            audio.playbackRate = playbackSpeed;
            audio.load();
        } else {
            audio.playbackRate = playbackSpeed;
        }

        if (isPlaying) {
            audio.play().catch(e => {
                if (e.name !== 'AbortError') {
                    console.error("Audio play failed:", e);
                }
            });
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        } else {
            audio.pause();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
    }, [currentIndex, isPlaying, playlist, currentAyah, playbackSpeed]);

    // Handle playback rate changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    // Callback when current audio track ends
    const handleAudioEnded = useCallback(() => {
        const audio = audioRef.current;
        
        // Define repeat callback for Dhikr mode
        const replaySame = () => {
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Error replaying same ayah:", e));
            }
        };

        if (onAyahEnded) {
            onAyahEnded(replaySame);
        } else {
            onEnded();
        }
    }, [onAyahEnded, onEnded]);

    // Time update handler
    const handleTimeUpdate = () => {
        if (!isSeeking && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
        }
    };

    // Seek scrub handler
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const targetTime = parseFloat(e.target.value);
        setCurrentTime(targetTime);
        if (audioRef.current) {
            audioRef.current.currentTime = targetTime;
        }
    };

    // Seek +/- 5 seconds
    const handleSkip = (seconds: number) => {
        if (audioRef.current) {
            const nextTime = Math.max(0, Math.min(duration || 9999, audioRef.current.currentTime + seconds));
            audioRef.current.currentTime = nextTime;
            setCurrentTime(nextTime);
        }
    };

    // Speed toggle
    const handleCycleSpeed = () => {
        if (!setPlaybackSpeed) return;
        const currentIdx = SPEED_OPTIONS.indexOf(playbackSpeed);
        const nextSpeed = SPEED_OPTIONS[(currentIdx + 1) % SPEED_OPTIONS.length];
        setPlaybackSpeed(nextSpeed);
    };

    // MediaSession API setup
    useEffect(() => {
        if ('mediaSession' in navigator && currentAyah) {
            const surahName = currentAyah.surah?.name ? formatSurahNameForDisplay(currentAyah.surah.name) : '...';
            const ayahNum = currentAyah.numberInSurah ? `الآية ${currentAyah.numberInSurah}` : '';
            const dhikrStatus = repeatAyahTarget > 1 ? ` (ذكر: ${currentAyahRepeatCount}/${repeatAyahTarget})` : '';

            navigator.mediaSession.metadata = new MediaMetadata({
                title: `سورة ${surahName} ${ayahNum}${dhikrStatus}`,
                artist: audioEdition?.name || 'القرآن الكريم',
                album: 'القرآن الكريم - منصة بينات',
                artwork: [
                    { src: '/thumbnail.svg', sizes: '512x512', type: 'image/svg+xml' },
                    { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', onPlay);
            navigator.mediaSession.setActionHandler('pause', onPause);
            navigator.mediaSession.setActionHandler('previoustrack', onPrev);
            navigator.mediaSession.setActionHandler('nexttrack', onNext);
            
            return () => {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('previoustrack', null);
                navigator.mediaSession.setActionHandler('nexttrack', null);
            };
        }
    }, [currentAyah, audioEdition, onPlay, onPause, onPrev, onNext, repeatAyahTarget, currentAyahRepeatCount]);

    // Fallback audio source handling
    const handleAudioError = () => {
        if (audioRef.current && currentAyah?.audioSecondary && currentAyah.audioSecondary.length > 0) {
            const fallbackUrl = currentAyah.audioSecondary[0];
            const currentSrc = audioRef.current.getAttribute('src');
            
            if (currentSrc !== fallbackUrl) {
                console.log("Audio playback failed. Switching to fallback source...");
                audioRef.current.src = fallbackUrl;
                if (isPlaying) {
                    audioRef.current.play().catch(e => console.error("Fallback play failed:", e));
                }
                return;
            }
        }
        setAudioErrorNotice("تعذر تحميل الملف الصوتي من المصدر، جرب اختيار قارئ آخر.");
        console.error("Audio playback error (all sources failed).");
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs) || secs < 0) return '0:00';
        const mins = Math.floor(secs / 60);
        const remSecs = Math.floor(secs % 60);
        return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
    };

    const getSurahName = () => {
        if (!currentAyah?.surah?.name) return '...';
        return formatSurahNameForDisplay(currentAyah.surah.name);
    };

    const isDhikrActive = repeatAyahTarget > 1 || repeatAyahTarget === 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-surface/95 dark:bg-neutral-900/95 backdrop-blur-md z-40 border-t border-border-default shadow-[0_-8px_30px_rgba(0,0,0,0.15)] animate-fade-in" dir="rtl">
            <audio 
                ref={audioRef} 
                preload="auto" 
                onError={handleAudioError}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
            />

            {/* Time / Seek Bar Slider across top edge */}
            <div className="relative w-full group">
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    disabled={!duration || isLoading}
                    onMouseDown={() => setIsSeeking(true)}
                    onMouseUp={() => setIsSeeking(false)}
                    onTouchStart={() => setIsSeeking(true)}
                    onTouchEnd={() => setIsSeeking(false)}
                    onChange={handleSeekChange}
                    className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 accent-primary cursor-pointer transition-all hover:h-2"
                    aria-label="التحكم بموضع الصوت"
                />
            </div>

            <div className="max-w-5xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-1.5">
                {audioErrorNotice && (
                    <div className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg text-center font-medium">
                        {audioErrorNotice}
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Left: Ayah & Reciter Info */}
                    <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setIsRecitersModalOpen(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer shrink-0"
                                title="تغيير القارئ (قائمة الأئمة)"
                            >
                                <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                <span className="max-w-[120px] truncate">{audioEdition?.name || 'اختر القارئ'}</span>
                            </button>

                            <span className="text-text-primary font-bold text-xs sm:text-sm truncate">
                                سورة {getSurahName()}
                            </span>

                            {currentAyah?.numberInSurah && (
                                <span className="text-xs text-text-secondary bg-surface-subtle px-1.5 py-0.5 rounded-md border border-border-default shrink-0">
                                    الآية {currentAyah.numberInSurah}
                                </span>
                            )}

                            {playlist.length > 1 && (
                                <span className="text-[11px] text-text-muted hidden md:inline">
                                    ({currentIndex + 1} من {playlist.length})
                                </span>
                            )}
                        </div>

                        {/* Time labels & Active Dhikr Indicator */}
                        <div className="flex items-center gap-3 text-[11px] text-text-muted mt-1">
                            <span className="font-mono" dir="ltr">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>

                            {/* Dhikr Badge in audio bar */}
                            {isDhikrActive && (
                                <button
                                    onClick={() => setIsDhikrModalOpen(true)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 text-[10px] sm:text-xs cursor-pointer hover:bg-emerald-500/25 transition-colors"
                                    title="إعدادات الذكر والتكرار النشط"
                                >
                                    <SparklesIcon className="w-3 h-3 animate-pulse" />
                                    <span>
                                        الذكر: المرة {currentAyahRepeatCount} من {repeatAyahTarget === 0 ? '∞' : repeatAyahTarget}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Center: Main Playback Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                        {/* Skip -5s */}
                        <button 
                            onClick={() => handleSkip(-5)} 
                            disabled={isLoading}
                            className="p-1.5 text-text-muted hover:text-text-primary transition-colors hidden sm:block cursor-pointer"
                            title="ترجيع 5 ثوانٍ"
                        >
                            <span className="text-[11px] font-mono font-bold">-5ث</span>
                        </button>

                        {/* Prev Ayah */}
                        <button 
                            onClick={onPrev} 
                            disabled={isLoading} 
                            className="p-1.5 sm:p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                            title="الآية السابقة"
                        >
                            <BackwardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* Play / Pause button */}
                        <button 
                            onClick={onPlayPause} 
                            disabled={isLoading} 
                            className="p-2.5 sm:p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover active:scale-95 transition-all disabled:bg-primary/60 cursor-pointer flex items-center justify-center"
                            title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                        >
                            {isLoading ? (
                                <SpinnerIcon className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
                            ) : isPlaying ? (
                                <PauseIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                            ) : (
                                <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                            )}
                        </button>

                        {/* Next Ayah */}
                        <button 
                            onClick={onNext} 
                            disabled={isLoading} 
                            className="p-1.5 sm:p-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
                            title="الآية التالية"
                        >
                            <ForwardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* Skip +5s */}
                        <button 
                            onClick={() => handleSkip(5)} 
                            disabled={isLoading}
                            className="p-1.5 text-text-muted hover:text-text-primary transition-colors hidden sm:block cursor-pointer"
                            title="تقديم 5 ثوانٍ"
                        >
                            <span className="text-[11px] font-mono font-bold">+5ث</span>
                        </button>
                    </div>

                    {/* Right: Dhikr Mode, Speed & Close Controls */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {/* Dhikr / Repetition Button */}
                        <button
                            onClick={() => setIsDhikrModalOpen(true)}
                            className={`p-1.5 sm:p-2 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                                isDhikrActive
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                                    : 'border-border-default text-text-secondary hover:text-primary hover:bg-surface-subtle'
                            }`}
                            title="وضع الذكر والتكرار (تكرار الآيات بعدد محدد)"
                        >
                            <DhikrIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs hidden md:inline font-semibold">
                                {isDhikrActive ? `${repeatAyahTarget === 0 ? '∞' : `${repeatAyahTarget}x`}` : 'ذكر'}
                            </span>
                        </button>

                        {/* Speed Toggle */}
                        {setPlaybackSpeed && (
                            <button
                                onClick={handleCycleSpeed}
                                className="px-2 py-1 rounded-lg border border-border-default text-[11px] sm:text-xs font-mono font-bold text-text-secondary hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                                title="سرعة القراءة"
                            >
                                {playbackSpeed}x
                            </button>
                        )}

                        {/* Close Player */}
                        <button 
                            onClick={onClose} 
                            className="p-1.5 sm:p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                            title="إغلاق المشغل"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reciters Modal */}
            <RecitersModal
                isOpen={isRecitersModalOpen}
                onClose={() => setIsRecitersModalOpen(false)}
            />

            {/* Dhikr / Repetition Modal */}
            {setRepeatAyahTarget && setRepeatPlaylistTarget && setDelaySeconds && (
                <DhikrModal
                    isOpen={isDhikrModalOpen}
                    onClose={() => setIsDhikrModalOpen(false)}
                    repeatAyahTarget={repeatAyahTarget}
                    setRepeatAyahTarget={setRepeatAyahTarget}
                    repeatPlaylistTarget={repeatPlaylistTarget}
                    setRepeatPlaylistTarget={setRepeatPlaylistTarget}
                    delaySeconds={delaySeconds}
                    setDelaySeconds={setDelaySeconds}
                    currentAyahRepeatCount={currentAyahRepeatCount}
                    playlistLength={playlist.length}
                />
            )}
        </div>
    );
};

export default AudioPlayerBar;
