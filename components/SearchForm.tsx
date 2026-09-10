import React, { useState, useRef } from 'react';
import { MicrophoneIcon, SearchIcon } from './icons';

interface SearchFormProps {
    onSearch: (query: string) => void;
    disabled?: boolean;
    initialQuery?: string;
}

interface PermissionModalState {
    show: boolean;
    type: 'request' | 'denied' | 'unsupported';
    title: string;
    message: string;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, disabled = false, initialQuery = '' }) => {
        const [query, setQuery] = useState(initialQuery);
    const [isListening, setIsListening] = useState(false);
    const [modalState, setModalState] = useState<PermissionModalState>({ show: false, type: 'request', title: '', message: '' });
    const recognitionRef = useRef<any>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem('qran_recent_searches');
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (e) { }
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !(e.target as Element).closest('form')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    React.useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

        const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            let newRecent = [trimmed, ...recentSearches.filter(s => s !== trimmed)];
            if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
            setRecentSearches(newRecent);
            try {
                localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
            } catch (err) {}
            setShowDropdown(false);
            onSearch(trimmed);
        }
    };
    
    const handleSelectRecent = (text: string) => {
        setQuery(text);
        setShowDropdown(false);
        let newRecent = [text, ...recentSearches.filter(s => s !== text)];
        if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
        setRecentSearches(newRecent);
        try {
            localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
        } catch (err) {}
        onSearch(text);
    };

    const handleDeleteRecent = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        const newRecent = recentSearches.filter(s => s !== text);
        setRecentSearches(newRecent);
        try {
            localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
        } catch (err) {}
    };
    
    const playTone = (frequency: number, duration: number) => {
        try {
            const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
            if (!audioCtx) return;

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.error("Web Audio API error:", e);
        }
    };

    const startSpeechRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        playTone(880, 0.15);

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            let transcript = event.results[0][0].transcript;
            transcript = transcript.replace(/[.?!؟,]/g, '').trim();
            setQuery(transcript);
            onSearch(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => {
            playTone(523, 0.2);
            setIsListening(false);
            recognitionRef.current = null;
        };
        
        recognition.start();
    };

    const requestMicrophoneAccess = async () => {
        setModalState({ show: false, type: 'request', title: '', message: '' });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            // Remember that permission was granted
            localStorage.setItem('qran_mic_permission_prompted', 'true');
            startSpeechRecognition();
        } catch (err: any) {
            console.warn("Microphone access declined or unavailable:", err?.name || err);
            localStorage.removeItem('qran_mic_permission_prompted');
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setModalState({
                    show: true,
                    type: 'denied',
                    title: 'اذن الميكروفون حُظر أو تم رفضه',
                    message: 'تم رفض إذن الوصول للميكروفون في المتصفح. لاستخدام البحث الصوتي يُرجى السماح بالوصول للميكروفون من إعدادات المتصفح أو علامة القفل 🔒.'
                });
            } else {
                setModalState({
                    show: true,
                    type: 'denied',
                    title: 'تعذر الاتصال بالميكروفون',
                    message: 'لم يتم العثور على ميكروفون متصل أو حدث خطأ أثناء الوصول إليه.'
                });
            }
        }
    };
    
    const handleVoiceSearch = async () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setModalState({
                show: true,
                type: 'unsupported',
                title: 'خاصية غير مدعومة',
                message: 'عذراً، تقنية التعرف على الصوت غير مدعومة في متصفحك الحالي.'
            });
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        // If user already granted permission before in this browser session, attempt direct request
        const isPrompted = localStorage.getItem('qran_mic_permission_prompted');
        if (isPrompted === 'true') {
            requestMicrophoneAccess();
            return;
        }

        // Show confirmation dialog asking "السماح بالوصول" or "عدم السماح"
        setModalState({
            show: true,
            type: 'request',
            title: 'إذن استخدام الميكروفون',
            message: 'يحتاج التطبيق للوصول إلى الميكروفون لتسهيل عملية البحث عن السور والآيات بصوتك. هل ترغب في السماح بالوصول؟'
        });
    };

    return (
        <>
                        <form onSubmit={handleSubmit} className="flex-grow w-full max-w-xl flex items-center relative">
                <div className="relative w-full">
                    <input
                        id="search-quran-input"
                        name="q"
                        type="search"
                        autoComplete="off"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        placeholder={disabled ? "جاري تحميل بيانات البحث..." : "ابحث عن كلمة، أو أدخل مرجعاً مثل (البقرة ٢٥٥)..."}
                        className="w-full text-base h-10 pl-14 pr-4 bg-surface border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        aria-label="بحث في المصحف الشريف"
                        disabled={disabled}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={handleVoiceSearch} className={`p-1 text-text-subtle rounded-full ${isListening ? 'text-red-500 animate-pulse-mic' : 'hover:text-primary'} disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="بحث صوتي" title="بحث صوتي" disabled={disabled}>
                            <MicrophoneIcon className="w-4 h-4" />
                        </button>
                        <button type="submit" className="p-1 text-text-subtle hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed" aria-label="بحث" disabled={disabled}>
                            <SearchIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {showDropdown && recentSearches.length > 0 && (
                    <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-default rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-semibold text-text-muted border-b border-border-subtle bg-surface-subtle sticky top-0">
                            عمليات البحث الأخيرة
                        </div>
                        <ul className="py-1">
                            {recentSearches.map((s, idx) => (
                                <li 
                                    key={idx}
                                    onMouseDown={(e) => { e.preventDefault(); handleSelectRecent(s); }}
                                    className="px-3 py-2.5 hover:bg-surface-hover cursor-pointer flex items-center justify-between group transition-colors"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <SearchIcon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                                        <span className="text-sm text-text-primary truncate">{s}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => handleDeleteRecent(e, s)}
                                        className="p-1 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="حذف"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </form>

            {/* Custom Permission / Voice Search Modal */}
            {modalState.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" dir="rtl">
                    <div className="bg-surface border border-border-default rounded-2xl p-6 max-w-md w-full shadow-2xl text-right space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                                <MicrophoneIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">{modalState.title}</h3>
                        </div>

                        <p className="text-sm text-text-secondary leading-relaxed">
                            {modalState.message}
                        </p>

                        {modalState.type === 'denied' && (
                            <div className="bg-surface-subtle p-3.5 rounded-xl border border-border-subtle text-xs text-text-muted space-y-2">
                                <div className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                                    💡 طريقة تفعيل إذن الميكروفون:
                                </div>
                                <ul className="list-disc list-inside space-y-1 pr-1 leading-normal">
                                    <li><strong>في المتصفح:</strong> انقر على رمز القفل 🔒 أو إعدادات الشريط بجوار عنوان الموقع (qran.top) ➔ الأذونات ➔ الميكروفون ➔ <b>سماح</b>.</li>
                                    <li><strong>في تطبيق الهاتف:</strong> الإعدادات ➔ التطبيقات ➔ تطبيق القرآن ➔ الأذونات ➔ الميكروفون ➔ <b>سماح</b>.</li>
                                </ul>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            {modalState.type === 'request' && (
                                <>
                                    <button
                                        onClick={requestMicrophoneAccess}
                                        className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                                    >
                                        <MicrophoneIcon className="w-4 h-4" />
                                        <span>السماح بالوصول</span>
                                    </button>
                                    <button
                                        onClick={() => setModalState({ show: false, type: 'request', title: '', message: '' })}
                                        className="px-4 py-2.5 bg-surface-subtle text-text-muted border border-border-default rounded-xl text-sm font-semibold hover:bg-surface-hover hover:text-text-primary active:scale-95 transition-all cursor-pointer"
                                    >
                                        عدم السماح
                                    </button>
                                </>
                            )}

                            {modalState.type === 'denied' && (
                                <>
                                    <button
                                        onClick={requestMicrophoneAccess}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover active:scale-95 transition-all shadow-xs cursor-pointer"
                                    >
                                        إعادة المحاولة
                                    </button>
                                    <button
                                        onClick={() => setModalState({ show: false, type: 'request', title: '', message: '' })}
                                        className="px-4 py-2 bg-surface-subtle text-text-primary border border-border-default rounded-xl text-sm font-semibold hover:bg-surface-hover active:scale-95 transition-all cursor-pointer"
                                    >
                                        إلغاء
                                    </button>
                                </>
                            )}

                            {modalState.type === 'unsupported' && (
                                <button
                                    onClick={() => setModalState({ show: false, type: 'request', title: '', message: '' })}
                                    className="px-4 py-2 bg-surface-subtle text-text-primary border border-border-default rounded-xl text-sm font-semibold hover:bg-surface-hover active:scale-95 transition-all cursor-pointer"
                                >
                                    حسناً، فهمت
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SearchForm;