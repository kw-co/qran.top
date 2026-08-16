// --- Levenshtein Distance Helper ---
// Calculates the number of edits (insertions, deletions, or substitutions)
// required to change one string into the other.
export const levenshtein = (s1: string, s2: string): number => {
    const l1 = s1.length;
    const l2 = s2.length;
    if (l1 < l2) { return levenshtein(s2, s1); }
    if (l2 === 0) { return l1; }

    const prev = new Int32Array(l2 + 1);
    const curr = new Int32Array(l2 + 1);

    for (let j = 0; j <= l2; j++) {
        prev[j] = j;
    }

    for (let i = 0; i < l1; i++) {
        curr[0] = i + 1;
        const char1 = s1.charCodeAt(i);
        for (let j = 0; j < l2; j++) {
            const insertions = prev[j + 1] + 1;
            const deletions = curr[j] + 1;
            const substitutions = prev[j] + (char1 !== s2.charCodeAt(j) ? 1 : 0);
            
            let min = insertions;
            if (deletions < min) min = deletions;
            if (substitutions < min) min = substitutions;
            curr[j + 1] = min;
        }
        prev.set(curr);
    }
    return prev[l2];
};