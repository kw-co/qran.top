import type { FontStyleType, FontSize } from '../types';

export const getQuranTextStyle = (fontStyle: FontStyleType, fontSize: FontSize) => {
    let fontClass = 'imlai-font'; // Default to Imlai

    if (fontStyle === 'uthmani' || fontStyle === 'mushaf') {
        fontClass = 'uthmani-font';
    }
    
    return {
        className: `${fontClass} quran-text-${fontSize}`,
    };
};

