/**
 * Staatsbibliothek zu Berlin (gr.2" Zu 5956) Early Quranic Calligraphy Engine
 * Engineered directly from the user's reference folio (Surah Maryam 19:97–98 & Surah Taha 20:1–5):
 *
 * Authentic Calligraphic Characteristics of Berlin gr.2" Zu 5956:
 * 1. Broad-nib reed pen geometry: thick, bold horizontal baseline ribbon (y = 64) contrasted with
 *    crisp vertical shafts and razor-sharp angled terminals.
 * 2. Isolated Alif (ا): Tall upright shaft with a crisp short foot turning to the RIGHT at the baseline
 *    (ذيل الألف السفلي المتجه لليمين كما في: لدا، اهلكنا، او، ركزا، الرحمن، ما، القران، الا، الارض).
 * 3. Connected Alif (ـا) & Lam (ل): Tall upright parallel shafts rising perpendicular to the thick horizontal baseline.
 * 4. Kaf (ك) & Dal/Dhal (د/ذ): Iconic elongated hairpin parallel-bar form (الكاف والدال المبسوطة الزاوية)
 *    with a sharp left bend and an upper horizontal bar folding back to the right (كما في: تندر، كم، اهلكنا، احد، ركزا، عليك، تذكره).
 * 5. Final Yaa / Alif Maqsura (ى / ي): Signature long horizontal backward-returning tail (الياء الراجعة المبسوطة)
 *    sweeping straight back to the RIGHT underneath the word (كما في: لتشقى، يخشى، العلى، على، استوى).
 * 6. Final Noon (ن) & Raa (ر): Upright tooth above baseline dropping vertically below the baseline with a crisp left hook
 *    (كما في: من، قرن، الرحمن، القران، لمن، ممن).
 * 7. Meem (م), Waw (و), Faa/Qaf (ف/ق): Compact heavy triangular-rounded bead resting directly on the bold baseline
 *    (كما في: قوما، كم، قبلهم، منهم، تسمع، لهم، بسم، الرحمن، الرحيم).
 * 8. Initial/Medial Haa (هـ): Tall double-arched / split-eye tower rising above the baseline (كما في: اهلكنا، قبلهم، هل، لهم، الله).
 * 9. Taa/Zaa (ط/ظ) & Sad/Dad (ص/ض): Bold elongated horizontal oblong loop with a narrow inner slit (كما في: طه، الارض).
 * 10. Lam-Alif (لا): Bold triangular base on the baseline with crossed/V-slanted arms above (كما في: الا، تنزيلا، الارض).
 */

export type HijaziPositionalForm = 'isolated' | 'initial' | 'medial' | 'final';

export type HijaziScriptStyle = 'berlin_5956' | 'hijazi_angular';

const RIGHT_JOINING_ONLY = new Set([
    'ا', 'أ', 'إ', 'آ', 'ٱ',
    'د', 'ذ',
    'ر', 'ز',
    'و', 'ؤ',
    'ة', 'ء',
    'لا'
]);

const ARABIC_LETTERS = new Set([
    'ا', 'أ', 'إ', 'آ', 'ٱ',
    'ب', 'ت', 'ث', 'ٮ',
    'ج', 'ح', 'خ',
    'د', 'ذ',
    'ر', 'ز',
    'س', 'ش',
    'ص', 'ض',
    'ط', 'ظ',
    'ع', 'غ',
    'ف', 'ق', 'ڡ', 'ٯ',
    'ك',
    'ل',
    'م',
    'ن', 'ں',
    'ه', 'ة',
    'و', 'ؤ',
    'ي', 'ى', 'ئ',
    'لا'
]);

export interface GlyphStrokeResult {
    width: number;
    /** Thick horizontal/body strokes (rendered with heavy broad-nib strokeWidth) */
    pathD: string;
    /** Filled calligraphic polygons (for chiseled terminals, Meem/Waw heads, and broad ribbons) */
    fillD?: string;
    /** Short slanted strokes for Nasr ibn Asim i'jam pointing (45° parallel dashes as seen on the folio) */
    ijamStrokesD?: string;
}

function getBaseHijaziLetter(ch: string): { base: string; dotsCount: number; dotsPos: 'above' | 'below' } {
    switch (ch) {
        case 'ا':
        case 'أ':
        case 'إ':
        case 'آ':
        case 'ٱ':
            return { base: 'ا', dotsCount: 0, dotsPos: 'above' };
        case 'ب':
            return { base: 'ب', dotsCount: 1, dotsPos: 'below' };
        case 'ت':
            return { base: 'ب', dotsCount: 2, dotsPos: 'above' };
        case 'ث':
            return { base: 'ب', dotsCount: 3, dotsPos: 'above' };
        case 'ٮ':
            return { base: 'ب', dotsCount: 0, dotsPos: 'below' };
        case 'ج':
            return { base: 'ح', dotsCount: 1, dotsPos: 'below' };
        case 'ح':
            return { base: 'ح', dotsCount: 0, dotsPos: 'above' };
        case 'خ':
            return { base: 'ح', dotsCount: 1, dotsPos: 'above' };
        case 'د':
            return { base: 'د', dotsCount: 0, dotsPos: 'above' };
        case 'ذ':
            return { base: 'د', dotsCount: 1, dotsPos: 'above' };
        case 'ر':
            return { base: 'ر', dotsCount: 0, dotsPos: 'above' };
        case 'ز':
            return { base: 'ر', dotsCount: 1, dotsPos: 'above' };
        case 'س':
            return { base: 'س', dotsCount: 0, dotsPos: 'above' };
        case 'ش':
            return { base: 'س', dotsCount: 3, dotsPos: 'above' };
        case 'ص':
            return { base: 'ص', dotsCount: 0, dotsPos: 'above' };
        case 'ض':
            return { base: 'ص', dotsCount: 1, dotsPos: 'above' };
        case 'ط':
            return { base: 'ط', dotsCount: 0, dotsPos: 'above' };
        case 'ظ':
            return { base: 'ط', dotsCount: 1, dotsPos: 'above' };
        case 'ع':
            return { base: 'ع', dotsCount: 0, dotsPos: 'above' };
        case 'غ':
            return { base: 'ع', dotsCount: 1, dotsPos: 'above' };
        case 'ف':
            return { base: 'ف', dotsCount: 1, dotsPos: 'above' };
        case 'ڡ':
            return { base: 'ف', dotsCount: 0, dotsPos: 'above' };
        case 'ق':
            return { base: 'ق', dotsCount: 2, dotsPos: 'above' };
        case 'ٯ':
            return { base: 'ق', dotsCount: 0, dotsPos: 'above' };
        case 'ك':
            return { base: 'ك', dotsCount: 0, dotsPos: 'above' };
        case 'ل':
            return { base: 'ل', dotsCount: 0, dotsPos: 'above' };
        case 'م':
            return { base: 'م', dotsCount: 0, dotsPos: 'above' };
        case 'ن':
            return { base: 'ن', dotsCount: 1, dotsPos: 'above' };
        case 'ں':
            return { base: 'ن', dotsCount: 0, dotsPos: 'above' };
        case 'ه':
        case 'ة':
            return { base: 'ه', dotsCount: 0, dotsPos: 'above' };
        case 'و':
        case 'ؤ':
            return { base: 'و', dotsCount: 0, dotsPos: 'above' };
        case 'لا':
            return { base: 'لا', dotsCount: 0, dotsPos: 'above' };
        case 'ي':
        case 'ى':
        case 'ئ':
            return { base: 'ي', dotsCount: 2, dotsPos: 'below' };
        default:
            return { base: ch, dotsCount: 0, dotsPos: 'above' };
    }
}

/**
 * Generates short slanted i'jam strokes (شرطات الإعجام المائلة الرفيعة كما في مخطوطة برلين 5956)
 */
function buildIjamStrokes(cx: number, count: number, pos: 'above' | 'below'): string {
    if (count <= 0) return '';
    const baseY = pos === 'above' ? 28 : 78;
    const strokes: string[] = [];
    for (let i = 0; i < count; i++) {
        const offsetX = (i - (count - 1) / 2) * 5.5;
        const x1 = cx + offsetX - 3;
        const y1 = baseY + 3.5;
        const x2 = cx + offsetX + 3;
        const y2 = baseY - 3.5;
        strokes.push(`M ${x1} ${y1} L ${x2} ${y2}`);
    }
    return strokes.join(' ');
}

/**
 * Builds the exact glyph geometry of Staatsbibliothek zu Berlin: gr.2" Zu 5956
 * Baseline is at y = 64.
 */
export function buildHijaziGlyph(
    rawChar: string,
    form: HijaziPositionalForm,
    rightX: number,
    slantOffset: number = 2 // In Berlin 5956, shafts are nearly vertical (0°–4°) with a chiseled top
): GlyphStrokeResult {
    const { base, dotsCount, dotsPos } = getBaseHijaziLetter(rawChar);
    const s = slantOffset * 0.45;

    switch (base) {
        case 'ا': {
            if (form === 'final' || form === 'medial') {
                // Connected Alif (ـا): thick baseline from rightX to shaft, then tall vertical stem up to y=12
                const w = 18;
                const x0 = rightX - w;
                const stemX = x0 + 6;
                const d = `M ${rightX} 64 L ${stemX} 64 L ${stemX + s} 12`;
                return { width: w, pathD: d };
            }
            // Isolated Alif (ا): Tall upright stem + crisp short foot turning RIGHT at the bottom (ذيل الألف لليمين)
            const w = 22;
            const x0 = rightX - w;
            const stemX = x0 + 7;
            const d = `M ${stemX + s} 12 L ${stemX} 61 L ${stemX + 10} 65`;
            return { width: w, pathD: d };
        }

        case 'ب': {
            // Baa / Taa / Thaa: Short crisp vertical tooth + bold horizontal baseline bar
            if (form === 'initial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${x0 + 16} 44 L ${x0 + 16} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 15, dotsCount, dotsPos)
                };
            }
            if (form === 'medial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 11} 64 L ${x0 + 11} 45 L ${x0 + 11} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 11, dotsCount, dotsPos)
                };
            }
            // Final or Isolated: Extended bold flat horizontal bar on baseline with slight upward bevel at left tip
            const w = 46;
            const x0 = rightX - w;
            const startD = form === 'final'
                ? `M ${rightX} 64 L ${x0 + 38} 64 L ${x0 + 38} 45 L ${x0 + 38} 64`
                : `M ${x0 + 40} 44 L ${x0 + 40} 64`;
            const d = `${startD} L ${x0 + 4} 64 L ${x0 + 8} 58`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 24, dotsCount, dotsPos)
            };
        }

        case 'ح': {
            // Jeem / Haa / Khaa in Berlin 5956 (كما في: تحس، احد، الرحمن، الرحيم، يخشى، خلق):
            // A bold wedge/diagonal stroke descending from upper-left to meet the baseline at an acute angle
            if (form === 'initial') {
                const w = 36;
                const x0 = rightX - w;
                const d = `M ${x0 + 10} 45 L ${x0 + 31} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 20, dotsCount, dotsPos)
                };
            }
            if (form === 'medial') {
                // Notice in 'أحد' (line 3), 'تحس' (line 3), 'الرحمن' (line 5), 'يخشى' (line 8):
                // Diagonal wedge cutting across the flat baseline
                const w = 38;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 30} 64 L ${x0 + 11} 45 L ${x0 + 30} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 20, dotsCount, dotsPos)
                };
            }
            // Final or Isolated: Acute diagonal head + descending tail
            const w = 40;
            const x0 = rightX - w;
            const prefix = form === 'final' ? `M ${rightX} 64 L ${x0 + 32} 62 ` : `M ${x0 + 32} 62 `;
            const d = `${prefix}L ${x0 + 10} 44 L ${x0 + 32} 62 L ${x0 + 10} 86`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 22, dotsCount, dotsPos)
            };
        }

        case 'د': {
            // Dal / Dhal in Berlin 5956 (كما في: تندر، لدا، احد، تذكره):
            // Iconic hairpin angular form: flat horizontal base on baseline, rising on the right/left and folding back
            const w = 36;
            const x0 = rightX - w;
            if (form === 'final' || form === 'medial') {
                // Connected Dal (كما في: لدا، احد، تذكره):
                const d = `M ${rightX} 64 L ${x0 + 4} 64 L ${x0 + 28} 45 L ${x0 + 10} 45`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 18, dotsCount, 'above')
                };
            }
            // Isolated Dal (كما في: تندر، تذكره):
            const d = `M ${x0 + 10} 45 L ${x0 + 29} 53 L ${x0 + 6} 64 L ${x0 + 30} 64`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 18, dotsCount, 'above')
            };
        }

        case 'ر': {
            // Raa / Zay in Berlin 5956:
            // In 'الرحمن / الرحيم / انزلنا' it sweeps at a bold diagonal; in 'تندر / تذكره / الارض' it is a compact angular crescent on baseline
            const w = 26;
            const x0 = rightX - w;
            if (form === 'final' || form === 'medial') {
                // Connected Raa (كما في: الرحمن، الرحيم، قرن، ركزا):
                // Rises slightly then sweeps diagonally down-left below baseline
                const d = `M ${rightX} 64 L ${x0 + 20} 64 L ${x0 + 22} 48 L ${x0 + 20} 64 L ${x0 + 3} 79`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 15, dotsCount, 'above')
                };
            }
            // Isolated Raa: compact angular wedge on/below baseline
            const d = `M ${x0 + 20} 46 L ${x0 + 22} 60 L ${x0 + 5} 75`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 14, dotsCount, 'above')
            };
        }

        case 'س': {
            // Seen / Sheen in Berlin 5956 (كما في: تحس، تسمع، بسم، لتشقى، السمو، العرش، استوى):
            // Three compact, rhythmic vertical teeth rising from the bold flat baseline
            if (form === 'initial' || form === 'medial') {
                const w = 38;
                const x0 = rightX - w;
                const start = form === 'medial' ? `M ${rightX} 64 L ${x0 + 32} 64` : `M ${x0 + 32} 64`;
                const d = `${start} L ${x0 + 32} 46 L ${x0 + 32} 64 L ${x0 + 21} 64 L ${x0 + 21} 46 L ${x0 + 21} 64 L ${x0 + 10} 64 L ${x0 + 10} 46 L ${x0 + 10} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 21, dotsCount, 'above')
                };
            }
            // Final / Isolated Seen (كما في: تحس، العرش):
            // Three teeth + vertical drop below baseline with a short left hook (just like final Noon!)
            const w = 44;
            const x0 = rightX - w;
            const start = form === 'final' ? `M ${rightX} 64 L ${x0 + 36} 64` : `M ${x0 + 36} 64`;
            const d = `${start} L ${x0 + 36} 46 L ${x0 + 36} 64 L ${x0 + 25} 64 L ${x0 + 25} 46 L ${x0 + 25} 64 L ${x0 + 14} 64 L ${x0 + 14} 46 L ${x0 + 14} 84 L ${x0 + 4} 84`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 25, dotsCount, 'above')
            };
        }

        case 'ص': {
            // Sad / Dad in Berlin 5956 (كما في: الارض line 9):
            // Bold elongated horizontal oblong rectangle with a narrow slit inside, plus final vertical drop
            if (form === 'initial' || form === 'medial') {
                const w = 48;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 42} 64 L ${x0 + 42} 50 L ${x0 + 14} 50 L ${x0 + 14} 64 L ${x0 + 42} 64 M ${x0 + 14} 64 L ${x0 + 7} 64 L ${x0 + 7} 50 L ${x0 + 7} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 28, dotsCount, 'above')
                };
            }
            const w = 52;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 46} 64 L ${x0 + 46} 50 L ${x0 + 16} 50 L ${x0 + 16} 64 L ${x0 + 46} 64 M ${x0 + 16} 64 L ${x0 + 16} 85 L ${x0 + 6} 85`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 31, dotsCount, 'above')
            };
        }

        case 'ط': {
            // Taa / Zaa in Berlin 5956 (كما في: طه line 6):
            // Bold elongated horizontal oblong loop on baseline + tall vertical shaft on the right-middle
            const w = 48;
            const x0 = rightX - w;
            const tailEnd = (form === 'final' || form === 'isolated') ? `${x0 + 4}` : `${x0}`;
            const d = `M ${rightX} 64 L ${x0 + 42} 64 L ${x0 + 42} 50 L ${x0 + 12} 50 L ${x0 + 12} 64 L ${tailEnd} 64 M ${x0 + 34} 50 L ${x0 + 34 + s} 14`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 26, dotsCount, 'above')
            };
        }

        case 'ع': {
            // 'Ayn / Ghayn in Berlin 5956:
            // Initial (كما في: عليك، العلى، على، العرش): Open right-facing angular C-hook sitting on the bold baseline
            if (form === 'initial') {
                const w = 34;
                const x0 = rightX - w;
                const d = `M ${x0 + 28} 44 L ${x0 + 14} 46 L ${x0 + 10} 64 L ${x0 + 30} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 20, dotsCount, 'above')
                };
            }
            if (form === 'medial') {
                // Medial (كما في: العلى، العرش): Open-top V-trough rising from baseline
                const w = 30;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 22} 64 L ${x0 + 25} 45 L ${x0 + 22} 64 L ${x0 + 11} 64 L ${x0 + 8} 45 L ${x0 + 11} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 16, dotsCount, 'above')
                };
            }
            // Final / Isolated (كما في: تسمع line 4):
            // Open V-head on baseline + vertical drop that sweeps horizontally to the LEFT underneath the line!
            const w = 42;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 30} 64 L ${x0 + 33} 45 L ${x0 + 28} 64 L ${x0 + 18} 64 L ${x0 + 15} 45 L ${x0 + 22} 64 L ${x0 + 22} 88 L ${x0 + 2} 88`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 24, dotsCount, 'above')
            };
        }

        case 'ف':
        case 'ق': {
            // Faa / Qaf in Berlin 5956 (كما في: قوما، قبلهم، قرن، القران، لتشقى، خلق):
            // Compact elevated circular-triangular loop head with a small pin-hole center sitting on the baseline
            if (form === 'initial' || form === 'medial') {
                const w = 30;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 22} 64 L ${x0 + 23} 43 L ${x0 + 10} 43 L ${x0 + 10} 56 L ${x0 + 22} 56 L ${x0 + 22} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 16, dotsCount, 'above')
                };
            }
            if (base === 'ف') {
                const w = 44;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 36} 64 L ${x0 + 36} 43 L ${x0 + 23} 43 L ${x0 + 23} 56 L ${x0 + 36} 56 L ${x0 + 36} 64 L ${x0 + 4} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 30, dotsCount, 'above')
                };
            }
            // Final / Isolated Qaf (كما في: خلق line 9):
            // Loop head + vertical drop below baseline with a left hook (matching Noon/Seen)
            const w = 36;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 28} 64 L ${x0 + 28} 43 L ${x0 + 15} 43 L ${x0 + 15} 56 L ${x0 + 28} 56 L ${x0 + 22} 85 L ${x0 + 10} 85`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 22, dotsCount, 'above')
            };
        }

        case 'ك': {
            // Kaf in Berlin 5956 (كما في: كم، اهلكنا، ركزا، عليك، تذكره):
            // Wide, elongated hairpin parallel-bar Kaf!
            // Long flat horizontal base on baseline, sharp bend at left, folding back to the right with a long upper horizontal bar!
            const w = (form === 'final' || form === 'isolated') ? 54 : 48;
            const x0 = rightX - w;
            const leftEdge = x0 + 6;
            const rightFold = x0 + w - 8;
            const endX = (form === 'final' || form === 'isolated') ? x0 + 4 : x0;
            const d = `M ${rightX} 64 L ${leftEdge} 64 L ${leftEdge + 12} 46 L ${rightFold} 46 M ${leftEdge} 64 L ${endX} 64`;
            return { width: w, pathD: d };
        }

        case 'ل': {
            // Lam in Berlin 5956 (كما في: لدا، اهلكنا، قبلهم، هل، لهم، الله، انزلنا، عليك، القران، لتشقى، العلى، على):
            // Tall vertical shaft rising to y=12 from the thick horizontal baseline
            if (form === 'initial' || form === 'medial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 14} 64 L ${x0 + 14 + s} 12 L ${x0 + 14} 64 L ${x0} 64`;
                return { width: w, pathD: d };
            }
            // Final / Isolated Lam (كما في: هل line 3):
            // Tall vertical shaft dropping slightly below baseline with a short horizontal foot to the left
            const w = 30;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 22} 64 L ${x0 + 22 + s} 12 L ${x0 + 22} 72 L ${x0 + 6} 72`;
            return { width: w, pathD: d };
        }

        case 'م': {
            // Meem in Berlin 5956 (كما في: قوما، كم، قبلهم، من، منهم، تسمع، لهم، بسم، الرحمن، الرحيم، ما، لمن، ممن، السمو):
            // Compact heavy rounded-triangular bead resting right on the baseline;
            // in final position ('كم، قبلهم، منهم، لهم، بسم، الرحيم'), it ends with a crisp short tail on the baseline!
            const w = (form === 'final' || form === 'isolated') ? 32 : 28;
            const x0 = rightX - w;
            const boxR = x0 + w - 5;
            const boxL = boxR - 13;
            const endX = (form === 'final' || form === 'isolated') ? x0 + 3 : x0;
            const d = `M ${rightX} 64 L ${boxR} 64 L ${boxR - 2} 48 L ${boxL + 2} 48 L ${boxL} 64 L ${boxR} 64 M ${boxL} 64 L ${endX} 64`;
            const fillD = `M ${boxR} 64 L ${boxR - 2} 49 L ${boxL + 2} 49 L ${boxL} 64 Z`;
            return { width: w, pathD: d, fillD };
        }

        case 'ن': {
            // Noon in Berlin 5956:
            if (form === 'initial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${x0 + 16} 44 L ${x0 + 16} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 15, dotsCount, 'above')
                };
            }
            if (form === 'medial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 11} 64 L ${x0 + 11} 45 L ${x0 + 11} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 11, dotsCount, 'above')
                };
            }
            // Final / Isolated Noon (كما في: من، قرن، الرحمن، القران، لمن، ممن):
            // Short tooth above baseline (y=46) dropping straight down vertically below baseline (y=86) with a crisp left hook!
            const w = 26;
            const x0 = rightX - w;
            const prefix = form === 'final' ? `M ${rightX} 64 L ${x0 + 18} 64 ` : `M ${x0 + 18} 64 `;
            const d = `${prefix}L ${x0 + 18} 45 L ${x0 + 18} 85 L ${x0 + 7} 85`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 16, dotsCount, 'above')
            };
        }

        case 'ه': {
            // Haa in Berlin 5956:
            // Initial / Medial (كما في: اهلكنا، قبلهم، هل، لهم): Tall upright double-looped / split triangular tower rising to y=32
            if (form === 'initial' || form === 'medial') {
                const w = 32;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 25} 64 L ${x0 + 25} 34 L ${x0 + 11} 46 L ${x0 + 11} 64 L ${x0 + 25} 64 M ${x0 + 25} 50 L ${x0 + 11} 50 M ${x0 + 11} 64 L ${x0} 64`;
                return { width: w, pathD: d };
            }
            // Final / Isolated Haa (كما في: به line 1, طه line 6, الله line 5, تذكره line 8):
            // Crisp closed loop with an upright right post rising to y=38
            const w = 26;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 20} 64 L ${x0 + 20} 38 L ${x0 + 20} 64 L ${x0 + 8} 64 L ${x0 + 8} 48 L ${x0 + 20} 48`;
            return { width: w, pathD: d };
        }

        case 'و': {
            // Waw in Berlin 5956 (كما في: و، قوما، او، السمو، استوى):
            // Heavy rounded-triangular head sitting on the baseline + short crisp horizontal/diagonal foot at baseline
            const w = 28;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 22} 64 L ${x0 + 22} 46 L ${x0 + 10} 46 L ${x0 + 10} 60 L ${x0 + 22} 60 L ${x0 + 20} 70 L ${x0 + 5} 70`;
            const fillD = `M ${x0 + 22} 60 L ${x0 + 22} 47 L ${x0 + 11} 47 L ${x0 + 11} 60 Z`;
            return { width: w, pathD: d, fillD };
        }

        case 'لا': {
            // Lam-Alif in Berlin 5956 (كما في: الا line 7, تنزيلا line 8, الارض line 9):
            // Heavy triangular base on the baseline with two crossing slanted shafts rising to y=14!
            const w = 36;
            const x0 = rightX - w;
            const d = `M ${rightX} 64 L ${x0 + 28} 64 L ${x0 + 10} 64 L ${x0 + 19} 48 Z M ${x0 + 12} 54 L ${x0 + 28} 14 M ${x0 + 26} 54 L ${x0 + 10} 14`;
            const fillD = `M ${x0 + 28} 64 L ${x0 + 10} 64 L ${x0 + 19} 49 Z`;
            return { width: w, pathD: d, fillD };
        }

        case 'ي': {
            if (form === 'initial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${x0 + 16} 44 L ${x0 + 16} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 15, dotsCount, 'below')
                };
            }
            if (form === 'medial') {
                const w = 22;
                const x0 = rightX - w;
                const d = `M ${rightX} 64 L ${x0 + 11} 64 L ${x0 + 11} 45 L ${x0 + 11} 64 L ${x0} 64`;
                return {
                    width: w,
                    pathD: d,
                    ijamStrokesD: buildIjamStrokes(x0 + 11, dotsCount, 'below')
                };
            }
            // Final / Isolated Yaa / Alif Maqsura in Berlin 5956 (كما في: لتشقى، يخشى، العلى، على، استوى):
            // The iconic long, razor-straight horizontal backward-returning tail (الياء الراجعة الممتدة لليمين تحت الكلمة)!
            const w = 36;
            const x0 = rightX - w;
            const start = form === 'final' ? `M ${rightX} 64 L ${x0 + 16} 64` : `M ${x0 + 20} 48 L ${x0 + 16} 64`;
            // Sweeps down to y=76 and shoots far back to the RIGHT (rightX + 52) underneath the preceding letters!
            const d = `${start} L ${x0 + 8} 69 L ${x0 + 14} 76 L ${rightX + 48} 76`;
            return {
                width: w,
                pathD: d,
                ijamStrokesD: buildIjamStrokes(x0 + 18, dotsCount, 'below')
            };
        }

        default: {
            return { width: 16, pathD: '' };
        }
    }
}

/**
 * Tokenizes an Arabic word into glyphs (merging Lam + Alif into the 'لا' ligature)
 * and lays out the connected word in the Berlin gr.2" Zu 5956 calligraphic style.
 */
export function layoutHijaziWord(
    rawWord: string,
    slantOffset: number = 2
): {
    totalWidth: number;
    mainPathD: string;
    fillPathD: string;
    ijamPathD: string;
} {
    const clean = rawWord
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08FF]/g, '')
        .replace(/ٱ/g, 'ا')
        .trim();

    if (!clean) {
        return { totalWidth: 20, mainPathD: '', fillPathD: '', ijamPathD: '' };
    }

    // Merge Lam + Alif into single 'لا' token
    const tokens: string[] = [];
    const chars = Array.from(clean);
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const next = chars[i + 1];
        if (ch === 'ل' && (next === 'ا' || next === 'أ' || next === 'إ' || next === 'آ')) {
            tokens.push('لا');
            i++;
        } else if (ARABIC_LETTERS.has(ch)) {
            tokens.push(ch);
        }
    }

    if (tokens.length === 0) {
        return { totalWidth: 20, mainPathD: '', fillPathD: '', ijamPathD: '' };
    }

    // Determine positional form for each token
    const forms: HijaziPositionalForm[] = tokens.map((tok, idx) => {
        const prev = idx > 0 ? tokens[idx - 1] : null;
        const next = idx < tokens.length - 1 ? tokens[idx + 1] : null;

        const connectsRight = prev !== null && !RIGHT_JOINING_ONLY.has(prev);
        const connectsLeft = next !== null && !RIGHT_JOINING_ONLY.has(tok);

        if (connectsRight && connectsLeft) return 'medial';
        if (!connectsRight && connectsLeft) return 'initial';
        if (connectsRight && !connectsLeft) return 'final';
        return 'isolated';
    });

    // First pass: measure total width
    const glyphMeasures = tokens.map((tok, idx) => buildHijaziGlyph(tok, forms[idx], 0, slantOffset));
    const INTER_DISCONNECTED_GAP = 7;

    // Extra right padding if word ends with returning Yaa (الياء الراجعة) so its rightward tail has room
    const endsWithReturningYaa =
        tokens.length > 0 &&
        (tokens[tokens.length - 1] === 'ي' || tokens[tokens.length - 1] === 'ى' || tokens[tokens.length - 1] === 'ئ');
    const rightPad = endsWithReturningYaa && tokens.length <= 2 ? 32 : 12;

    let totalWidth = rightPad + 10;
    for (let i = 0; i < tokens.length; i++) {
        totalWidth += glyphMeasures[i].width;
        const isLast = i === tokens.length - 1;
        if (!isLast && (forms[i] === 'isolated' || forms[i] === 'final')) {
            totalWidth += INTER_DISCONNECTED_GAP;
        }
    }

    // Second pass: lay out RTL from rightX = totalWidth - rightPad down to left
    let cursorX = totalWidth - rightPad;
    const mainPaths: string[] = [];
    const fillPaths: string[] = [];
    const ijamPaths: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const g = buildHijaziGlyph(tokens[i], forms[i], cursorX, slantOffset);
        if (g.pathD) mainPaths.push(g.pathD);
        if (g.fillD) fillPaths.push(g.fillD);
        if (g.ijamStrokesD) ijamPaths.push(g.ijamStrokesD);
        cursorX -= g.width;
        const isLast = i === tokens.length - 1;
        if (!isLast && (forms[i] === 'isolated' || forms[i] === 'final')) {
            cursorX -= INTER_DISCONNECTED_GAP;
        }
    }

    return {
        totalWidth,
        mainPathD: mainPaths.join(' '),
        fillPathD: fillPaths.join(' '),
        ijamPathD: ijamPaths.join(' ')
    };
}
