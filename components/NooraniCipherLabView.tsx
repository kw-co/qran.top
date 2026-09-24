import React, { useEffect } from 'react';
import type { SurahData } from '../types';
import NooraniCipherLab from './NooraniCipherLab';
import { ChevronLeftIcon, SparklesIcon } from './icons';

interface NooraniCipherLabViewProps {
    simpleCleanData?: SurahData[];
    onSearch?: (query: string, sourceEdition?: string) => void;
}

export const NooraniCipherLabView: React.FC<NooraniCipherLabViewProps> = ({
    simpleCleanData = [],
    onSearch
}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="container mx-auto p-3 sm:p-6 md:p-8 max-w-6xl text-text-primary min-h-[85vh] space-y-6">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border-default">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <a href="#/structure" className="hover:text-primary transition-colors flex items-center gap-1 font-bold">
                        <span>بنية المصحف الشريف</span>
                    </a>
                    <span className="text-border-default">/</span>
                    <span className="text-text-secondary font-semibold">مختبر التشفير وفك التشفير النوراني</span>
                </div>

                <a
                    href="#/structure"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer shadow-xs"
                >
                    <ChevronLeftIcon className="w-4 h-4 transform rotate-180" />
                    <span>العودة لفهرس البنية</span>
                </a>
            </div>

            {/* Lab Workbench Component */}
            <div className="animate-fade-in">
                <NooraniCipherLab
                    simpleCleanData={simpleCleanData}
                    onSearch={onSearch}
                />
            </div>

            {/* Bottom Navigation */}
            <div className="pt-6 border-t border-border-default/60 flex items-center justify-between flex-wrap gap-4 text-sm">
                <a
                    href="#/structure"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-primary font-bold transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4 transform rotate-180" />
                    <span>فهرس أقسام وبحوث بنية المصحف الشريف</span>
                </a>

                <div className="flex items-center gap-3">
                    <a
                        href="#/noorani-cipher"
                        className="text-xs text-text-secondary hover:text-primary underline transition-colors"
                    >
                        شيفرة الحروف النورانية والجدول التفضيلي ⟵
                    </a>
                    <span className="text-border-default">•</span>
                    <a
                        href="#/word-geometry"
                        className="text-xs text-text-secondary hover:text-primary underline transition-colors"
                    >
                        مركز ثقل المفردة وهندسة السور ⟵
                    </a>
                </div>
            </div>
        </div>
    );
};

export default NooraniCipherLabView;
