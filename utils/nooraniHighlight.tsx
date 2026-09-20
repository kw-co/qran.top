import React from 'react';

/**
 * The 14 Noorani Letters (حروف فواتح السور الـ 14):
 * نص حكيم قاطع له سر / صراط علي حق نمسكه
 * ا (أ, إ, آ, ٱ, ء, ى, dagger alif), ل, م, ص, ر, ك, ه (ة), ي (ئ, ى), ع, ط, س, ح, ق, ن
 */

// Regex to identify if a base letter is Noorani
const NOORANI_BASE_CHARS = new Set([
  'ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', 'ٴ', 'ى', 'ئ', 'ٲ', 'ٳ', 'ٵ',
  'ل',
  'م',
  'ص',
  'ر',
  'ك', 'ک', 'ڪ',
  'ه', 'ە', 'ہ',
  'ي', 'ى', 'ی', 'ئ', 'ۦ', 'ۨ', 'ٸ', 'ے', 'ۓ',
  'ع',
  'ط',
  'س',
  'ح',
  'ق',
  'ن', 'ں', 'ڻ'
]);

// Optional Noorani letter sets: Waw & Taa Marbuta
const WAW_CHARS = new Set(['و', 'ؤ', 'ۥ', 'ۄ', 'ۅ', 'ۆ', 'ۇ', 'ۈ', 'ۉ', 'ۊ', 'ۋ']);
const TAA_MARBUTA_CHARS = new Set(['ة', 'ۃ', 'ۂ']);

// Non-connecting Arabic letters to the left (حروف الانفصال)
const NON_CONNECTING_TO_LEFT = new Set([
  'ا', 'أ', 'إ', 'آ', 'ٱ', 'ء', 'ٴ',
  'د', 'ذ',
  'ر', 'ز',
  'و', 'ؤ',
  'ة'
]);

// Arabic combining marks regex (harakat, tashkeel, tanween, dagger alif, quranic marks)
const COMBINING_MARKS_REGEX = /^[\u064B-\u065F\u0670\u0653\u0654\u0655\u06D6-\u06ED\u0640]+$/;
const IS_COMBINING_CHAR = (ch: string) => /[\u064B-\u065F\u0670\u0653\u0654\u0655\u06D6-\u06ED\u0640]/.test(ch);

export const isNooraniChar = (
  char: string, 
  includeWaw: boolean = false, 
  includeTaaMarbuta: boolean = false
): boolean => {
  if (!char) return false;
  if (NOORANI_BASE_CHARS.has(char)) return true;
  if (includeWaw && WAW_CHARS.has(char)) return true;
  if (includeTaaMarbuta && TAA_MARBUTA_CHARS.has(char)) return true;
  return false;
};

export const isArabicBaseLetter = (char: string): boolean => {
  if (!char) return false;
  return /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06EE-\u06EF]/.test(char);
};

interface LetterCluster {
  baseChar: string;
  fullText: string;
  isNoorani: boolean;
  isLetter: boolean;
}

/**
 * Splits an Arabic word into letter clusters (each base character + its combining harakat)
 */
export const splitIntoClusters = (
  word: string, 
  includeWaw: boolean = false,
  includeTaaMarbuta: boolean = false
): LetterCluster[] => {
  const clusters: LetterCluster[] = [];
  let i = 0;
  
  while (i < word.length) {
    const char = word[i];
    
    // If it's a combining mark without preceding base letter, attach to previous or make isolated
    if (IS_COMBINING_CHAR(char)) {
      if (clusters.length > 0) {
        clusters[clusters.length - 1].fullText += char;
      } else {
        clusters.push({
          baseChar: char,
          fullText: char,
          isNoorani: false,
          isLetter: false
        });
      }
      i++;
      continue;
    }

    const isLetter = isArabicBaseLetter(char);
    const isNoorani = isNooraniChar(char, includeWaw, includeTaaMarbuta);
    let fullText = char;
    i++;

    // Collect all subsequent combining marks for this base char
    while (i < word.length && IS_COMBINING_CHAR(word[i])) {
      fullText += word[i];
      i++;
    }

    clusters.push({
      baseChar: char,
      fullText,
      isNoorani,
      isLetter
    });
  }

  return clusters;
};

/**
 * Checks if a word is 100% composed of Noorani letters
 */
export const isWordPureNoorani = (
  word: string, 
  includeWaw: boolean = false,
  includeTaaMarbuta: boolean = false
): boolean => {
  if (!word || !word.trim()) return false;
  const clusters = splitIntoClusters(word, includeWaw, includeTaaMarbuta);
  const letterClusters = clusters.filter(c => c.isLetter);
  if (letterClusters.length === 0) return false;
  return letterClusters.every(c => c.isNoorani);
};

/**
 * Renders an Arabic word with Noorani letters highlighted according to the current theme.
 * Keeps Arabic cursive joining perfectly connected across span boundaries.
 */
export const renderWordWithNoorani = (
  word: string,
  highlightEnabled: boolean,
  extraClasses: string = 'noorani-letter-highlight',
  includeWaw: boolean = false,
  includeTaaMarbuta: boolean = false
): React.ReactNode => {
  if (!highlightEnabled || !word) {
    return word;
  }

  // Fast path: if the entire word is composed purely of Noorani letters
  if (isWordPureNoorani(word, includeWaw, includeTaaMarbuta)) {
    return <span className={extraClasses}>{word}</span>;
  }

  const clusters = splitIntoClusters(word, includeWaw, includeTaaMarbuta);
  if (clusters.length === 0) return word;

  // Group adjacent clusters with the same Noorani status
  interface GroupedSegment {
    text: string;
    isNoorani: boolean;
    startsConnecting: boolean;
    endsConnecting: boolean;
  }

  const segments: GroupedSegment[] = [];
  let currentSegmentText = '';
  let currentIsNoorani = clusters[0].isNoorani;

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (c.isNoorani === currentIsNoorani) {
      currentSegmentText += c.fullText;
    } else {
      if (currentSegmentText) {
        segments.push({
          text: currentSegmentText,
          isNoorani: currentIsNoorani,
          startsConnecting: false,
          endsConnecting: false
        });
      }
      currentSegmentText = c.fullText;
      currentIsNoorani = c.isNoorani;
    }
  }

  if (currentSegmentText) {
    segments.push({
      text: currentSegmentText,
      isNoorani: currentIsNoorani,
      startsConnecting: false,
      endsConnecting: false
    });
  }

  // Render segments with ZWJ (\u200D) where necessary to ensure seamless ligature/cursive joining
  const ZWJ = '\u200D';

  return (
    <>
      {segments.map((seg, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === segments.length - 1;

        // Check if previous segment ended with a letter that connects to the left
        let needsLeadingZWJ = false;
        if (!isFirst) {
          const prevSeg = segments[idx - 1];
          const lastCharOfPrev = prevSeg.text.replace(/[\u064B-\u065F\u0670\u0653\u0654\u0655\u06D6-\u06ED\u0640]/g, '').slice(-1);
          if (lastCharOfPrev && !NON_CONNECTING_TO_LEFT.has(lastCharOfPrev) && isArabicBaseLetter(lastCharOfPrev)) {
            needsLeadingZWJ = true;
          }
        }

        // Check if this segment ends with a letter that connects to the left
        let needsTrailingZWJ = false;
        if (!isLast) {
          const lastCharOfCurrent = seg.text.replace(/[\u064B-\u065F\u0670\u0653\u0654\u0655\u06D6-\u06ED\u0640]/g, '').slice(-1);
          if (lastCharOfCurrent && !NON_CONNECTING_TO_LEFT.has(lastCharOfCurrent) && isArabicBaseLetter(lastCharOfCurrent)) {
            needsTrailingZWJ = true;
          }
        }

        const displayText = `${needsLeadingZWJ ? ZWJ : ''}${seg.text}${needsTrailingZWJ ? ZWJ : ''}`;

        if (seg.isNoorani) {
          return (
            <span key={idx} className={extraClasses}>
              {displayText}
            </span>
          );
        }
        return <span key={idx}>{displayText}</span>;
      })}
    </>
  );
};
