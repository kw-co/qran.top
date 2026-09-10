import { useState, useEffect } from 'react';
import type { ResearchData } from '../data/researchData';
import { useSettingsContext } from '../contexts/SettingsContext';

export const useResearchData = () => {
    const { isResearchModeActive } = useSettingsContext();
    const [researchData, setResearchData] = useState<Record<number, ResearchData> | null>(null);

    useEffect(() => {
        if (isResearchModeActive && !researchData) {
            // Dynamically import the research data only when active
            import('../data/researchData').then((module) => {
                setResearchData(module.researchSurahs);
            }).catch(err => {
                console.error("Failed to load research data:", err);
            });
        }
    }, [isResearchModeActive, researchData]);

    return researchData;
};
