import React, { useState, useEffect } from 'react';
import { BookOpenIcon, SpeakerWaveIcon, SunIcon, FolderIcon } from './icons';
import ReadingSettings from './settings/ReadingSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import AudioSettings from './settings/AudioSettings';
import DataAndFilesSettings from './settings/DataAndFilesSettings';

interface SettingsViewProps {
    onExportNotebook: () => Promise<string>;
    onImportNotebook: (code: string) => Promise<void>;
}

type MainTab = 'reading' | 'appearance' | 'audio' | 'data';

const SettingsView: React.FC<SettingsViewProps> = ({ 
    onExportNotebook, onImportNotebook
}) => {
    const [activeTab, setActiveTab] = useState<MainTab>('reading');
    const [initialDataSection, setInitialDataSection] = useState<'tadabbur' | 'export_format' | 'storage'>('tadabbur');
    
    useEffect(() => {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
            const params = new URLSearchParams(hash.substring(queryIndex + 1));
            const tabParam = params.get('tab');
            if (tabParam === 'reading' || tabParam === 'appearance' || tabParam === 'audio') {
                setActiveTab(tabParam);
            } else if (tabParam === 'tadabbur' || tabParam === 'export_format' || tabParam === 'storage' || tabParam === 'api_key') {
                setActiveTab('data');
                if (tabParam === 'tadabbur' || tabParam === 'export_format' || tabParam === 'storage') {
                    setInitialDataSection(tabParam);
                }
            }
        }
    }, [window.location.hash]);

    const TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
        { id: 'reading', label: 'القراءة والمصحف', icon: <BookOpenIcon className="w-4 h-4" /> },
        { id: 'appearance', label: 'المظهر', icon: <SunIcon className="w-4 h-4" /> },
        { id: 'audio', label: 'الصوتيات', icon: <SpeakerWaveIcon className="w-4 h-4" /> },
        { id: 'data', label: 'البيانات والملفات', icon: <FolderIcon className="w-4 h-4" /> },
    ];
    
    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto px-4 py-6">
            {/* Header Title */}
            <div className="mb-5 text-right">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">الإعدادات</h1>
                <p className="text-xs text-text-muted mt-0.5">تخصيص تجربة القراءة، المظهر، الصوت، والبيانات بكل سهولة.</p>
            </div>

            <main className="bg-surface p-4 sm:p-6 rounded-2xl shadow-xs border border-border-default transition-colors duration-300">
                {/* Clean Segmented Tab Navigation */}
                <div className="flex border-b border-border-default mb-6 overflow-x-auto no-scrollbar gap-1.5 pb-2">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-4 py-2 text-xs sm:text-sm font-bold transition-all rounded-xl flex items-center gap-2 cursor-pointer ${
                                    isActive
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/60'
                                }`}
                                aria-current={isActive}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Contents */}
                <div className="min-h-[360px]">
                    {activeTab === 'reading' && <ReadingSettings />}
                    {activeTab === 'appearance' && <AppearanceSettings />}
                    {activeTab === 'audio' && <AudioSettings />}
                    {activeTab === 'data' && (
                        <DataAndFilesSettings 
                            onExportNotebook={onExportNotebook}
                            onImportNotebook={onImportNotebook}
                            initialSection={initialDataSection}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default SettingsView;
