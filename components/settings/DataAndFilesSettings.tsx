import React, { useState } from 'react';
import TadabburGateway from './TadabburGateway';
import ExportFormatSettings from './ExportFormatSettings';
import DataAndStorageSettings from './DataAndStorageSettings';
import { FolderIcon, PaperIcon, TrashIcon, SparklesIcon } from '../icons';

interface DataAndFilesSettingsProps {
    onExportNotebook: () => Promise<string>;
    onImportNotebook: (code: string) => Promise<void>;
    initialSection?: 'tadabbur' | 'export_format' | 'storage';
}

type Section = 'tadabbur' | 'export_format' | 'storage';

const DataAndFilesSettings: React.FC<DataAndFilesSettingsProps> = ({
    onExportNotebook,
    onImportNotebook,
    initialSection = 'tadabbur'
}) => {
    const [activeSection, setActiveSection] = useState<Section>(initialSection);

    const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
        { id: 'tadabbur', label: 'دفتر التدبر', icon: <FolderIcon className="w-4 h-4" /> },
        { id: 'export_format', label: 'قوالب التصدير', icon: <PaperIcon className="w-4 h-4" /> },
        { id: 'storage', label: 'الذاكرة والتخزين', icon: <TrashIcon className="w-4 h-4" /> },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-xl font-bold text-text-primary">البيانات والملفات</h2>
                <p className="text-xs text-text-muted mt-0.5">إدارة ملاحظات التدبر، قوالب تصدير الآيات، وذاكرة التخزين المؤقت.</p>
            </div>

            {/* Sub-sections segmented pills */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border-default rounded-xl w-fit">
                {SECTIONS.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                        <button
                            key={sec.id}
                            type="button"
                            onClick={() => setActiveSection(sec.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isActive
                                    ? 'bg-surface text-primary shadow-xs border border-border-subtle'
                                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
                            }`}
                        >
                            {sec.icon}
                            <span>{sec.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Section content */}
            <div className="pt-2">
                {activeSection === 'tadabbur' && (
                    <TadabburGateway
                        onExportNotebook={onExportNotebook}
                        onImportNotebook={onImportNotebook}
                    />
                )}
                {activeSection === 'export_format' && <ExportFormatSettings />}
                {activeSection === 'storage' && <DataAndStorageSettings />}
            </div>

            {/* AI Status note */}
            <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-1.5 text-text-secondary">
                    <SparklesIcon className="w-4 h-4 text-primary" />
                    <span>المساعد الذكي (Gemini) مهيأ ويعمل تلقائياً عبر الخادم</span>
                </div>
                <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">جاهز</span>
            </div>
        </div>
    );
};

export default DataAndFilesSettings;
