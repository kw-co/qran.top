import type { SavedItem, SurahData } from '../../types';
import { QURAN_INDEX } from '../../quranIndex';

export interface ExportWordOptions {
  pageTitle?: string;
  layoutModel: 'table' | 'ultra-compact' | 'normal' | 'large';
  notesPosition?: 'bottom' | 'side' | 'side-left' | 'side-right' | 'table';
  includeDate: boolean;
  includeTotalCount: boolean;
  includePageTitle: boolean;
  includeBismillah: boolean;
  includeSurahName?: boolean;
  includeAyahNumber?: boolean;
  includeSurahHeader?: boolean; // legacy fallback
  includeNotes: boolean;
  isMonochrome: boolean;
  customTexts?: Record<string, string>;
  customNotes?: Record<string, string>;
}

/**
 * Generates and downloads a native MS Word document (.doc) with complete RTL styling,
 * Quranic Uthmani text, Surah headers, user reflections/notes, and custom verse formatting.
 */
export function generateAndDownloadWordDoc(
  items: SavedItem[],
  options: ExportWordOptions,
  allQuranData?: { [key: string]: SurahData[] } | null
): void {
  // Sort items in Quran order by default
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === 'ayah' && b.type === 'ayah') {
      if (a.surah !== b.surah) return a.surah - b.surah;
      return a.ayah - b.ayah;
    }
    return 0;
  });

  // Resolve options with defaults
  const showSurahName = options.includeSurahName !== undefined ? options.includeSurahName : (options.includeSurahHeader ?? true);
  const showAyahNumber = options.includeAyahNumber !== undefined ? options.includeAyahNumber : (options.includeSurahHeader ?? true);

  // Helper to get authentic Uthmani text or edited custom text
  const getAyahText = (item: SavedItem): string => {
    if (options.customTexts && options.customTexts[item.id]) {
      return options.customTexts[item.id];
    }
    if (item.type === 'ayah' && item.customText) {
      return item.customText;
    }
    if (item.type !== 'ayah') return item.query || '';
    if (allQuranData) {
      const uthmaniData =
        allQuranData['quran-uthmani'] ||
        allQuranData['quran-simple'] ||
        allQuranData['quran-tajweed'];
      if (uthmaniData) {
        const surahObj = uthmaniData.find((s) => s.number === item.surah);
        if (surahObj) {
          const ayahObj = surahObj.ayahs.find((a) => a.numberInSurah === item.ayah);
          if (ayahObj && ayahObj.text) return ayahObj.text;
        }
      }
    }
    return item.text || '';
  };

  const getItemNote = (item: SavedItem): string => {
    if (options.customNotes && options.customNotes[item.id] !== undefined) {
      return options.customNotes[item.id];
    }
    return item.notes || '';
  };

  const getSurahName = (surahNumber: number): string => {
    const surah = QURAN_INDEX.find((s) => s.number === surahNumber);
    return surah ? surah.name : `سورة ${surahNumber}`;
  };

  const isTable = options.layoutModel === 'table';
  const isUltra = options.layoutModel === 'ultra-compact';
  const isLarge = options.layoutModel === 'large';

  const fontSize = isUltra || isTable ? '11pt' : isLarge ? '15pt' : '13pt';
  const quranFontSize = isUltra ? '13.5pt' : isTable ? '13pt' : isLarge ? '20pt' : '16pt';
  const lineHeight = isUltra ? '1.7' : isTable ? '1.5' : isLarge ? '2.4' : '2.0';

  let bodyHtml = '';

  // 1. Header Area (Corner Date + Bismillah + Editable Title without wasted lines)
  const hasHeaderContent = options.includePageTitle || options.includeBismillah || options.includeDate || options.includeTotalCount;
  
  if (hasHeaderContent) {
    bodyHtml += `<div dir="rtl" align="right" style="direction: rtl !important; text-align: right; position: relative; margin-bottom: 12px; border-bottom: 2px solid ${options.isMonochrome ? '#000000' : '#15803d'}; padding-bottom: 8px;">`;
    
    // Top corner metadata (Date & Count floating on the left corner in RTL to save full line)
    if (options.includeDate || options.includeTotalCount) {
      bodyHtml += `
        <div dir="rtl" style="float: left; text-align: left; font-size: 9pt; color: #555555; font-family: 'Arial', sans-serif; line-height: 1.3;">
          ${options.includeDate ? `<div>${new Date().toLocaleDateString('ar-SA')}</div>` : ''}
          ${options.includeTotalCount ? `<div>العدد: ${sortedItems.length}</div>` : ''}
        </div>
      `;
    }

    bodyHtml += `<div dir="rtl" style="text-align: center; direction: rtl;">`;
    
    // Separate Bismillah
    if (options.includeBismillah) {
      bodyHtml += `
        <p dir="rtl" align="center" style="direction: rtl; text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 2px 0; color: ${options.isMonochrome ? '#000000' : '#15803d'}; font-family: 'Amiri Quran', 'Traditional Arabic', serif;">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      `;
    }

    // Editable Page Title
    if (options.includePageTitle) {
      const title = options.pageTitle?.trim() || 'الدفتر';
      bodyHtml += `
        <h1 dir="rtl" align="center" style="direction: rtl; text-align: center; font-size: 16pt; font-weight: bold; margin: 2px 0 0 0; color: #000000; font-family: 'Traditional Arabic', 'Arial', sans-serif;">
          ${title}
        </h1>
      `;
    }

    bodyHtml += `</div><div style="clear: both;"></div></div>`;
  }

  // 2. Document Content based on Layout Model
  if (isTable) {
    // --- TABLE / DHIKR SHEET FORMAT (جدول الأذكار والفوائد) ---
    // User requested: Ayah symbol ۝ instead of long text to keep column as slim as possible
    const firstColHeader = showAyahNumber ? '&#x06DD;' : 'م';

    bodyHtml += `
      <table dir="rtl" align="right" border="1" cellpadding="6" cellspacing="0" style="direction: rtl !important; text-align: right !important; mso-table-dir: bidi; width: 100%; border-collapse: collapse; margin-top: 6px; font-family: 'Traditional Arabic', 'Arial', sans-serif; margin-right: 0; margin-left: auto;">
        <thead>
          <tr dir="rtl" style="background-color: ${options.isMonochrome ? '#f0f0f0' : '#ecfdf5'}; color: ${options.isMonochrome ? '#000000' : '#065f46'}; font-weight: bold; font-size: 11pt;">
            <th dir="rtl" align="center" style="width: 5%; text-align: center !important; direction: rtl; white-space: nowrap; border: 1px solid ${options.isMonochrome ? '#000000' : '#94a3b8'}; font-family: 'Amiri Quran', 'Traditional Arabic', serif; font-size: 13pt;">${firstColHeader}</th>
            <th dir="rtl" align="right" style="width: ${options.includeNotes ? '65%' : '95%'}; text-align: right !important; direction: rtl; border: 1px solid ${options.isMonochrome ? '#000000' : '#94a3b8'};">الآية</th>
            ${options.includeNotes ? `<th dir="rtl" align="right" style="width: 30%; text-align: right !important; direction: rtl; border: 1px solid ${options.isMonochrome ? '#000000' : '#94a3b8'};">الفائدة</th>` : ''}
          </tr>
        </thead>
        <tbody>
    `;

    sortedItems.forEach((item, index) => {
      const ayahText = getAyahText(item);
      const note = getItemNote(item);
      const surahName = item.type === 'ayah' ? getSurahName(item.surah) : '';
      const displayAyahOrIndex = item.type === 'ayah' && showAyahNumber ? item.ayah : index + 1;

      // Badges for Surah Name if enabled
      let surahLabel = '';
      if (item.type === 'ayah' && showSurahName) {
        surahLabel = ` <span dir="rtl" style="font-weight: bold; color: ${options.isMonochrome ? '#000000' : '#15803d'}; font-size: 10.5pt; white-space: nowrap;">[${surahName}]</span>`;
      }

      bodyHtml += `
        <tr dir="rtl" style="page-break-inside: avoid; background-color: ${index % 2 === 0 ? '#ffffff' : (options.isMonochrome ? '#fafafa' : '#f8fafc')};">
          <td dir="rtl" align="center" style="text-align: center !important; font-weight: bold; font-size: 11pt; direction: rtl; white-space: nowrap; width: 5%; border: 1px solid ${options.isMonochrome ? '#000000' : '#cbd5e1'};">
            ${displayAyahOrIndex}
          </td>
          <td dir="rtl" align="right" style="font-family: 'Amiri Quran', 'Traditional Arabic', serif; font-size: ${quranFontSize}; line-height: ${lineHeight}; text-align: right !important; direction: rtl; border: 1px solid ${options.isMonochrome ? '#000000' : '#cbd5e1'};">
            <span dir="rtl">${ayahText}</span>${surahLabel}
          </td>
          ${options.includeNotes ? `
            <td dir="rtl" align="right" style="font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.35; color: #1e293b; text-align: right !important; direction: rtl; border: 1px solid ${options.isMonochrome ? '#000000' : '#cbd5e1'};">
              ${note ? note : '<span style="color: #94a3b8;">—</span>'}
            </td>
          ` : ''}
        </tr>
      `;
    });

    bodyHtml += `</tbody></table>`;
  } else if (isUltra) {
    // --- ULTRA COMPACT MODEL (سرد متصل ومضغوط جداً) ---
    bodyHtml += `<div dir="rtl" align="right" style="direction: rtl !important; text-align: right !important; font-size: ${quranFontSize}; line-height: ${lineHeight}; text-justify: inter-word;">`;
    
    let currentSurah = -1;
    sortedItems.forEach((item) => {
      const ayahText = getAyahText(item);
      const note = getItemNote(item);

      if (item.type === 'ayah') {
        if (showSurahName && item.surah !== currentSurah) {
          currentSurah = item.surah;
          bodyHtml += `
            <div dir="rtl" align="center" style="direction: rtl; background-color: ${options.isMonochrome ? '#f0f0f0' : '#ecfdf5'}; border: 1px solid ${options.isMonochrome ? '#000000' : '#a7f3d0'}; padding: 2px 6px; margin: 8px 0 3px 0; font-size: 11pt; font-weight: bold; text-align: center; color: ${options.isMonochrome ? '#000000' : '#065f46'}; font-family: 'Traditional Arabic', serif;">
              ${getSurahName(item.surah)}
            </div>
          `;
        }
        bodyHtml += `
          <span dir="rtl" style="font-family: 'Amiri Quran', 'Traditional Arabic', 'Amiri', serif;">
            ${ayahText} ${showAyahNumber ? `<b style="color: ${options.isMonochrome ? '#000000' : '#15803d'};">﴿${item.ayah}﴾</b>` : ''} 
          </span>
        `;
        if (options.includeNotes && note && note.trim()) {
          bodyHtml += `
            <div dir="rtl" align="right" style="direction: rtl !important; text-align: right !important; font-size: 9.5pt; font-family: 'Arial', sans-serif; background-color: ${options.isMonochrome ? '#f9f9f9' : '#fffbeb'}; border-right: 3px solid ${options.isMonochrome ? '#000000' : '#d97706'}; padding: 2px 6px; margin: 2px 0 4px 0; line-height: 1.35; color: #222;">
              <b>تدبر:</b> ${note.trim()}
            </div>
          `;
        }
      } else {
        bodyHtml += `
          <div dir="rtl" align="right" style="direction: rtl !important; text-align: right !important; margin: 4px 0; font-family: 'Arial', sans-serif; font-size: 10.5pt;">
            <b>بحث محفوظ:</b> "${item.query}"
            ${options.includeNotes && note ? `<div style="font-size: 9pt; color: #444;">${note}</div>` : ''}
          </div>
        `;
      }
    });
    bodyHtml += `</div>`;
  } else {
    // --- NORMAL / LARGE CARD FORMAT ---
    const isSide = options.notesPosition === 'side' || options.notesPosition === 'side-left' || options.notesPosition === 'side-right';

    sortedItems.forEach((item, index) => {
      const ayahText = getAyahText(item);
      const note = getItemNote(item);
      const surahName = item.type === 'ayah' ? getSurahName(item.surah) : '';

      // Header title string combining separate Surah Name & Ayah Number options
      let headerTitle = '';
      if (item.type === 'ayah') {
        if (showSurahName && showAyahNumber) {
          headerTitle = `${surahName} ﴿الآية ${item.ayah}﴾`;
        } else if (showSurahName) {
          headerTitle = surahName;
        } else if (showAyahNumber) {
          headerTitle = `الآية ${item.ayah}`;
        }
      } else {
        headerTitle = `بحث: "${item.query}"`;
      }

      bodyHtml += `
        <div dir="rtl" align="right" style="direction: rtl !important; text-align: right !important; border: 1px solid ${options.isMonochrome ? '#000000' : '#cbd5e1'}; background-color: ${options.isMonochrome ? '#ffffff' : '#fcfcfc'}; padding: ${isLarge ? '10px 12px' : '6px 10px'}; margin-bottom: ${isLarge ? '12px' : '6px'}; border-radius: 4px; page-break-inside: avoid;">
          ${headerTitle ? `
            <div dir="rtl" style="direction: rtl; font-size: 10.5pt; font-weight: bold; color: ${options.isMonochrome ? '#000000' : '#15803d'}; border-bottom: 1px solid ${options.isMonochrome ? '#000000' : '#e2e8f0'}; padding-bottom: 2px; margin-bottom: 4px;">
              <span>${headerTitle}</span>
              <span style="float: left; color: #777777; font-size: 9pt;">#${index + 1}</span>
            </div>
          ` : ''}
          
          ${isSide && options.includeNotes && note ? `
            <table dir="rtl" align="right" border="0" cellpadding="0" cellspacing="0" style="direction: rtl !important; text-align: right !important; mso-table-dir: bidi; width: 100%; border-collapse: collapse;">
              <tr dir="rtl">
                <td dir="rtl" align="right" style="width: 65%; vertical-align: top; padding-left: 10px; font-family: 'Amiri Quran', 'Traditional Arabic', serif; font-size: ${quranFontSize}; line-height: ${lineHeight}; text-align: right !important; color: #000000;">
                  ${ayahText}
                  ${item.type === 'ayah' && showAyahNumber ? `<span style="font-weight: bold; color: ${options.isMonochrome ? '#000000' : '#15803d'};"> ﴿${item.ayah}﴾</span>` : ''}
                </td>
                <td dir="rtl" align="right" style="width: 35%; vertical-align: top; padding: 4px 8px; background-color: ${options.isMonochrome ? '#f9f9f9' : '#fffbeb'}; border-right: 3px solid ${options.isMonochrome ? '#000000' : '#d97706'}; font-size: 9.5pt; line-height: 1.35; font-family: 'Arial', sans-serif; text-align: right !important;">
                  <span style="font-weight: bold; color: ${options.isMonochrome ? '#000000' : '#92400e'};">الفائدة:</span>
                  <div style="margin-top: 2px; white-space: pre-wrap;">${note}</div>
                </td>
              </tr>
            </table>
          ` : `
            <div dir="rtl" align="right" style="font-family: 'Amiri Quran', 'Traditional Arabic', 'Amiri', serif; font-size: ${quranFontSize}; line-height: ${lineHeight}; text-align: right !important; direction: rtl !important; color: #000000; margin: 3px 0;">
              ${ayahText}
              ${item.type === 'ayah' && showAyahNumber ? `<span style="font-weight: bold; color: ${options.isMonochrome ? '#000000' : '#15803d'};"> ﴿${item.ayah}﴾</span>` : ''}
            </div>
            ${options.includeNotes && note && note.trim() ? `
              <div dir="rtl" align="right" style="margin-top: 4px; padding: 4px 6px; background-color: ${options.isMonochrome ? '#f9f9f9' : '#fffbeb'}; border-right: 3px solid ${options.isMonochrome ? '#000000' : '#d97706'}; font-size: 10pt; line-height: 1.35; color: #222222; font-family: 'Arial', sans-serif; text-align: right !important; direction: rtl !important;">
                <span style="font-weight: bold; color: ${options.isMonochrome ? '#000000' : '#92400e'};">✍️ الفوائد والملاحظات:</span>
                <p dir="rtl" align="right" style="margin: 2px 0 0 0; white-space: pre-wrap; direction: rtl !important; text-align: right !important;">${note}</p>
              </div>
            ` : ''}
          `}
        </div>
      `;
    });
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
    <head>
      <meta charset='utf-8'>
      <title>${options.pageTitle || 'الدفتر'}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
          <w:RTLSupport/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page {
          size: A4 portrait;
          margin: ${isUltra || isTable ? '1.0cm 1.0cm 1.0cm 1.0cm' : '1.5cm 1.5cm 1.5cm 1.5cm'};
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'Traditional Arabic', 'Amiri', 'Arial', sans-serif;
          direction: rtl !important;
          text-align: right !important;
          mso-bidi-direction: rtl;
          mso-bidi-flag: 1;
          mso-bidi-language: AR-SA;
          font-size: ${fontSize};
          background-color: #ffffff;
          color: #000000;
        }
        p, div, h1, h2, h3, h4, span, b, u, i {
          direction: rtl !important;
          text-align: right;
          mso-bidi-direction: rtl;
        }
        table {
          direction: rtl !important;
          text-align: right !important;
          mso-table-dir: bidi;
          margin-right: 0;
          margin-left: auto;
        }
        th, td {
          direction: rtl !important;
          text-align: right;
          mso-bidi-direction: rtl;
        }
        u {
          text-decoration: underline;
        }
        b, strong {
          font-weight: bold;
        }
      </style>
    </head>
    <body dir="rtl">
      ${bodyHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = options.pageTitle?.trim()
    ? `${options.pageTitle.trim().replace(/[\s/\\?%*:|"<>]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`
    : `الدفتر_${new Date().toISOString().slice(0, 10)}.doc`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
