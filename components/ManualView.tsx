import React from 'react';

const manualStyles = `
    .qran-top-manual-body {
        font-family: 'Tajawal', sans-serif;
        background-color: var(--color-background);
        color: var(--color-text-primary);
        line-height: 1.8;
        margin: 0;
        padding: 0;
    }
    .qran-top-manual-container {
        max-width: 900px;
        margin: 2rem auto;
        padding: 2rem;
        background-color: var(--color-surface);
        border-radius: 16px;
        border: 1px solid var(--color-border-default);
        box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .qran-top-manual-body header {
        border-bottom: 2px solid var(--color-primary);
        padding-bottom: 1.5rem;
        margin-bottom: 2rem;
        text-align: center;
    }
    .qran-top-manual-body h1 {
        color: var(--color-primary-text-strong);
        font-size: 2.3rem;
        margin: 0;
    }
    .qran-top-manual-body h2 {
        color: var(--color-primary-text);
        font-size: 1.6rem;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--color-border-subtle);
        padding-bottom: 0.5rem;
    }
    .qran-top-manual-body h3 {
        color: var(--color-text-primary);
        font-size: 1.3rem;
        margin-top: 1.2rem;
        margin-bottom: 0.5rem;
    }
    .qran-top-manual-body p {
        font-size: 1.05rem;
        margin-bottom: 1rem;
        color: var(--color-text-secondary);
    }
    .qran-top-manual-body ul {
        list-style: none;
        padding: 0;
    }
    .qran-top-manual-body li {
        background-color: var(--color-surface-subtle);
        border-right: 4px solid var(--color-primary);
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .qran-top-manual-body .icon-svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        stroke: var(--color-primary-text);
        fill: var(--color-text-muted);
    }
    .qran-top-manual-body .feature-icon {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        stroke: var(--color-primary-text);
    }
    .qran-top-manual-body strong {
        color: var(--color-primary-text-strong);
    }
    .qran-top-manual-body code {
        background-color: var(--color-surface-hover);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 1rem;
    }
    .qran-top-manual-body .note {
        background-color: var(--color-surface-subtle);
        border-right: 4px solid #f59e0b;
        padding: 1rem;
        margin-top: 1.5rem;
        border-radius: 12px;
    }
    .qran-top-manual-body .feature-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 0.25rem;
    }
    .qran-top-manual-body .feature-description {
        font-size: 0.95rem;
        color: var(--color-text-secondary);
    }
    .qran-top-manual-body .sign-symbol {
        font-family: 'Uthman', 'Amiri Quran', serif;
        font-size: 1.8rem;
        color: var(--color-primary);
        background-color: var(--color-surface);
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 2px solid var(--color-border-subtle);
        flex-shrink: 0;
    }
    .qran-top-manual-body footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--color-border-default);
        color: var(--color-text-muted);
    }
    .qran-top-manual-body a {
        color: var(--color-primary-text);
        text-decoration: none;
    }
    .qran-top-manual-body a:hover {
        text-decoration: underline;
    }
`;

const ManualView: React.FC = () => {
    return (
        <>
            <style>{manualStyles}</style>
            <div className="qran-top-manual-body">
                <div className="qran-top-manual-container">
                    <header>
                        <h1>دليل استخدام تطبيق QRAN.TOP</h1>
                        <p>شرح تفصيلي شامل لآلية عمل التطبيق، فلسفته، الختمات الجماعية، وميزاته الأساسية (تحديث 2026).</p>
                    </header>

                    <section id="general-idea">
                        <h2>الفكرة العامة والفلسفة</h2>
                        <p>
                            تطبيق <strong>QRAN.TOP</strong> هو أداة متطورة صُممت لتسهيل تلاوة القرآن الكريم والبحث الدقيق فيه وتعميق تدبر آياته ومشاركة ختماته. يعتمد التطبيق على الدمج بين الدقة التقنية العالية وسهولة الاستخدام السلسة، مستخدماً نسختين معتمدتين:
                        </p>
                        <ul>
                            <li>
                                <div>
                                    <h3 className="feature-title">الرسم العثماني الأصيل</h3>
                                    <p className="feature-description">مطابق لمصحف المدينة المنورة لتجربة قراءة بصرية مريحة مع كافة علامات الضبط والتجويد والوقف المعتمدة.</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h3 className="feature-title">الرسم الإملائي المبسط</h3>
                                    <p className="feature-description">محرك بحث فائق السرعة يدعم البحث بالصوت والكلمات والعبارات والجذور مع إحصائيات دقيقة فورية.</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section id="khatmat-system">
                        <h2>دليل نظام الختمات القرآنية الجماعية</h2>
                        <p>
                            يوفر التطبيق منصة تفاعلية متكاملة للختمات الجماعية لمشاركة قراءة أجزاء القرآن الكريم بين العائلات والأصدقاء:
                        </p>
                        <ul>
                            <li>
                                <div>
                                    <h3 className="feature-title">1. إنشاء الختمة وتخصيصها</h3>
                                    <p className="feature-description">يمكن لأي قارئ إنشاء ختمة جديدة وتحديد عنوانها، والإهداء (لوجه الله، لفقيد، أو لشفاء مريض)، وتحديد موعد إنجاز الختمة.</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h3 className="feature-title">2. حجز الأجزاء وقراءتها</h3>
                                    <p className="feature-description">يظهر جدول الأجزاء الـ 30 بوضوح. ينقر القارئ على أي جزء متاح لتسجيل اسمه وحجزه، ثم يمكنه القراءة مباشرة من المصحف وتأكيد القراءة بضغطة زر واحدة.</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h3 className="feature-title">3. مؤشرات الحجز والإنجاز</h3>
                                    <p className="feature-description">بطاقات وشريط تقدم ذكي يعرض نسبة الحجز (كم جزء تم حجزه) ونسبة الإنجاز (كم جزء تم الانتهاء من قراءته فعلياً).</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h3 className="feature-title">4. المشاركة السريعة الفورية</h3>
                                    <p className="feature-description">أزرار مباشرة تتيح نسخ الرابط، أو إرسال الختمة إلى مجموعات واتساب وتيليجرام مباشرة ليشارك الجميع فوراً.</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <h3 className="feature-title">5. القفل التلقائي ودعاء الختم</h3>
                                    <p className="feature-description">عند بلوغ تاريخ الختمة تُعتبر الأجزاء المحجوزة منجزة وتُقفل التعديلات تلقائياً، ومع اكتمال الختمة تظهر بطاقة دعاء ختم القرآن الكريم المبارك.</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section id="quran-signs">
                        <h2>دليل علامات وضبط المصحف الشريف</h2>
                        <p>يستخدم مصحف المدينة المنورة علامات دقيقة لضبط التلاوة والتجويد والوقف:</p>
                        
                        <h3>أولاً: علامات الوقف</h3>
                        <ul>
                            <li>
                                <div className="sign-symbol">مـ</div>
                                <div>
                                    <h3 className="feature-title">الوقف اللازم</h3>
                                    <p className="feature-description">يلزم الوقف هنا، لأن الوصل قد يغير المعنى ويوهم غير المراد.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">لا</div>
                                <div>
                                    <h3 className="feature-title">الوقف الممنوع</h3>
                                    <p className="feature-description">لا يجوز الوقف هنا إلا لضرورة لانقطاع النفس، ويُعاد ما قبله عند الاستئناف.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">ج</div>
                                <div>
                                    <h3 className="feature-title">الوقف الجائز</h3>
                                    <p className="feature-description">يجوز الوقف ويجوز الوصل بمستوى متساوٍ.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">صلى</div>
                                <div>
                                    <h3 className="feature-title">الوصل أولى</h3>
                                    <p className="feature-description">يجوز الوقف، ولكن الوصل أفضل لإتمام المعنى وتماسكه.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">قلى</div>
                                <div>
                                    <h3 className="feature-title">الوقف أولى</h3>
                                    <p className="feature-description">يجوز الوصل، ولكن الوقف أتم وأولى.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol" style={{fontSize: '1.2rem'}}>∴ ∴</div>
                                <div>
                                    <h3 className="feature-title">وقف التعانق (المراقبة)</h3>
                                    <p className="feature-description">إذا وقفت على أحد الموضعين، فلا تقف على الموضع الآخر.</p>
                                </div>
                            </li>
                        </ul>

                        <h3>ثانياً: علامات ضبط التجويد</h3>
                        <ul>
                            <li>
                                <div className="sign-symbol">~</div>
                                <div>
                                    <h3 className="feature-title">علامة المد</h3>
                                    <p className="feature-description">توضع فوق الحرف للدلالة على مد زائد عن المد الطبيعي (أكثر من حركتين).</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">ۢ</div>
                                <div>
                                    <h3 className="feature-title">الميم الصغيرة (الإقلاب)</h3>
                                    <p className="feature-description">توضع فوق النون الساكنة لتدل على قلب النون إلى ميم مخفاة عند ملاقاتها للباء.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">حـ</div>
                                <div>
                                    <h3 className="feature-title">رأس الخاء (الإظهار)</h3>
                                    <p className="feature-description">توضع فوق الحرف الساكن لتدل على وجوب إظهاره وسكونه التام.</p>
                                </div>
                            </li>
                            <li>
                                <div className="sign-symbol">○</div>
                                <div>
                                    <h3 className="feature-title">الصفر المستدير</h3>
                                    <p className="feature-description">يدل على زيادة الحرف في الرسم وعدم نطقه لا وصلاً ولا وقفاً.</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section id="key-features">
                        <h2>أهم ميزات التطبيق المتقدمة</h2>
                        <ul>
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                                <div>
                                    <h3 className="feature-title">فهرسة وتنقل فوري</h3>
                                    <p className="feature-description">الوصول السريع إلى السور، الأجزاء، الأحزاب، والصفحات المصحفية مع حفظ موضع القراءة تلقائياً.</p>
                                </div>
                            </li>
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
                                <div>
                                    <h3 className="feature-title">الاستماع الصوتي المتقن</h3>
                                    <p className="feature-description">تلاوات خاشعة لعدد كبير من كبار القراء، مع إمكانية تكرار الآية والتشغيل المتواصل والانتقال الآلي.</p>
                                </div>
                            </li>
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                                <div>
                                    <h3 className="feature-title">البحث النصي والصوتي الذكي</h3>
                                    <p className="feature-description">محرك بحث يعالج الهمزات والتشكيل واللواحق، مع تحليل الكلمات المقترحة وجذور المفردات وإحصائيات الورود.</p>
                                </div>
                            </li>
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                                <div>
                                    <h3 className="feature-title">دفتر التدبر والمجموعات</h3>
                                    <p className="feature-description">احفظ آياتك المفضلة، ونظّمها في مجلدات مخصصة، ودوّن تدبراتك الخاصة مع إمكانية التصدير والاستيراد بأمان.</p>
                                </div>
                            </li>
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                                <div>
                                    <h3 className="feature-title">أدوات استكشاف فريدة (رحلة الرقم والمتشابهات)</h3>
                                    <p className="feature-description">استكشف جميع الآيات التي تحمل نفس الرقم في سور القرآن، أو قفز بين تكرارات الكلمة الواحدة في كامل المصحف.</p>
                                </div>
                            </li>
                            <li>
                                <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                                <div>
                                    <h3 className="feature-title">تطبيق تقدمي PWA وتخزين بدون إنترنت</h3>
                                    <p className="feature-description">يعمل على كافة الأجهزة والشاشات مع إمكانية التثبيت والتصفح دون الحاجة لاتصال مستمر بالإنترنت.</p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section id="ai-api-key">
                        <h2>مفتاح الذكاء الاصطناعي (Gemini API)</h2>
                        <p>
                            يتيح التطبيق ميزة التحليل البياني والربط بين الآيات المتشابهة بدعم نماذج الذكاء الاصطناعي. يمكنك استخدام مفتاحك المجاني من Google AI Studio لتفعيل الميزة بأمان تام.
                        </p>
                        <ul>
                            <li>
                                <div>
                                    <strong>1. فتح Google AI Studio:</strong> توجه إلى <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">https://aistudio.google.com/app/apikey</a>.
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>2. إنشاء المفتاح:</strong> سجّل دخولك بحساب Google واضغط على "Create API key".
                                </div>
                            </li>
                            <li>
                                <div>
                                    <strong>3. حفظ المفتاح في التطبيق:</strong> الصق المفتاح في <strong>الإعدادات &larr; الذكاء الاصطناعي</strong>.
                                </div>
                            </li>
                        </ul>
                        <div className="note">
                            <p>
                                <strong>تأكيد الأمان:</strong> يتم حفظ المفتاح مشفراً ومحلياً على جهازك فقط ولا يمر عبر خوادمنا إطلاقاً.
                            </p>
                        </div>
                    </section>

                    <section id="disclaimer-and-sources">
                        <h2>المصادر وإخلاء المسؤولية</h2>
                        <p>
                            نصوص القرآن الكريم مستمدة من واجهات موثوقة ومطابقة لطبعة مجمع الملك فهد لطباعة المصحف الشريف. التسجيلات الصوتية مستضافة عبر شبكات مفتوحة معتمدة (EveryAyah و Islamic Network).
                        </p>
                        <div className="note">
                            <p>
                                <strong>للتواصل والإبلاغ عن أي ملاحظات أو مقترحات:</strong>
                                <br />
                                <a href="https://t.me/aboharon_com" target="_blank" rel="noopener noreferrer">t.me/aboharon_com</a>
                            </p>
                        </div>
                    </section>

                    <footer>
                        <p>جميع الحقوق محفوظة &copy; 2026 - <a href="https://aboharon.com" target="_blank" rel="noopener noreferrer">aboharon.com</a></p>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default ManualView;
