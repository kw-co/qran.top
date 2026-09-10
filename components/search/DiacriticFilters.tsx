import React from 'react';

interface DiacriticVariant {
    word: string;
    count: number;
}

interface DiacriticFiltersProps {
    variants: DiacriticVariant[];
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    resultsCount: number;
}

const DiacriticFilters: React.FC<DiacriticFiltersProps> = ({ variants, activeFilter, setActiveFilter, resultsCount }) => {
    // If there are less than 2 variants, no need to show the filter, as all results share the same exact spelling.
    if (variants.length < 2) return null;

    const currentFilters = activeFilter.trim() === '' 
        ? [] 
        : activeFilter.split(',').map(s => s.trim()).filter(Boolean);

    const toggleVariant = (word: string) => {
        if (currentFilters.includes(word)) {
            const next = currentFilters.filter(p => p !== word);
            setActiveFilter(next.join(','));
        } else {
            const next = [...currentFilters, word];
            setActiveFilter(next.join(','));
        }
    };

    return (
        <div className="mb-6 pb-4 border-b border-border-default">
            <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-sm font-medium text-text-muted flex-shrink-0">فلتر التشكيل:</span>
                <div className="flex items-center gap-2 flex-wrap">
                    <button 
                        onClick={() => setActiveFilter('')} 
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer ${currentFilters.length === 0 ? 'bg-primary text-white font-semibold' : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                    >
                        كل الحالات ({resultsCount})
                    </button>
                    {variants.map(({ word, count }) => {
                        const isActive = currentFilters.includes(word);
                        return (
                            <button 
                                key={word} 
                                onClick={() => toggleVariant(word)} 
                                className={`px-3 py-1 rounded-full text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer flex items-center gap-1 ${isActive ? 'bg-primary text-white font-semibold shadow-xs' : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                                style={{ fontFamily: 'var(--mushaf-font-family)' }}
                            >
                                {isActive && <span className="text-xs font-bold font-sans">✓</span>}
                                <span className="text-lg">{word}</span>
                                <span className="text-xs opacity-85 font-sans">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(DiacriticFilters);
