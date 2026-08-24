import React from 'react';
import { HomeIcon, BookmarkIcon, CogIcon, ShieldCheckIcon, UserCircleIcon, ChartBarIcon, InformationCircleIcon, GooglePlayIcon, BookOpenIcon, CheckIcon } from './icons';
import { openExternalLink } from '../utils/navigation';
import { useSettingsContext } from '../contexts/SettingsContext';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentPath: string;
    // Navigation props
    onNavigate: (path: string) => void;
}

const NavLink: React.FC<{ href: string; icon: React.ReactNode; label: string; onNavigate: (path: string) => void; isActive: boolean }> = ({ href, icon, label, onNavigate, isActive }) => (
    <a
        href={href}
        onClick={(e) => { e.preventDefault(); onNavigate(href); }}
        className={`flex items-center gap-3 p-2.5 rounded-lg text-base transition-colors ${isActive ? 'bg-surface-active text-primary-text-strong font-bold' : 'text-text-secondary hover:bg-surface-hover'}`}
    >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
    </a>
);

const SidePanel: React.FC<SidePanelProps> = ({
    isOpen, onClose, currentPath, onNavigate
}) => {
    const { 
        openDownloadMushafModal, 
        isMushafDownloaded, 
        isDownloadingFonts, 
        fontDownloadProgress 
    } = useSettingsContext();

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Panel */}
            <aside
                className={`fixed top-0 right-0 h-full bg-surface shadow-2xl z-40 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'} overflow-y-auto w-64 max-w-[80vw]`}
                role="dialog"
                aria-modal="true"
                aria-label="القائمة الجانبية"
            >
                <div className="flex flex-col h-full">
                    {/* Content */}
                    <div className="p-4 pt-8">
                        <nav className="space-y-1">
                            <NavLink href="#/" icon={<HomeIcon className="w-5 h-5" />} label="الفهرس" onNavigate={onNavigate} isActive={currentPath === '#/'} />
                            
                            {/* Download / Open Madinah Mushaf Button (Hidden once downloaded) */}
                            {!isMushafDownloaded && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        openDownloadMushafModal();
                                    }}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-base transition-colors text-text-secondary hover:bg-surface-hover hover:text-primary cursor-pointer text-right group"
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpenIcon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                                        <span className="whitespace-nowrap font-medium text-text-primary">تحميل مصحف المدينة</span>
                                    </div>
                                    {isDownloadingFonts ? (
                                        <span className="text-[11px] font-bold text-primary animate-pulse font-mono" dir="ltr">{fontDownloadProgress}%</span>
                                    ) : null}
                                </button>
                            )}

                            <NavLink href="#/khatmah" icon={<BookOpenIcon className="w-5 h-5 text-emerald-500" />} label="الختمة الجماعية" onNavigate={onNavigate} isActive={currentPath.startsWith('#/khatmah') || currentPath.startsWith('#/khatmiyah')} />
                            <NavLink href="#/saved" icon={<BookmarkIcon className="w-5 h-5" />} label="دفتر التدبر" onNavigate={onNavigate} isActive={currentPath.startsWith('#/saved')} />
                            <NavLink href="#/analysis" icon={<ChartBarIcon className="w-5 h-5" />} label="تحليل مفردة" onNavigate={onNavigate} isActive={currentPath.startsWith('#/analysis')} />
                            <NavLink href="#/settings" icon={<CogIcon className="w-5 h-5" />} label="الإعدادات" onNavigate={onNavigate} isActive={currentPath.startsWith('#/settings')} />
                        </nav>
                    </div>
                    
                    {/* Spacer to push content down */}
                    <div className="flex-grow"></div>
                    
                    {/* Footer */}
                    <div className="p-4 border-t border-border-default flex-shrink-0 flex flex-col gap-4">
                         <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => { onClose(); onNavigate('#/about'); }}
                                className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${currentPath.startsWith('#/about') ? 'bg-surface-active text-primary-text-strong' : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'}`}
                                aria-label="عن التطبيق والدليل"
                                title="عن التطبيق والدليل"
                            >
                                <InformationCircleIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => { onClose(); onNavigate('#/privacy-policy'); }}
                                className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${currentPath.startsWith('#/privacy-policy') ? 'bg-surface-active text-primary-text-strong' : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'}`}
                                aria-label="سياسة الخصوصية"
                                title="سياسة الخصوصية"
                            >
                                <ShieldCheckIcon className="w-6 h-6" />
                            </button>
                            <a
                                href="https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1"
                                onClick={(e) => openExternalLink(e, "https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-surface-subtle text-[#22c55e] rounded-full hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                                aria-label="تحميل التطبيق"
                                title="تحميل التطبيق"
                            >
                                <GooglePlayIcon className="w-6 h-6" />
                            </a>
                            <a 
                                href="https://aboharon.com" 
                                onClick={(e) => openExternalLink(e, "https://aboharon.com")}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-surface-subtle text-text-secondary rounded-full hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                                aria-label="موقع المطور"
                                title="موقع المطور"
                            >
                                <UserCircleIcon className="w-6 h-6" />
                            </a>
                        </div>
                        <div className="flex justify-center">
                            <button 
                                onClick={() => window.location.reload()}
                                className="text-xs font-mono text-text-muted hover:text-primary transition-colors cursor-pointer select-none flex items-center gap-2 focus:outline-none active:scale-95 p-1"
                                title="انقر هنا لإعادة تحميل التطبيق وتحديث الإصدار"
                            >
                                <span>v1.0.10</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SidePanel;