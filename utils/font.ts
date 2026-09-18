import type { FontStyleType, FontSize } from '../types';

export const getQuranTextStyle = (fontStyle: FontStyleType, fontSize: FontSize) => {
    // Default to Uthmani since Imlai is removed
    let fontClass = 'uthmani-font';

    return {
        className: `${fontClass} quran-text-${fontSize}`,
    };
};

