const fs = require('fs');
const file = 'components/FingerprintToolView.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchFormRegex = /<SearchForm[\s\S]*?buttonText="استخراج البصمة"\s*\/>/;

const newFormHtml = `
                <div className="relative w-full">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="اكتب كلمة واحدة لاستخراج بصمتها النورانية..."
                            className="w-full pl-36 pr-12 py-4 bg-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-text-primary text-lg"
                            dir="rtl"
                        />
                        <button
                            type="submit"
                            className="absolute left-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            استخراج البصمة
                        </button>
                    </form>
                    {showDropdown && recentSearches.length > 0 && (
                        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-default rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                            <div className="px-4 py-2 text-sm font-semibold text-text-muted border-b border-border-subtle bg-surface-subtle sticky top-0">
                                عمليات البحث الأخيرة
                            </div>
                            <ul className="py-1">
                                {recentSearches.map((term, i) => (
                                    <li key={i} className="group relative">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectRecent(term)}
                                            className="w-full text-right px-4 py-3 text-base text-text-primary hover:bg-surface-hover hover:text-primary transition-colors flex items-center gap-3 cursor-pointer"
                                        >
                                            <SearchIcon className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                                            <span>{term}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteRecent(e, term)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                            title="حذف من السجل"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>`;

content = content.replace(searchFormRegex, newFormHtml);

// Add hooks for history
const hooksTarget = "const [isRootSearch, setIsRootSearch] = useState(false);";
const hooksAddition = `
    const [isRootSearch, setIsRootSearch] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

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

    const handleSelectRecent = (text: string) => {
        setInputValue(text);
        setQuery(text);
        setShowDropdown(false);
        let newRecent = [text, ...recentSearches.filter(s => s !== text)];
        if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
        setRecentSearches(newRecent);
        try {
            localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
        } catch (err) {}
    };

    const handleDeleteRecent = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        const newRecent = recentSearches.filter(s => s !== text);
        setRecentSearches(newRecent);
        try {
            localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
        } catch (err) {}
    };`;

content = content.replace(hooksTarget, hooksAddition);

// Update handleSearch to save history
const handleSearchTarget = `    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            setQuery(trimmed);
        }
    };`;
    
const handleSearchReplacement = `    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            setQuery(trimmed);
            let newRecent = [trimmed, ...recentSearches.filter(s => s !== trimmed)];
            if (newRecent.length > 10) newRecent = newRecent.slice(0, 10);
            setRecentSearches(newRecent);
            try {
                localStorage.setItem('qran_recent_searches', JSON.stringify(newRecent));
            } catch (err) {}
            setShowDropdown(false);
        }
    };`;
    
content = content.replace(handleSearchTarget, handleSearchReplacement);

fs.writeFileSync(file, content);
console.log("Success");
