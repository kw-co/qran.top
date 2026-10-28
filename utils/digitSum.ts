/**
 * Utilities for Ayah Number Digit Sum (جمع خانات رقم الآية)
 * Allows finding ayahs whose number or digit sum equals a target number
 * (e.g. Target 9 matches 9, 18 (1+8=9), 45 (4+5=9), 54 (5+4=9), 99 (9+9=18->1+8=9))
 */

/**
 * Calculates the single-pass sum of digits for a number
 * e.g., 45 -> 4 + 5 = 9
 */
export const getDigitSum = (num: number): number => {
    return String(Math.abs(num))
        .split('')
        .reduce((sum, d) => sum + parseInt(d, 10), 0);
};

/**
 * Calculates the recursive digital root (جذر المجموع الرقمي)
 * e.g., 99 -> 18 -> 9
 */
export const getDigitalRoot = (num: number): number => {
    let current = Math.abs(num);
    while (current >= 10) {
        current = getDigitSum(current);
    }
    return current;
};

/**
 * Checks whether an ayah number matches a target either directly or via digit sum / digital root
 */
export const matchesDigitSum = (ayahNum: number, target: number): boolean => {
    if (ayahNum === target) return true;
    
    const firstSum = getDigitSum(ayahNum);
    if (firstSum === target) return true;

    // For single-digit targets (1 through 9), also check recursive digital root
    if (target >= 1 && target <= 9) {
        if (firstSum >= 10) {
            const secondSum = getDigitSum(firstSum);
            if (secondSum === target) return true;
        }
    }

    return false;
};

/**
 * Returns a human-friendly formula breakdown showing why an ayah number matched the target
 * e.g., for ayah 45 and target 9 -> "4+5 = 9"
 * e.g., for ayah 99 and target 9 -> "9+9 = 18 ← 1+8 = 9"
 * e.g., for ayah 9 and target 9 -> null (exact match, no explanation needed)
 */
export const getDigitSumBreakdown = (ayahNum: number, target: number): { formula: string; isRoot?: boolean } | null => {
    if (ayahNum === target) return null;

    const digits = String(Math.abs(ayahNum)).split('');
    const firstSum = digits.reduce((sum, d) => sum + parseInt(d, 10), 0);

    if (firstSum === target) {
        return {
            formula: `${digits.join('+')} = ${target}`,
            isRoot: false
        };
    }

    if (target >= 1 && target <= 9 && firstSum >= 10) {
        const secondDigits = String(firstSum).split('');
        const secondSum = secondDigits.reduce((sum, d) => sum + parseInt(d, 10), 0);
        if (secondSum === target) {
            return {
                formula: `${digits.join('+')} = ${firstSum} ⟵ ${secondDigits.join('+')} = ${target}`,
                isRoot: true
            };
        }
    }

    return null;
};

/**
 * Returns all possible ayah numbers in the Quran (up to 286, which is the maximum ayah count in Surah Al-Baqarah)
 * that match the target digit sum.
 */
export const getAllMatchingAyahNumbers = (target: number, maxAyah = 286): number[] => {
    const list: number[] = [];
    for (let i = 1; i <= maxAyah; i++) {
        if (matchesDigitSum(i, target)) {
            list.push(i);
        }
    }
    return list;
};
