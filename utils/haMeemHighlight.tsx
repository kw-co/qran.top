import React from 'react';

/**
 * Regex that matches the Arabic letters 'ح' (Haa, \u062D) and 'م' (Meem, \u0645)
 * occurring together, allowing for any intervening diacritics, harakat, maddah,
 * superscript alef, or tatweel (kashida), as well as any harakat on the Meem itself.
 */
export const HA_MEEM_REGEX = /([\u062D][\u064B-\u065F\u0670\u0653\u0654\u0640\u06D6-\u06ED]*[\u0645][\u064B-\u065F\u0670\u0653\u0654\u0640\u06D6-\u06ED]*)/g;

export const HA_MEEM_TEST_REGEX = /[\u062D][\u064B-\u065F\u0670\u0653\u0654\u0640\u06D6-\u06ED]*[\u0645]/;

const IS_HA_MEEM_MATCH = /^[\u062D][\u064B-\u065F\u0670\u0653\u0654\u0640\u06D6-\u06ED]*[\u0645][\u064B-\u065F\u0670\u0653\u0654\u0640\u06D6-\u06ED]*$/;

/**
 * Checks if a string contains the letters Haa and Meem together.
 */
export const hasHaMeem = (text: string | undefined): boolean => {
  if (!text) return false;
  return HA_MEEM_TEST_REGEX.test(text);
};

/**
 * Renders a word or string with the sequence 'حم' highlighted in a distinctive, elegant color.
 * Amber (#D97706 / #FBBF24) provides high visual contrast in both light and dark themes
 * without clashing with standard Quranic green accents.
 */
export const renderWordWithHaMeem = (
  word: string,
  highlightEnabled: boolean,
  extraClasses: string = 'text-amber-600 dark:text-amber-400 font-bold transition-colors'
): React.ReactNode => {
  if (!highlightEnabled || !word || !hasHaMeem(word)) {
    return word;
  }

  const parts = word.split(HA_MEEM_REGEX);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (IS_HA_MEEM_MATCH.test(part)) {
          return (
            <span key={index} className={extraClasses}>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};
