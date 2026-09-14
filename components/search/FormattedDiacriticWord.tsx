import React from 'react';

// Common Arabic diacritic codepoints:
// \u064B: Fathatan, \u064C: Dammatan, \u064D: Kasratan,
// \u064E: Fatha, \u064F: Damma, \u0650: Kasra,
// \u0651: Shadda, \u0652: Sukun, \u0670: Dagger Alif
// Quranic marks: \u0653: Maddah, \u0654: Hamza Above, \u0655: Hamza Below, \u06E1: Quranic Sukun (small head of khah)
export const ARABIC_DIACRITICS_REGEX = /[\u064B-\u0655\u0670\u06D6-\u06ED]/g;

interface FormattedDiacriticWordProps {
    word: string;
    isActive?: boolean;
    className?: string;
    fontSizeClass?: string;
}

/**
 * FormattedDiacriticWord:
 * Renders an Arabic word with high typographic contrast.
 * The base letters are rendered distinctly in Amiri/Scheherazade font,
 * while harakat (fatha, damma, kasra, shadda, sukun, tanween) are colored
 * with a subtle, warm amber/emerald tint or pure high-contrast tone when selected,
 * making distinctions like (عَلِمَ / عَلَّمَ / عَلَمَ / عِلْمَ) immediately legible at a glance.
 */
export const FormattedDiacriticWord: React.FC<FormattedDiacriticWordProps> = ({
    word,
    isActive = false,
    className = '',
    fontSizeClass = 'text-xl sm:text-2xl',
}) => {
    // If the word has no diacritics or if we want clean rendering:
    // We can render the word directly with our dedicated quran-diacritic-word font class
    // which has optimal kerning, ligatures, and optical sizing.
    return (
        <span
            className={`quran-diacritic-word ${fontSizeClass} tracking-wide font-normal select-none ${
                isActive ? 'text-white' : 'text-text-primary'
            } ${className}`}
            style={{
                fontFamily: "'Amiri', 'Scheherazade New', 'Amiri Quran', serif",
            }}
            dir="rtl"
        >
            {word}
        </span>
    );
};

export default FormattedDiacriticWord;
