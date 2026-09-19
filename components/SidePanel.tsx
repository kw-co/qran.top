import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { HomeIcon, BookmarkIcon, CogIcon, ShieldCheckIcon, UserCircleIcon, ChartBarIcon, InformationCircleIcon, GooglePlayIcon, BookOpenIcon, CheckIcon, LightBulbIcon, SparklesIcon } from './icons';
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

const DownloadAppModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallBrowser = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            alert('لتثبيت التطبيق من المتصفح: \nفي هواتف أندرويد (Chrome): اضغط على القائمة (ثلاث نقاط) ثم "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية".\nفي هواتف آيفون (Safari): اضغط على زر المشاركة ثم "إضافة إلى الصفحة الرئيسية".');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose} dir="rtl">
            <div className="bg-surface border border-border-default rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-border-default flex justify-between items-center bg-surface-subtle">
                    <h3 className="text-xl font-bold text-text-primary">تحميل التطبيق</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary focus:outline-none p-1 rounded-full hover:bg-surface-hover transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <button
                        onClick={() => {
                            window.open('https://play.google.com/store/apps/details?id=com.dev12three.qrantop&pli=1', '_blank');
                            onClose();
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border-default bg-surface-subtle hover:bg-surface-hover transition-colors text-right group"
                    >
                        <div className="p-2 bg-[#22c55e]/10 text-[#22c55e] rounded-full group-hover:scale-110 transition-transform">
                            <GooglePlayIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="font-bold text-text-primary text-lg">جوجل بلاي (Google Play)</div>
                            <div className="text-sm text-text-secondary">تحميل التطبيق لأجهزة الأندرويد</div>
                        </div>
                    </button>
                    
                    <button
                        onClick={handleInstallBrowser}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border-default bg-surface-subtle hover:bg-surface-hover transition-colors text-right group"
                    >
                        <div className="p-2 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-text-primary text-lg">المتصفح (PWA)</div>
                            <div className="text-sm text-text-secondary">تثبيت مباشر وسريع لجميع الأجهزة</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SidePanel: React.FC<SidePanelProps> = ({
    isOpen, onClose, currentPath, onNavigate
}) => {
    const { promptInstall } = usePWAInstall();
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
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
                            <NavLink href="#/saved" icon={<BookmarkIcon className="w-5 h-5" />} label="الدفتر" onNavigate={onNavigate} isActive={currentPath.startsWith('#/saved')} />
                            <NavLink href="#/analysis" icon={<ChartBarIcon className="w-5 h-5" />} label="تحليل مفردة" onNavigate={onNavigate} isActive={currentPath.startsWith('#/analysis')} />
                            <NavLink href="#/settings" icon={<CogIcon className="w-5 h-5" />} label="الإعدادات" onNavigate={onNavigate} isActive={currentPath.startsWith('#/settings')} />

                            {/* PWA Install Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (promptInstall) {
                                        promptInstall();
                                    } else {
                                        alert('لتثبيت التطبيق من المتصفح: \nفي هواتف أندرويد (Chrome): اضغط على القائمة (ثلاث نقاط) ثم "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية".\nفي هواتف آيفون (Safari): اضغط على زر المشاركة ثم "إضافة إلى الصفحة الرئيسية".');
                                    }
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-2.5 rounded-lg text-base transition-colors text-text-secondary hover:bg-surface-hover hover:text-primary cursor-pointer text-right group"
                            >
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="whitespace-nowrap font-medium text-text-primary">تثبيت التطبيق</span>
                                </div>
                            </button>

                            {/* External Links */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-subtle">
                                <a href="https://qran.top/" target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-border-default transition-colors text-emerald-600 dark:text-emerald-400 group" title="الموقع الرئيسي">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 15h17.25M5.625 15v1.5a2.25 2.25 0 002.25 2.25h8.25a2.25 2.25 0 002.25-2.25V15M5.625 15l-1.5-10.5h15.75l-1.5 10.5m-12.75 0h12.75" />
                                    </svg>
                                    <span className="text-[11px] font-bold whitespace-nowrap">الرئيسي</span>
                                </a>
                                <a href="https://qran-top.github.io/" target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-surface-subtle hover:bg-surface-hover border border-border-default transition-colors text-text-secondary hover:text-primary group" title="النسخة الاحتياطية على GitHub">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                    <span className="text-[11px] font-bold whitespace-nowrap">احتياطية</span>
                                </a>
                            </div>
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
                            <button
                                onClick={() => { onClose(); onNavigate('#/structure'); }}
                                className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${currentPath.startsWith('#/structure') ? 'bg-surface-active text-primary-text-strong' : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'}`}
                                aria-label="بنية المصحف الشريف"
                                title="بنية المصحف الشريف"
                            >
                                <LightBulbIcon className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setIsDownloadMenuOpen(true)}
                                className="p-2 bg-surface-subtle text-primary rounded-full hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                                aria-label="تحميل التطبيق"
                                title="تحميل التطبيق"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <button 
                                onClick={() => window.location.reload()}
                                className="text-xs font-mono text-text-muted hover:text-primary transition-colors cursor-pointer select-none flex items-center gap-2 focus:outline-none active:scale-95 p-1"
                                title="انقر هنا لإعادة تحميل التطبيق وتحديث الإصدار"
                            >
                                <span>v1.0.12</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                            <a
                                href="https://aboharon.com"
                                onClick={(e) => openExternalLink(e, "https://aboharon.com")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] tracking-wider font-mono font-medium text-text-muted hover:text-primary transition-colors select-none"
                                title="موقع المطور"
                            >
                                ABOHARON.COM
                            </a>
                        </div>
                    </div>
                </div>
            </aside>
            <DownloadAppModal isOpen={isDownloadMenuOpen} onClose={() => setIsDownloadMenuOpen(false)} />
        </>
    );
};

export default SidePanel;