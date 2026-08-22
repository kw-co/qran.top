import React, { useState, useEffect } from 'react';
import { openExternalLink } from '../utils/navigation';

const privacyStyles = `
    .qran-top-privacy-body {
        font-family: 'Tajawal', sans-serif;
        background-color: var(--color-background);
        color: var(--color-text-primary);
        line-height: 1.8;
        margin: 0;
        padding: 0;
    }
    .qran-top-privacy-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 2.5rem;
        background-color: var(--color-surface);
        border-radius: 1.5rem;
        border: 1px solid var(--color-border-default);
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .qran-top-privacy-body header {
        border-bottom: 2px solid var(--color-primary);
        padding-bottom: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
    }
    .qran-top-privacy-body h1 {
        color: var(--color-primary-text-strong);
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
    }
    .qran-top-privacy-body h2 {
        color: var(--color-primary-text);
        font-size: 1.6rem;
        font-weight: 700;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--color-border-subtle);
        padding-bottom: 0.5rem;
    }
    .qran-top-privacy-body h3 {
        color: var(--color-text-primary);
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.75rem;
        margin-bottom: 0.75rem;
    }
    .qran-top-privacy-body p, .qran-top-privacy-body li {
        font-size: 1.05rem;
        margin-bottom: 1rem;
        color: var(--color-text-secondary);
    }
    .qran-top-privacy-body ul {
        padding-right: 22px;
    }
    .qran-top-privacy-body strong {
        color: var(--color-text-primary);
    }
    .qran-top-privacy-body a {
        color: var(--color-primary-text);
        text-decoration: none;
        font-weight: 600;
    }
    .qran-top-privacy-body a:hover {
        text-decoration: underline;
    }
    .qran-top-privacy-body footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--color-border-default);
        color: var(--color-text-muted);
    }
    .qran-top-privacy-body .lang-en {
        direction: ltr;
        text-align: left;
        font-family: system-ui, -apple-system, Roboto, sans-serif;
    }
    .qran-top-privacy-body .lang-en ul {
         padding-right: 0;
         padding-left: 22px;
    }
    .qran-top-privacy-body .lang-toggle {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    .qran-top-privacy-body .lang-toggle button {
        background-color: var(--color-surface-hover);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-default);
        padding: 0.5rem 1.25rem;
        border-radius: 9999px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    .qran-top-privacy-body .lang-toggle button.active {
        background-color: var(--color-primary);
        color: #ffffff;
        border-color: var(--color-primary);
    }
`;

const PrivacyPolicyView: React.FC = () => {
    const [lang, setLang] = useState<'ar' | 'en'>('ar');

    useEffect(() => {
        const originalLang = document.documentElement.lang;
        const originalDir = document.documentElement.dir;

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        return () => {
            document.documentElement.lang = originalLang;
            document.documentElement.dir = originalDir;
        };
    }, [lang]);

    const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = '#/';
    };

    return (
        <>
            <style>{privacyStyles}</style>
            <div className="qran-top-privacy-body animate-fade-in">
                <div className="qran-top-privacy-container">
                    <header>
                        <h1 id="header-title">{lang === 'ar' ? 'سياسة الخصوصية لتطبيق QRAN.TOP' : 'Privacy Policy - QRAN.TOP'}</h1>
                        <p id="header-date" className="text-sm mt-2 opacity-80">{lang === 'ar' ? 'آخر تحديث: 22 أغسطس 2026' : 'Last updated: August 22, 2026'}</p>
                    </header>
                    
                    <div className="lang-toggle">
                        <button id="btn-ar" className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>العربية</button>
                        <button id="btn-en" className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
                    </div>

                    <div id="arabic-content" style={{ display: lang === 'ar' ? 'block' : 'none' }}>
                        <section>
                            <h2>مقدمة والتزامنا بالخصوصية</h2>
                            <p>نحن في تطبيق <strong>QRAN.TOP (الباحث في القرآن الكريم)</strong> نلتزم بأعلى معايير الأمان والخصوصية وحفظ سرية بيانات مستخدمينا. تم تصميم التطبيق كمنصة مفتوحة لخدمة كتاب الله دون الحاجة لإنشاء حسابات أو تقديم أي معلومات شخصية أو حساسة.</p>
                        </section>

                        <section>
                            <h2>البيانات المخزنة محلياً على جهازك</h2>
                            <p>يعتمد التطبيق بشكل رئيسي على التخزين المحلي الآمن داخل متصفحك (Local Storage & IndexedDB) لتقديم تجربة فائقة السرعة مع الحفاظ التام على خصوصيتك:</p>
                            <ul>
                                <li><strong>تفضيلات القراءة والمظهر:</strong> تشمل اختيار نوع الخط وحجمه، المظهر (فاتح / داكن / وضع القراءة)، القارئ الصوتي المفضل، والتفاسير والترجمات المحددة.</li>
                                <li><strong>دفتر التدبر والملاحظات:</strong> الآيات المحفوظة، المجموعات المخصصة، والملاحظات والتدبرات الشخصية تحفظ محلياً على جهازك فقط ولا تُرسل إلى أي خادم خارجي.</li>
                                <li><strong>مفتاح الذكاء الاصطناعي (Gemini API Key):</strong> إذا قمت بإدخال مفتاح API الخاص بك لتفعيل الميزات المتقدمة، يُحفظ مشفراً في متصفحك ولا نطلع عليه مطلقاً.</li>
                                <li><strong>خطوط مصحف المدينة والتخزين المؤقت:</strong> يتم تنزيل خطوط المصحف والملفات الأساسية في الذاكرة المحلية المؤقتة لجهازك لتمكين القراءة بدون اتصال بالإنترنت.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>نظام الختمات الجماعية والتفاعلات العامة (مجهولة الهوية)</h2>
                            <p>لتمكين خدمة الختمات القرآنية الجماعية والمشاركة مع الأصدقاء والأهل، يتم التعامل مع بيانات عامة مجهولة الهوية بالكامل عبر خوادم آمنة:</p>
                            <ul>
                                <li><strong>الختمات الجماعية:</strong> يتم تخزين اسم الختمة، الإهداء، موعد الختم، وقائمة الأجزاء المحجوزة والمقروءة دون ربطها بأي بريد إلكتروني أو رقم هاتف أو هوية مستخدم.</li>
                                <li><strong>حجز الأجزاء:</strong> الاسم المسجل عند حجز الجزء هو اسم اختياري يكتبه المشارك بنفسه لتنسيق القراءة في مجموعات المشاركة، ولا يرتبط بأي حساب.</li>
                                <li><strong>النقاشات والتدبر العام:</strong> المشاركات والتعليقات العامة تُحفظ كنصوص عامة مجهولة الهوية.</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2>تقنيات التطبيق التقدمي (PWA & Service Worker)</h2>
                            <p>يستخدم التطبيق تقنية Service Worker لتخزين ملفات العرض والأيقونات محلياً لتسريع التصفح وضمان فتح التطبيق ومتابعة القراءة حتى في حال انقطاع شبكة الإنترنت.</p>
                        </section>

                        <section>
                            <h2>حذف البيانات والتحكم الكامل</h2>
                            <p>يملك المستخدم التحكم الكامل في بياناته المحلية، ويمكنك في أي وقت مسح الذاكرة المؤقتة أو تفريغ دفتر التدبر أو حذف الخطوط المحملة مباشرة عبر شاشة <strong>الإعدادات &larr; البيانات والمساحة</strong>.</p>
                        </section>

                        <section>
                            <h2>التواصل والاستفسار</h2>
                            <p>لأي استفسارات بخصوص سياسة الخصوصية أو التطبيق، نرحب بتواصلكم عبر التلغرام: <a href="https://t.me/aboharon_com" onClick={(e) => openExternalLink(e, "https://t.me/aboharon_com")} target="_blank" rel="noopener noreferrer">t.me/aboharon_com</a> أو الموقع الرسمي <a href="https://aboharon.com" onClick={(e) => openExternalLink(e, "https://aboharon.com")} target="_blank" rel="noopener noreferrer">aboharon.com</a>.</p>
                        </section>
                    </div>
                    
                    <div id="english-content" className="lang-en" style={{ display: lang === 'en' ? 'block' : 'none' }}>
                        <section>
                            <h2>Introduction & Privacy Commitment</h2>
                            <p>At <strong>QRAN.TOP</strong>, we are committed to upholding the highest standards of privacy and data security. The platform is designed to serve readers of the Holy Quran without requiring user accounts or collecting personal identifiable information.</p>
                        </section>

                        <section>
                            <h2>Locally Stored Data</h2>
                            <p>To provide high performance and offline readiness, essential preferences are stored entirely within your browser's local storage (LocalStorage & IndexedDB):</p>
                            <ul>
                                <li><strong>Reading Preferences:</strong> Theme choice (light/dark), font style and sizing, preferred audio reciters, and active tafsirs or translations.</li>
                                <li><strong>Tadabbur Notebook:</strong> Saved verses, custom collections, and personal reflections are stored exclusively on your device.</li>
                                <li><strong>Gemini API Key:</strong> If provided for AI analysis, your API key is encrypted and stored locally only. We never access or transmit it to third parties.</li>
                                <li><strong>Offline Mushaf Fonts & Caches:</strong> Madinah Mushaf font files and offline assets are stored on your device to support offline browsing.</li>
                            </ul>
                        </section>

                        <section>
                            <h2>Anonymous Group Khatmat & Shared Features</h2>
                            <p>To enable collaborative Quran reading and group khatmat, anonymous non-personal data is synchronized securely:</p>
                            <ul>
                                <li><strong>Group Khatmat:</strong> Khatmah titles, dedications, completion targets, and part reservation statuses (1-30) are maintained without user accounts or personal profiles.</li>
                                <li><strong>Part Reservations:</strong> The name entered when reserving a part is entirely voluntary for group coordination and is not tied to any identity.</li>
                                <li><strong>Public Discussions:</strong> Shared reflections and notes are stored anonymously for community benefit.</li>
                            </ul>
                        </section>
                        
                        <section>
                            <h2>Progressive Web App (PWA & Service Worker)</h2>
                            <p>The application employs Service Worker technology to cache static assets and ensure fast, reliable access even under low or no network connectivity.</p>
                        </section>

                        <section>
                            <h2>Data Control & Deletion</h2>
                            <p>You have complete control over all local data and can clear cache, remove downloaded fonts, or reset settings at any time via <strong>Settings &rarr; Data & Storage</strong>.</p>
                        </section>

                        <section>
                            <h2>Contact Us</h2>
                            <p>For questions regarding our privacy practices or feedback, contact us via Telegram at <a href="https://t.me/aboharon_com" onClick={(e) => openExternalLink(e, "https://t.me/aboharon_com")} target="_blank" rel="noopener noreferrer">t.me/aboharon_com</a> or visit <a href="https://aboharon.com" onClick={(e) => openExternalLink(e, "https://aboharon.com")} target="_blank" rel="noopener noreferrer">aboharon.com</a>.</p>
                        </section>
                    </div>

                    <footer>
                        <a href="#/" onClick={handleHomeClick}>العودة إلى التطبيق الرئيسي</a>
                        <p className="mt-2 text-xs opacity-75">&copy; 2026 - <a href="https://aboharon.com" onClick={(e) => openExternalLink(e, "https://aboharon.com")} target="_blank" rel="noopener noreferrer">aboharon.com</a>. جميع الحقوق محفوظة.</p>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicyView;
