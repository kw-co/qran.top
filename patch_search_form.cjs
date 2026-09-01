const fs = require('fs');
const file = './components/SearchForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add states
const statesBlock = `    const [query, setQuery] = useState(initialQuery);
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
`;
content = content.replace(
    /const \[query, setQuery\] = useState\(initialQuery\);\s+const \[isListening, setIsListening\] = useState\(false\);\s+const \[modalState, setModalState\] = useState<PermissionModalState>\(\{ show: false, type: 'request', title: '', message: '' \}\);\s+const recognitionRef = useRef<any>\(null\);/,
    statesBlock
);

const handleSubmitBlock = `    const handleSubmit = (e: React.FormEvent) => {
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
    };`;

content = content.replace(
    /const handleSubmit = \(e: React.FormEvent\) => \{\s+e.preventDefault\(\);\s+if \(query.trim\(\)\) \{\s+onSearch\(query.trim\(\)\);\s+\}\s+\};/,
    handleSubmitBlock
);

const renderBlock = `            <form onSubmit={handleSubmit} className="flex-grow w-full max-w-xl flex items-center relative">
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
                        <button type="button" onClick={handleVoiceSearch} className={\`p-1 text-text-subtle rounded-full \${isListening ? 'text-red-500 animate-pulse-mic' : 'hover:text-primary'} disabled:opacity-50 disabled:cursor-not-allowed\`} aria-label="بحث صوتي" title="بحث صوتي" disabled={disabled}>
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
            </form>`;

content = content.replace(
    /<form onSubmit=\{handleSubmit\} className="flex-grow w-full max-w-xl flex items-center">[\s\S]*?<\/form>/,
    renderBlock
);

fs.writeFileSync(file, content);
