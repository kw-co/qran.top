import React, { createContext, useContext } from 'react';
import type { FontSize, FontStyleType, QuranEdition, WordClickBehavior, MushafType, CopyTextFormat, CopyCitationFormat, CopyMultiFormat, MushafFrameStyle } from '../types';

interface SettingsContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    fontStyle: FontStyleType;
    setFontStyle: (style: FontStyleType) => void;
    mushafType: MushafType;
    setMushafType: (type: MushafType) => void;
    mushafFrameStyle: MushafFrameStyle;
    setMushafFrameStyle: (style: MushafFrameStyle) => void;
    activeEditions: QuranEdition[];
    selectedEdition: string;
    setSelectedEdition: (id: string) => void;
    selectedAudioEdition: string;
    setSelectedAudioEdition: (id: string) => void;
    enableTajweed: boolean;
    setEnableTajweed: (enabled: boolean) => void;
    enableWordAudio: boolean;
    setEnableWordAudio: (enabled: boolean) => void;
    wordClickBehavior: WordClickBehavior;
    setWordClickBehavior: (behavior: WordClickBehavior) => void;
    copyTextFormat: CopyTextFormat;
    setCopyTextFormat: (format: CopyTextFormat) => void;
    copyCitationFormat: CopyCitationFormat;
    setCopyCitationFormat: (format: CopyCitationFormat) => void;
    copyMultiFormat: CopyMultiFormat;
    setCopyMultiFormat: (format: CopyMultiFormat) => void;
    enableMorphology: boolean;
    setEnableMorphology: (enabled: boolean) => void;
    showBottomNavBar: boolean;
    setShowBottomNavBar: (show: boolean) => void;
    showMuqattaatInSearch: boolean;
    setShowMuqattaatInSearch: (show: boolean) => void;
    showImlaeiTashkeel: boolean;
    setShowImlaeiTashkeel: (show: boolean) => void;
    displayEdition: QuranEdition;
    fontDownloadProgress: number;
    setFontDownloadProgress: (progress: number) => void;
    isDownloadingFonts: boolean;
    setIsDownloadingFonts: (isDownloading: boolean) => void;
    isMushafDownloaded: boolean;
    checkFonts: () => Promise<boolean>;
    removeMushafFonts: () => Promise<void>;
    cancelFontDownload: () => void;
    startFontDownload: () => Promise<void>;
    isDownloadMushafModalOpen: boolean;
    setIsDownloadMushafModalOpen: (open: boolean) => void;
    openDownloadMushafModal: () => void;
    closeDownloadMushafModal: () => void;
    isResearchModeActive: boolean;
    setIsResearchModeActive: (active: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ value: SettingsContextType, children: React.ReactNode }> = ({ value, children }) => {
    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};