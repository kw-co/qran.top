export interface HijaziManuscriptInfo {
    id: string;
    nameAr: string;
    nameEn: string;
    location: string;
    shelfmark: string;
    dating: string;
    c14Dating?: string;
    foliaCount: string;
    linesPerPage: string;
    wordsPerLine: string;
    sampleSurahNumber: number;
    sampleSurahName: string;
    sampleAyahStart: number;
    sampleAyahEnd: number;
    figureRef: string;
    inkAndScript: string;
    verseSeparatorStyle: 'berlin' | 'birmingham' | 'tubingen' | 'london' | 'paris';
    separatorDescription: string;
    keyFindings: string[];
    corpusUrl: string;
}

export interface HijaziInscriptionInfo {
    id: string;
    nameAr: string;
    nameEn: string;
    dateAh: string;
    dateAd: string;
    material: string;
    location: string;
    figureRef: string;
    transcription: string;
    significance: string;
}

export interface HijaziLetterStudy {
    id: string;
    letters: string[];
    titleAr: string;
    titleEn: string;
    inscriptionsReferenced: string[];
    summaryAr: string;
    isolatedFormDesc: string;
    initialFormDesc: string;
    medialFormDesc: string;
    finalFormDesc: string;
    distinguishingFeature: string;
    svgPaths: {
        berlin: string;
        paris: string;
        london: string;
        birmingham: string;
        tubingen: string;
        inscription: string;
    };
}

export const HIJAZI_MANUSCRIPTS: HijaziManuscriptInfo[] = [
    {
        id: 'berlin',
        nameAr: 'مصحف مكتبة برلين الوطنية',
        nameEn: 'Berlin State Library Quran',
        location: 'مكتبة برلين الوطنية - ألمانيا',
        shelfmark: 'Ms. or. fol. 4313 / Staatsbibliothek zu Berlin',
        dating: 'القرن الأول الهجري / السابع الميلادي',
        foliaCount: '423 صفحة',
        linesPerPage: '24 - 25 سطراً في الصفحة',
        wordsPerLine: '7 - 10 كلمات في السطر',
        sampleSurahNumber: 2,
        sampleSurahName: 'سورة البقرة',
        sampleAyahStart: 83,
        sampleAyahEnd: 90,
        figureRef: 'شكل (1) - ص 19',
        inkAndScript: 'كُتبت الكلمات بالحبر الأسود، وضُبطت علامات الشكل بالحبر الأحمر (على طريقة أبي الأسود الدؤلي)، مع وجود تدخلات لاحقة لتوضيح ما طمست معالمه بفعل الزمن.',
        verseSeparatorStyle: 'berlin',
        separatorDescription: 'نقاط دائرية كبيرة بنفس لون مداد الآيات محاطة بدائرة منقوطة غير متصلة بلون مختلف، أو دائرة مفرغة أو لوزية داخل مربع.',
        keyFindings: [
            'يميل إلى كونه منسوخاً من المصحف الذي أرسله عثمان بن عفان رضي الله عنه إلى الشام أو من نسخة منه.',
            'الألف المفردة فيه قائمة مستقيمة وذيلها مدبب يتجه نحو اليمين.',
            'الألف المتصلة قائمة تتصل من ذيلها بما قبلها.'
        ],
        corpusUrl: 'https://corpuscoranicum.de/en/verse-navigator/sura/2/verse/83/manuscripts'
    },
    {
        id: 'birmingham',
        nameAr: 'مصحف جامعة برمنجهام',
        nameEn: 'Birmingham University Quran',
        location: 'مكتبة كادبوري البحثية - جامعة برمنجهام - بريطانيا',
        shelfmark: 'Mingana Islamic Arabic 1572b',
        dating: 'القرن الأول الهجري / السابع الميلادي',
        c14Dating: 'الفحص الإشعاعي للرق يرجع للقرن الأول الهجري',
        foliaCount: 'ورقتان من الرق (ضمن مجموعة منغانا)',
        linesPerPage: '25 سطراً تقريباً',
        wordsPerLine: '7 - 9 كلمات في السطر',
        sampleSurahNumber: 4,
        sampleSurahName: 'سورة النساء',
        sampleAyahStart: 129,
        sampleAyahEnd: 140,
        figureRef: 'شكل (2) - ص 19',
        inkAndScript: 'منسوخ بالخط الحجازي اللين المائل (Italic Soft Hijazi)، ويتطابق في قراءته ومواضع وقفه وعدّ آيه مع قراءة أهل الشام (عبد الله بن عامر اليحصبي الشامي 642-736م).',
        verseSeparatorStyle: 'birmingham',
        separatorDescription: 'دائرة خماسية أو سداسية النقاط، ويمتاز بثلاثة خطوط متموجة أفقية ورأسية بمداد مغاير، وشكل أفقي يشبه شجرة السرو يتفرع منه خطوط صغيرة للفصل بين السور.',
        keyFindings: [
            'يتبع قراءة عبد الله بن عامر الشامي في عدّ الآيات (مثل عدّ الآيات 42-44 من سورة الحج آية واحدة).',
            'الألف المفردة قائمة يميل رأسها إلى اليمين وذيلها مدبب لليمين.',
            'رأس الطاء يُرسم بألف مائلة لليمين بدلاً من الألف القائمة.'
        ],
        corpusUrl: 'https://corpuscoranicum.de/en/verse-navigator/sura/4/verse/129/manuscripts'
    },
    {
        id: 'tubingen',
        nameAr: 'مصحف جامعة توبنجن',
        nameEn: 'Tübingen University Quran',
        location: 'مكتبة جامعة توبنجن - ألمانيا',
        shelfmark: 'Ma VI 165',
        dating: 'النصف الثاني من القرن الأول الهجري',
        c14Dating: '29 - 56 هـ / 649 - 675 م (بنسبة ثقة 95.4%)',
        foliaCount: '77 ورقة (154 صفحة) تمثل نحو 25% من نص المصحف (19.5 × 15.3 سم)',
        linesPerPage: '18 - 21 سطراً في الصفحة',
        wordsPerLine: '6 - 9 كلمات في السطر',
        sampleSurahNumber: 17,
        sampleSurahName: 'سورة الإسراء',
        sampleAyahStart: 57,
        sampleAyahEnd: 64,
        figureRef: 'شكل (3) ص 19، وفاصل سورتي الكهف ومريم ص 15',
        inkAndScript: 'خط حجازي رشيق واضح التطور، مع وجود تشكيل جزئي يجمع أحياناً بين أكثر من قراءة (مثل قراءة نافع وابن عامر وأبي بكر عن عاصم).',
        verseSeparatorStyle: 'tubingen',
        separatorDescription: 'ثلاثة خطوط قصيرة أفقية مرتبة فوق بعضها عند نهاية كل آية، وعلامات تعشير دائرية بالحبر الأحمر والأسود أُقحمت لاحقاً، وزخرفة نباتية متقنة بين السور (كالفاصل بين الكهف ومريم).',
        keyFindings: [
            'أعلن مختبر الكربون المشع (C14) في 10 نوفمبر 2014 أن الرق يعود للفترة بين 29-56 هـ (649-675 م).',
            'تُثبت الدراسة الفنية والخطية أن علامات التعشير أُضيفت لاحقاً لضيق المسافات في أواخر الآيات.',
            'كلمة (عظاماً) و(تنبت) ضُبطت في مواضع على قراءة نافع وفي مواضع أخرى على قراءة ابن عامر وابن كثير.'
        ],
        corpusUrl: 'https://corpuscoranicum.de/en/verse-navigator/sura/17/verse/57/manuscripts'
    },
    {
        id: 'london',
        nameAr: 'مصحف المكتبة البريطانية بلندن',
        nameEn: 'British Library Quran (Or. 2165)',
        location: 'المكتبة البريطانية - لندن - بريطانيا',
        shelfmark: 'Or. 2165',
        dating: 'أواخر القرن الأول الهجري / السابع الميلادي',
        foliaCount: '121 ورقة (تمثل نحو 60% من نص القرآن الكريم)',
        linesPerPage: '22 - 27 سطراً في الصفحة',
        wordsPerLine: '7 - 10 كلمات في السطر',
        sampleSurahNumber: 7,
        sampleSurahName: 'سورة الأعراف',
        sampleAyahStart: 42,
        sampleAyahEnd: 53,
        figureRef: 'شكل (4) - ص 20',
        inkAndScript: 'خُطّ بالخط الحجازي المائل بقلم أكثر سماكة من مصاحف برلين وباريس وبرمنجهام، مع كتابة عناوين السور وعدد آياتها بالحبر الأحمر (أُضيفت في مرحلة لاحقة).',
        verseSeparatorStyle: 'london',
        separatorDescription: 'ثلاث شرطات قصيرة مرتبة في صفين فوق بعضها (6 شرطات)، مع علامات تعشير ملونة، وعلامة تشبه حرف الهاء للدلالة على المائة آية.',
        keyFindings: [
            'نُشر مصوراً عام 2001م ويُرجح أنه منسوخ من مصحف الشام أو نسخة متفرعة عنه.',
            'يخلو من حركات الشكل الأعجمي، لكنه يتضمن شرطات مائلة دقيقة لإعجام بعض الحروف المتشابهة.',
            'الألف المفردة فيه أكثر سماكة مع ميل طفيف في الذيل نحو اليمين.'
        ],
        corpusUrl: 'https://corpuscoranicum.de/en/verse-navigator/sura/7/verse/42/manuscripts'
    },
    {
        id: 'paris',
        nameAr: 'مصحف المكتبة الوطنية بباريس',
        nameEn: 'National Library of Paris Quran (BnF)',
        location: 'المكتبة الوطنية الفرنسية - باريس',
        shelfmark: 'Arabe 328a (Codex Parisino-petropolitanus)',
        dating: 'أواخر القرن الأول الهجري / العصر الأموي',
        foliaCount: '70 قطعة رقّية (بمقاس 24 × 33 سم)',
        linesPerPage: '21 - 28 سطراً في الصفحة',
        wordsPerLine: '7 - 11 كلمة في السطر',
        sampleSurahNumber: 3,
        sampleSurahName: 'سورة آل عمران',
        sampleAyahStart: 13,
        sampleAyahEnd: 24,
        figureRef: 'شكل (5) - ص 20',
        inkAndScript: 'مكتوب بقلم رفيع مسطح على يد ناسخَين اثنين، ويُظهر سمات الخط الحجازي الأصيل المتصل بمصحف الشام.',
        verseSeparatorStyle: 'paris',
        separatorDescription: 'ست نقاط مرتبة في دائرة منتظمة أو غير منتظمة، أو ثلاث نقاط رأسية، أو صفوف من علامات الفتح/الكسر عند رؤوس الآيات، مع ترك سطر فارغ بين السور دون كتابة اسم السورة.',
        keyFindings: [
            'ترك الناسخ سطراً فارغاً بين كل سورة وأخرى دون كتابة اسم السورة، وهو ما يوافق تجرد المصاحف المبكرة.',
            'الألف المتصلة والمفردة تميل قمتها بوضوح نحو اليمين.',
            'في السور التي تزيد عن مائة آية وُضعت علامة خاصة عند رأس المائة.'
        ],
        corpusUrl: 'https://corpuscoranicum.de/en/verse-navigator/sura/3/verse/13/manuscripts'
    }
];

export const HIJAZI_INSCRIPTIONS: HijaziInscriptionInfo[] = [
    {
        id: 'ahnasiya',
        nameAr: 'بردية إهناسيا (أقدم بردية إسلامية مؤرخة)',
        nameEn: 'Papyrus of Ahnasiya (PERF 558)',
        dateAh: '22 هـ (جمادى الأولى)',
        dateAd: '643 م',
        material: 'ورق بردي (Papyrus)',
        location: 'إهناسيا - مصر (محفوظة في المكتبة الوطنية النمساوية - فيينا)',
        figureRef: 'شكل (6) - ص 20',
        transcription: 'بسم الله الرحمن الرحيم هذا ما أخذ عبد اله ابن جبر وأصحبه من الجزر من إهنس... في شهر جمدى الأولى من سنة اثنتين وعشرين',
        significance: 'تُثبت أن الكتابة العربية في صدر الإسلام (قبل جمع عثمان للمصحف بسنوات) كانت تمتلك نظاماً كتابياً راسخاً وإعجاماً لبعض الحروف، وتتطابق أشكال حروفها مع المصاحف الحجازية المبكرة.'
    },
    {
        id: 'zuhair',
        nameAr: 'نقش زهير (أقدم نقش صخري إسلامي مؤرخ)',
        nameEn: 'Inscription of Zuhair (Qa\' al-Mu\'tadil)',
        dateAh: '24 هـ',
        dateAd: '644 - 645 م',
        material: 'نقش صخري على الحجر الرملي',
        location: 'قاع المعتدل - العلا (طريق الحج الشامي بالحجاز)',
        figureRef: 'شكل (7) - ص 20',
        transcription: 'بسم الله أنا زهير كتبت زمن توفي عمر سنة أربع وعشرين',
        significance: 'كُتب في العام الذي توفي فيه أمير المؤمنين عمر بن الخطاب رضي الله عنه وبداية خلافة عثمان رضي الله عنه؛ ويُظهر تطابقاً تاماً في رسم الباء والراء والنون والألف مع المصاحف المخطوطة.'
    },
    {
        id: 'taif-muawiya',
        nameAr: 'نقش سد سيسد بالطائف (نقش معاوية بن أبي سفيان)',
        nameEn: 'Taif Dam Inscription of Mu\'awiya',
        dateAh: '58 هـ',
        dateAd: '678 م',
        material: 'نقش تأسيسي على صخور الجرانيت',
        location: 'سد سيسد - الطائف - الحجاز',
        figureRef: 'شكل (8) - ص 21',
        transcription: 'هذا السد لعبد الله معوية أمير المؤمنين بنه عبد الله بن صخر بإذن الله لسنة ثمن وخمسين اللهم اغفر لعبد الله معوية أمير المؤمنين وثبته وانصره ومتع المؤمنين به كتب عمرو بن حباب',
        significance: 'وثيقة حجرية ملكية مؤرخة في منتصف القرن الأول الهجري تُظهر استقرار قواعد الخط الحجازي وحذف الألف الوسطية (معوية، ثمن، رحمن) تماماً كما في رسم المصحف الشريف.'
    },
    {
        id: 'muhammad-ibrahim',
        nameAr: 'نقش محمد بن إبراهيم',
        nameEn: 'Inscription of Muhammad ibn Ibrahim',
        dateAh: '120 هـ',
        dateAd: '738 م',
        material: 'نقش صخري بالحجاز',
        location: 'الحجاز - الجزيرة العربية',
        figureRef: 'شكل (9) - ص 21',
        transcription: 'اللهم اغفر لمحمد بن إبرهيم بن نافع مولى أبو هريرة كتب سنة عشرين ومئة',
        significance: 'يوضح استمرار خصائص الخط الحجازي والنظام الإملائي المبكر (مثل حذف الألف في إبرهيم، وكتابة مئة) حتى أوائل القرن الثاني الهجري.'
    }
];

export const HIJAZI_LETTERS_ATLAS: HijaziLetterStudy[] = [
    {
        id: 'alif',
        letters: ['ا', 'أ', 'إ', 'آ'],
        titleAr: 'حرف الألف (ا)',
        titleEn: 'The Letter Alif (A)',
        inscriptionsReferenced: ['حران (Harran)', 'الحجري (Al-Hajri)', 'الطائف (Taif)', 'الريان (Al-Rayyan)', 'إهناسيا (Ahnasia)'],
        summaryAr: 'الألف هي العلامة الفارقة الأولى للخط الحجازي؛ حيث يميل رأسها إلى اليمين بخط مستقيم وينعطف ذيلها السفلي (ذنب الألف) بزاوية مدببة نحو اليمين بلا تقوس.',
        isolatedFormDesc: 'تظهر قائمة مستقيمة بذيل مدبب يتجه لليمين في مصحف برلين، وبميل صريح في قمتها نحو اليمين مع ذيل لليمين في مصحفي باريس وبرمنجهام، وأكثر سماكة في مصحف لندن.',
        initialFormDesc: 'لا تتصل الألف بما بعدها، وتأخذ حكم الألف المفردة مع ميل حاد أو متوسط نحو اليمين.',
        medialFormDesc: 'في النقوش قبل الهجرة كانت خطاً مائلاً لليمين بلا ذيل، وفي الثلث الأول من القرن الأول الهجري ظهرت بنهاية تشبه الحربة في أسفلها.',
        finalFormDesc: 'الألف المتصلة بما قبلها تظهر قائمة تتصل من ذيلها بما يسبقها في مصحفي برلين ولندن، وبقمة مائلة لليمين في مصاحف باريس وبرمنجهام وتوبنجن.',
        distinguishingFeature: 'ذيل الألف السفلي يتجه لليمين بزاوية حادة + ميل القمة لليمين + حذف الألف اللينة الوسطية في الرسم (السموت، العلمين).',
        svgPaths: {
            berlin: 'M 48 16 L 46 64 L 62 64',
            paris: 'M 62 16 L 42 64 L 58 64',
            london: 'M 54 16 L 46 64 L 58 64',
            birmingham: 'M 60 16 L 44 64 L 58 64',
            tubingen: 'M 54 16 L 46 64 L 60 64',
            inscription: 'M 60 16 L 44 64'
        }
    },
    {
        id: 'baa',
        letters: ['ب', 'ت', 'ث'],
        titleAr: 'الباء وأختاها (ب، ت، ث)',
        titleEn: 'The Letters Baa, Taa, Thaa',
        inscriptionsReferenced: ['الحجري (Al-Hajri)', 'زهير 24 هـ (Zuhair)', 'إهناسيا 22 هـ (Ahnasia)', 'الطائف 58 هـ (Taif)'],
        summaryAr: 'تُكتب الباء والتاء والثاء بنمط هندسي مستقيم يعتمد على سِنة رأسية قصيرة فوق السطر وامتداد أفقي مسطح تماماً على السطر بدون كأسة مقوسة.',
        isolatedFormDesc: 'خط رأسي قصير يمتد فوق مستوى السطر ثم ينبسط أفقياً نحو اليسار على السطر، وهو ذات الشكل في النقوش الصخرية المبكرة.',
        initialFormDesc: 'سنة رأسية قصيرة مائلة أحياناً نحو اليمين أو اليسار تتصل بما يليها على مستوى السطر.',
        medialFormDesc: 'خط رأسي قصير متصل بما قبله وما بعده، وقد وُضعت عليه شرطات أو نقاط إعجام في بعض المواضع.',
        finalFormDesc: 'شبه مستطيل قاعدته ممتدة أفقياً نحو اليسار بنهاية مدببة بلا تقعر.',
        distinguishingFeature: 'انبساط القاعدة أفقياً بخط مستقيم بنهاية مدببة دون تقويس الكأس، وكتابة تاء التأنيث أحياناً تاءً مفتوحة وأحياناً هاءً.',
        svgPaths: {
            berlin: 'M 74 44 L 72 64 L 20 64 L 26 57',
            paris: 'M 76 44 L 70 64 L 20 64 L 25 58',
            london: 'M 74 44 L 70 64 L 18 64',
            birmingham: 'M 76 45 L 70 64 L 20 64 L 26 58',
            tubingen: 'M 74 44 L 72 64 L 20 64',
            inscription: 'M 74 44 L 74 64 L 20 64'
        }
    },
    {
        id: 'jeem',
        letters: ['ج', 'ح', 'خ'],
        titleAr: 'الجيم وأختاها (ج، ح، خ)',
        titleEn: 'The Letters Jeem, Haa, Khaa',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'الحجري (Al-Hajri)', 'إهناسيا 22 هـ (Ahnasia)', 'صبيح (Sobeih)'],
        summaryAr: 'تتميز الجيم والحاء والخاء في الخط الحجازي بأنها خط مستقيم مائل ينحدر من اليسار إلى اليمين قاطعاً مستوى السطر بزاوية حادة صريحة.',
        isolatedFormDesc: 'رأس مائل مستقيم يقطع السطر بزاوية حادة مع امتداد سفلي مائل كجذر الياء.',
        initialFormDesc: 'خط مستقيم مائل يمتد من أعلى اليسار إلى اليمين ليقطع مستوى السطر بزاوية حادة جداً تشبه المنقار.',
        medialFormDesc: 'خط مائل يقطع خط السطر بزاوية حادة ويمتد قليلاً أسفل مستوى السطر ثم يعود للاتصال بما بعده.',
        finalFormDesc: 'لها صورتان في المصاحف الخمسة: الأولى بخط يقطع السطر بزاوية حادة، والثانية بخط مائل للأعلى مع عرق مستقيم ممتد للأسفل.',
        distinguishingFeature: 'تقاطع رأس الحاء مع السطر بزاوية حادة مستقيمة دون انحناءات خط النسخ المتأخر.',
        svgPaths: {
            berlin: 'M 30 38 L 68 64 L 20 64',
            paris: 'M 28 38 L 70 64 L 20 64',
            london: 'M 32 36 L 68 64 L 20 64',
            birmingham: 'M 28 38 L 70 64 L 22 64',
            tubingen: 'M 30 36 L 68 64 L 20 64',
            inscription: 'M 30 38 L 68 64 L 22 64'
        }
    },
    {
        id: 'dal',
        letters: ['د', 'ذ'],
        titleAr: 'الدال وأختها (د، ذ)',
        titleEn: 'The Letters Dal & Thal',
        inscriptionsReferenced: ['الحجري (Al-Hajri)', 'إهناسيا 22 هـ (Ahnasia)'],
        summaryAr: 'تُكتب الدال والذال على هيئة الكاف المبسوطة المستقيمة لكن بحجم أصغر ودون النزول تحت مستوى السطر.',
        isolatedFormDesc: 'خطان مستقيمان يرتبطان من اليمين بزاوية حادة وتستقر القاعدة تماماً على السطر.',
        initialFormDesc: 'تأتي منفصلة عما بعدها دائماً، مما يميزها عن الكاف التي تتصل بما بعدها.',
        medialFormDesc: 'تتصل بما قبلها وتنفصل عما بعدها، وتتميز عن الكاف بصغر حجمها وعدم اتصالها بالحرف التالي.',
        finalFormDesc: 'مبسوطة قصيرة مستقيمة على السطر دون هبوط تحت خط الكتابة.',
        distinguishingFeature: 'التشابه الشديد مع الكاف الحجازية، ويُفرَّق بينهما بأن الدال أصغر حجماً ولا تتصل بما بعدها أبداً.',
        svgPaths: {
            berlin: 'M 30 42 L 66 50 L 66 64 L 26 64',
            paris: 'M 32 42 L 66 52 L 64 64 L 26 64',
            london: 'M 32 42 L 66 52 L 66 64 L 26 64',
            birmingham: 'M 30 42 L 66 52 L 64 64 L 24 64',
            tubingen: 'M 32 40 L 66 50 L 66 64 L 26 64',
            inscription: 'M 32 42 L 66 50 L 66 64 L 26 64'
        }
    },
    {
        id: 'raa',
        letters: ['ر', 'ز'],
        titleAr: 'الراء وأختها (ر، ز)',
        titleEn: 'The Letters Raa & Zay',
        inscriptionsReferenced: ['الحجري (Al-Hajri)', 'زهير 24 هـ (Zuhair)'],
        summaryAr: 'تُكتب الراء والزاي في حالتي الانفراد والاتصال على شكل خط مائل نحو اليمين ينكسر بزاوية عند مستوى السطر.',
        isolatedFormDesc: 'خط مائل نحو اليمين ينكسر طرفه السفلي عند مستوى السطر.',
        initialFormDesc: 'لا تتصل بما بعدها وتأخذ صورة الراء المفردة.',
        medialFormDesc: 'تتصل بما قبلها وتنتهي بزاوية صغيرة على مستوى السطر.',
        finalFormDesc: 'خط قصير مائل مندمج مع السطر يختلف عن النون التي تمتد عميقاً تحت السطر.',
        distinguishingFeature: 'بقاء الراء قريبة من مستوى السطر مقارنةً بالنون التي تهبط بعمق تحت السطر.',
        svgPaths: {
            berlin: 'M 58 38 L 48 64 L 30 68',
            paris: 'M 60 38 L 48 64 L 28 66',
            london: 'M 60 38 L 48 64 L 28 66',
            birmingham: 'M 58 38 L 48 64 L 28 66',
            tubingen: 'M 56 38 L 48 64 L 30 66',
            inscription: 'M 58 40 L 48 64 L 30 68'
        }
    },
    {
        id: 'seen',
        letters: ['س', 'ش'],
        titleAr: 'السين وأختها (س، ش)',
        titleEn: 'The Letters Seen & Sheen',
        inscriptionsReferenced: ['إهناسيا 22 هـ (Ahnasia)', 'الحجري (Al-Hajri)'],
        summaryAr: 'تُكتب السين والشين بثلاث أسنان رأسية مستقيمة متساوية الطول تماماً فوق السطر، وفي حالة الانتهاء ينزل عرقها عمودياً تحت السطر بدون كأسة مقوسة.',
        isolatedFormDesc: 'ثلاث أسنان متوازية متساوية الارتفاع يتبعها عرق عمودي ينزل تحت مستوى السطر وينعطف أفقياً لليسار.',
        initialFormDesc: 'ثلاث أسنان مستقيمة متساوية الارتفاع تستقر على خط السطر دون عرق.',
        medialFormDesc: 'ثلاث أسنان متساوية وممتدة بانتظام على خط السطر المستقيم.',
        finalFormDesc: 'رأس ذو ثلاث أسنان متساوية مع عرق مستقيم يمتد أسفل السطر ويميل بزاوية لليسار.',
        distinguishingFeature: 'تساوي طول الأسنان الثلاث بدقة هندسية مع عرق قائم الزاوية في حالة التطرف.',
        svgPaths: {
            berlin: 'M 74 45 L 72 64 L 58 64 L 60 45 L 58 64 L 44 64 L 46 45 L 42 86 L 26 84',
            paris: 'M 74 45 L 72 64 L 58 64 L 60 45 L 58 64 L 44 64 L 46 45 L 40 86 L 24 82',
            london: 'M 74 45 L 72 64 L 58 64 L 60 45 L 58 64 L 44 64 L 46 45 L 38 84',
            birmingham: 'M 74 46 L 72 64 L 58 64 L 60 46 L 58 64 L 44 64 L 46 46 L 38 84 L 22 80',
            tubingen: 'M 74 45 L 72 64 L 58 64 L 60 45 L 58 64 L 44 64 L 46 45 L 42 84',
            inscription: 'M 74 46 L 74 64 L 58 64 L 58 46 L 58 64 L 44 64 L 44 46 L 44 84 L 26 84'
        }
    },
    {
        id: 'sad',
        letters: ['ص', 'ض'],
        titleAr: 'الصاد وأختها (ص، ض)',
        titleEn: 'The Letters Sad & Dad',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'إهناسيا 22 هـ (Ahnasia)', 'عريض (Aread)', 'عس (Aas)'],
        summaryAr: 'تُكتب الصاد والضاد على هيئة خطين أفقيين متوازيين ممتدين كالمستطيل؛ الأول على السطر والثاني فوقه، مع عرق قائم كعرق السين في النهاية.',
        isolatedFormDesc: 'مستطيل أفقي مكون من خطين متوازيين مع عرق ينزل عمودياً تحت السطر في نهايته.',
        initialFormDesc: 'خطان أفقيان متوازيان ممتدان على السطر، وفي بعض النماذج مع سنة صغيرة بعدها.',
        medialFormDesc: 'امتداد أفقي واضح بخطين متوازيين يميزها عن الميم والعين.',
        finalFormDesc: 'خطان أفقيان متوازيان ينتهيان بعرق مستقيم للأسفل مماثل لعرق السين.',
        distinguishingFeature: 'استطالة جسم الصاد أفقياً بخطين متوازيين بدلاً من الشكل البيضاوي المقوس.',
        svgPaths: {
            berlin: 'M 42 64 L 74 64 L 74 49 L 42 49 L 42 86 L 26 84',
            paris: 'M 42 64 L 74 64 L 74 49 L 42 49 L 38 86 L 24 82',
            london: 'M 42 64 L 74 64 L 74 49 L 42 49 L 36 84',
            birmingham: 'M 42 64 L 74 64 L 74 49 L 42 49 L 38 84 L 24 80',
            tubingen: 'M 42 64 L 74 64 L 74 49 L 42 49 L 40 84',
            inscription: 'M 42 64 L 74 64 L 74 49 L 42 49 L 42 82 L 24 82'
        }
    },
    {
        id: 'taa',
        letters: ['ط', 'ظ'],
        titleAr: 'الطاء وأختها (ط، ظ)',
        titleEn: 'The Letters Taa & Zaa',
        inscriptionsReferenced: ['العُبيد (El-Abaid)', 'إهناسيا 22 هـ (Ahnasia)', 'الريان (Al-Rayyan)'],
        summaryAr: 'تُكتب الطاء والظاء بنفس جسم الصاد (خطين أفقيين متوازيين) مع ألف قائمة أو مائلة لليمين مركبة فوق طرفها الأيمن.',
        isolatedFormDesc: 'قاعدة مكونة من خطين متوازيين تعلوها ألف قائمة أو مائلة لليمين.',
        initialFormDesc: 'تتصل بما بعدها مباشرة من نهاية قاعدتها الأفقية دون عرق.',
        medialFormDesc: 'تحافظ على استطالتها الأفقية مع الألف المركبة في أولها أو وسطها.',
        finalFormDesc: 'تمتد قاعدتها أفقياً نحو اليسار على السطر مع ميل واضح في ألفها في مصحفي باريس وبرمنجهام.',
        distinguishingFeature: 'ميل ألف الطاء نحو اليمين في مصحفي باريس وبرمنجهام، واستقامتها في برلين وتوبنجن.',
        svgPaths: {
            berlin: 'M 66 18 L 64 64 L 26 64 L 26 49 L 64 49',
            paris: 'M 76 18 L 58 64 L 26 64 L 28 49 L 62 49',
            london: 'M 72 18 L 60 64 L 26 64 L 26 49 L 64 49',
            birmingham: 'M 76 18 L 58 64 L 26 64 L 28 49 L 62 49',
            tubingen: 'M 66 18 L 64 64 L 26 64 L 26 49 L 64 49',
            inscription: 'M 66 20 L 66 64 L 26 64 L 26 50 L 66 50'
        }
    },
    {
        id: 'ayn',
        letters: ['ع', 'غ'],
        titleAr: 'العين وأختها (ع، غ)',
        titleEn: 'The Letters Ayn & Ghayn',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'إهناسيا 22 هـ (Ahnasia)', 'الحجري (Al-Hajri)'],
        summaryAr: 'تتميز العين والغين في المصاحف الحجازية المبكرة والنقوش الصخرية بأنها مفتوحة الرأس بزاوية حادة في الوسط والنهاية وليست مطموسة.',
        isolatedFormDesc: 'رأس مفتوح بزاوية يتبعه عرق مستقيم يمتد للأسفل.',
        initialFormDesc: 'خط منبسط على السطر يمتد من فوقه خط مائل، وهو الشكل الموروث منذ نقوش ما قبل الإسلام والعصر الأموي.',
        medialFormDesc: 'تُكتب مفتوحة الأعلى (على هيئة زاوية سبعة مفتوحة من الأعلى) في المصاحف الخمسة والنقوش الحجرية.',
        finalFormDesc: 'رأس مفتوح من الأعلى مع عرق مستقيم ممتد للأسفل نحو اليمين أو الاستقامة.',
        distinguishingFeature: 'عدم طمس العين المتوسطة والمنتهية (بقاؤها مفتوحة الأعلى بفرعين مستقيمين).',
        svgPaths: {
            berlin: 'M 36 36 L 56 48 L 42 58 L 38 86 L 50 86',
            paris: 'M 36 34 L 56 48 L 42 58 L 40 86',
            london: 'M 36 36 L 56 48 L 40 58 L 36 86',
            birmingham: 'M 36 36 L 56 46 L 40 58 L 38 86 L 48 86',
            tubingen: 'M 36 36 L 56 46 L 40 58 L 38 86 L 48 86',
            inscription: 'M 36 38 L 56 48 L 40 58 L 42 86'
        }
    },
    {
        id: 'faa',
        letters: ['ف', 'ق'],
        titleAr: 'الفاء والقاف (ف، ق)',
        titleEn: 'The Letters Faa & Qaf',
        inscriptionsReferenced: ['الحجري (Al-Hajri)', 'إهناسيا 22 هـ (Ahnasia)', 'صبيح (Sobeih)'],
        summaryAr: 'تشترك الفاء والقاف في الرأس المضلع الصغير، وتُميَّز القاف المتطرفة عن الفاء بذيل ينزل تحت السطر بينما تنبسط الفاء أفقياً على السطر.',
        isolatedFormDesc: 'رأس مضلع وعنق قصير؛ الفاء تمتد أفقياً على السطر، والقاف تنزل بعرق مستقيم منكسر.',
        initialFormDesc: 'رأس مضلع وعنق يتصل بما بعده على السطر.',
        medialFormDesc: 'حلقة مضلعة مرتكزة مباشرة على خط السطر.',
        finalFormDesc: 'مُيِّزت القاف في آخر الكلمة بعرق سفلي منكسر، بينما الفاء منبسطة أفقياً لمنع اللبس عند غياب النقط.',
        distinguishingFeature: 'تمييز القاف المتطرفة بذيل عميق تحت السطر مقابل انبساط الفاء على السطر قبل ظهور النقط.',
        svgPaths: {
            berlin: 'M 62 64 L 62 44 L 46 44 L 46 58 L 62 58 L 62 64 L 20 64',
            paris: 'M 62 64 L 62 44 L 46 44 L 46 58 L 62 58 L 62 64 L 18 64',
            london: 'M 62 64 L 62 44 L 46 44 L 46 58 L 62 58 L 62 64 L 20 64',
            birmingham: 'M 62 64 L 62 44 L 46 44 L 46 58 L 62 58 L 62 64 L 20 64',
            tubingen: 'M 62 64 L 62 44 L 46 44 L 46 58 L 62 58 L 62 64 L 20 64',
            inscription: 'M 62 64 L 62 44 L 46 44 L 46 58 L 62 58 L 62 64 L 22 64'
        }
    },
    {
        id: 'kaf',
        letters: ['ك'],
        titleAr: 'حرف الكاف (ك)',
        titleEn: 'The Letter Kaf (K)',
        inscriptionsReferenced: ['الحجري (Al-Hajri)', 'إهناسيا 22 هـ (Ahnasia)'],
        summaryAr: 'تُكتب الكاف الحجازية في جميع مواضعها بهيئة مستقيمة الزوايا تشبه الدال لكن بامتداد طولي أكبر وعنق صغير مائل فوق الحرف.',
        isolatedFormDesc: 'مبسوطة طويلة مستقيمة على السطر مع خط علوي مائل فوقها بدون كاف صغيرة بداخلها.',
        initialFormDesc: 'تُكتب برقبة قصيرة وتتصل بما بعدها، وهو الفارق الجوهري الذي يميزها عن الدال المنفصلة.',
        medialFormDesc: 'متصلة بما قبلها وما بعدها مع امتداد أفقي واضح وسقف مائل مستقيم.',
        finalFormDesc: 'مبسوطة ممتدة على السطر أطول من الدال بوضوح.',
        distinguishingFeature: 'غياب الهمزة/الشارات داخل الكاف المتطرفة، والاعتماد على اتصالها وطولها لتمييزها عن الدال.',
        svgPaths: {
            berlin: 'M 24 36 L 70 49 L 70 64 L 18 64',
            paris: 'M 22 38 L 70 49 L 70 64 L 18 64',
            london: 'M 24 36 L 70 49 L 70 64 L 18 64',
            birmingham: 'M 22 40 L 70 49 L 70 64 L 18 64',
            tubingen: 'M 26 36 L 70 49 L 70 64 L 18 64',
            inscription: 'M 22 38 L 70 49 L 70 64 L 18 64'
        }
    },
    {
        id: 'lam',
        letters: ['ل'],
        titleAr: 'حرف اللام (ل)',
        titleEn: 'The Letter Lam (L)',
        inscriptionsReferenced: ['العُبيد (El-Abaid)', 'الحجري (Al-Hajri)'],
        summaryAr: 'تشبه اللام حرف الألف في استقامتها وميلها، لكن ذيلها السفلي ينكسر نحو اليسار (على العكس تماماً من ذيل الألف المائل لليمين) بدون كأسة مدورة.',
        isolatedFormDesc: 'ساق قائمة مستقيمة ينعطف ذيلها بزاوية نحو اليسار على مستوى السطر.',
        initialFormDesc: 'ساق قائمة مستقيمة أو مائلة قليلاً تتصل بما بعدها نحو اليسار.',
        medialFormDesc: 'ساق قائمة تتصل بما قبلها وما بعدها.',
        finalFormDesc: 'ساق قائمة بذيل يتجه لليسار دون تقعر الكأس الواسع.',
        distinguishingFeature: 'اتجاه الذيل السفلي لليسار بخط مستقيم (عكس الألف التي يتجه ذيلها لليمين).',
        svgPaths: {
            berlin: 'M 58 16 L 54 66 L 32 66',
            paris: 'M 64 16 L 48 66 L 28 66',
            london: 'M 60 16 L 50 66 L 32 66',
            birmingham: 'M 62 16 L 48 66 L 30 66',
            tubingen: 'M 58 16 L 52 66 L 34 66',
            inscription: 'M 58 16 L 56 66 L 34 66'
        }
    },
    {
        id: 'meem',
        letters: ['م'],
        titleAr: 'حرف الميم (م)',
        titleEn: 'The Letter Meem (M)',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'الحجري (Al-Hajri)'],
        summaryAr: 'تُكتب الميم على هيئة رأس صغير مرتكز على مستوى السطر مع خط أفقي قصير مستقيم على السطر (أو بدونه في بعض كلمات مصاحف باريس ولندن وبرمنجهام).',
        isolatedFormDesc: 'رأس مضلع على السطر مع ذيل أفقي قصير يمتد على مستوى السطر دون نزول عمودي طويل.',
        initialFormDesc: 'رأس يرتكز على السطر ويتصل بما بعده مباشرة.',
        medialFormDesc: 'رأس على مستوى السطر يدخل الخط فيه ويخرج منه.',
        finalFormDesc: 'رأس على السطر مع ذيل أفقي قصير على السطر، وفي بعض الكلمات بدون ذيل.',
        distinguishingFeature: 'استقرار ذيل الميم أفقياً على السطر بدلاً من النزول العمودي للأسفل.',
        svgPaths: {
            berlin: 'M 60 64 L 60 48 L 42 48 L 42 64 L 60 64 M 42 64 L 20 64',
            paris: 'M 60 64 L 60 48 L 42 48 L 42 64 L 60 64 M 42 64 L 22 64',
            london: 'M 60 64 L 60 48 L 42 48 L 42 64 L 60 64 M 42 64 L 22 64',
            birmingham: 'M 60 64 L 60 48 L 42 48 L 42 64 L 60 64 M 42 64 L 18 64',
            tubingen: 'M 60 64 L 60 48 L 42 48 L 42 64 L 60 64 M 42 64 L 22 64',
            inscription: 'M 60 64 L 60 48 L 42 48 L 42 64 L 60 64 M 42 64 L 22 64'
        }
    },
    {
        id: 'noon',
        letters: ['ن'],
        titleAr: 'حرف النون (ن)',
        titleEn: 'The Letter Noon (N)',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'الحجري (Al-Hajri)', 'إهناسيا 22 هـ (Ahnasia)'],
        summaryAr: 'تشبه النون في البداية والوسط حرف الباء، أما في النهاية والانفراد فتُكتب بخط مستقيم يمتد أسفل السطر مع انعطافة قصيرة لليسار بدون كأسة مدورة.',
        isolatedFormDesc: 'خط ينحدر من الأعلى إلى أسفل السطر مع انعطافة قصيرة نحو اليسار بدون الكأس المقوسة.',
        initialFormDesc: 'سنة رأسية قصيرة كالباء تماماً.',
        medialFormDesc: 'سنة رأسية متصلة كالباء والتاء.',
        finalFormDesc: 'خط مستقيم يمتد للأسفل تحت مستوى السطر مع امتداد قصير لليسار.',
        distinguishingFeature: 'انفتاح النون المتطرفة ونزولها بخط منكسر عميق بدلاً من الكأس المستديرة المغلقة.',
        svgPaths: {
            berlin: 'M 56 36 L 50 82 L 34 82',
            paris: 'M 58 36 L 46 82 L 30 80',
            london: 'M 58 36 L 44 82 L 30 80',
            birmingham: 'M 60 38 L 48 80 L 28 78',
            tubingen: 'M 56 38 L 50 80 L 34 80',
            inscription: 'M 56 38 L 48 80 L 28 80'
        }
    },
    {
        id: 'haa',
        letters: ['ه', 'ة'],
        titleAr: 'حرف الهاء والتاء المربوطة (هـ، ة)',
        titleEn: 'The Letter Haa (H)',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'الحجري (Al-Hajri)', 'إهناسيا 22 هـ (Ahnasia)'],
        summaryAr: 'تُكتب الهاء في البداية والوسط بخط مستقيم ممتد وزاوية لا تصل لأعلى الخط مشطورة بسن القلم، وفي النهاية تظهر معقودة.',
        isolatedFormDesc: 'مضلع صغير معقود على السطر.',
        initialFormDesc: 'خط مستقيم ممتد يعلوه شطر بسن القلم إلى عينين.',
        medialFormDesc: 'تتشكل من زاويتين متراكبتين فوق السطر دون النزول تحته.',
        finalFormDesc: 'تظهر معقودة في نهاية الكلمة، وتُكتب تاء التأنيث بها أو بالتاء المفتوحة.',
        distinguishingFeature: 'شطر الهاء بسن القلم مع بقاء الساق العليا المستقيمة بارزة.',
        svgPaths: {
            berlin: 'M 58 26 L 36 64 L 60 64 Z M 56 46 L 40 54',
            paris: 'M 58 26 L 36 64 L 60 64 Z M 56 46 L 40 54',
            london: 'M 58 24 L 36 64 L 60 64 Z M 56 46 L 40 54',
            birmingham: 'M 58 28 L 36 64 L 60 64 Z M 56 46 L 40 54',
            tubingen: 'M 56 26 L 36 64 L 60 64 Z M 56 46 L 40 54',
            inscription: 'M 58 28 L 36 64 L 60 64 Z'
        }
    },
    {
        id: 'waw',
        letters: ['و', 'ؤ'],
        titleAr: 'حرف الواو (و)',
        titleEn: 'The Letter Waw (W)',
        inscriptionsReferenced: ['الطائف 58 هـ (Taif)', 'الحجري (Al-Hajri)'],
        summaryAr: 'تُكتب الواو المفردة والمتصلة برأس مضلع مطموس مع عرق منكسر مقطوع تحت مستوى السطر.',
        isolatedFormDesc: 'رأس مضلع على السطر مع عرق قصير منكسر يميل نحو اليسار أسفل السطر.',
        initialFormDesc: 'لا تتصل بما بعدها.',
        medialFormDesc: 'تتصل بما قبلها وتنفصل عما بعدها.',
        finalFormDesc: 'رأس مضلع مطموس وعرق قصير تحت مستوى السطر.',
        distinguishingFeature: 'طمس رأس الواو وقِصَر عرقها السفلي المستقيم.',
        svgPaths: {
            berlin: 'M 58 60 L 58 46 L 42 46 L 42 60 L 58 60 L 52 78 L 34 80',
            paris: 'M 58 60 L 58 46 L 42 46 L 42 60 L 58 60 L 50 78 L 32 80',
            london: 'M 58 60 L 58 46 L 42 46 L 42 60 L 58 60 L 50 78 L 32 80',
            birmingham: 'M 58 60 L 58 46 L 42 46 L 42 60 L 58 60 L 48 76 L 32 78',
            tubingen: 'M 58 60 L 58 46 L 42 46 L 42 60 L 58 60 L 50 78 L 34 80',
            inscription: 'M 58 60 L 58 46 L 42 46 L 42 60 L 58 60 L 50 78 L 34 80'
        }
    },
    {
        id: 'lam-alif',
        letters: ['لا', 'لأ', 'لإ', 'لآ'],
        titleAr: 'اللام ألف (لا)',
        titleEn: 'The Ligature Lam-Alif (LA)',
        inscriptionsReferenced: ['نقش ميمون (Maimon)'],
        summaryAr: 'تُكتب اللام ألف على شكل قاعدة مثلث صغير متساوي الأضلاع على مستوى السطر يمتد منه ذراعان مستقيمان للأعلى.',
        isolatedFormDesc: 'مثلث صغير متساوي الأضلاع على السطر يرتفع منه ساقان مستقيمان.',
        initialFormDesc: 'قاعدة مثلثية على السطر مع ذراعين مرتفعين مستقيمين.',
        medialFormDesc: 'تتصل بما قبلها من أسفل القاعدة المثلثية.',
        finalFormDesc: 'مثلث متساوي الأضلاع على السطر يمتد ضلعاه بخطين مستقيمين.',
        distinguishingFeature: 'القاعدة المثلثية الهندسية الصريحة على مستوى السطر كما في نقش ميمون والمصاحف الخمسة.',
        svgPaths: {
            berlin: 'M 38 64 L 56 64 L 47 48 Z M 47 48 L 34 18 M 47 48 L 62 18',
            paris: 'M 38 64 L 56 64 L 47 48 Z M 47 48 L 34 18 M 47 48 L 66 18',
            london: 'M 38 64 L 56 64 L 47 48 Z M 47 48 L 34 18 M 47 48 L 64 18',
            birmingham: 'M 38 64 L 56 64 L 47 48 Z M 47 48 L 34 18 M 47 48 L 64 18',
            tubingen: 'M 38 64 L 56 64 L 47 48 Z M 47 48 L 36 18 M 47 48 L 60 18',
            inscription: 'M 38 64 L 56 64 L 47 48 Z M 47 48 L 34 20 M 47 48 L 60 20'
        }
    },
    {
        id: 'yaa',
        letters: ['ي', 'ى', 'ئ'],
        titleAr: 'حرف الياء والياء الراجعة (ي، ى)',
        titleEn: 'The Letter Yaa & Backward Returning Yaa',
        inscriptionsReferenced: ['الحجري (Al-Hajri)', 'الطائف 58 هـ (Taif)', 'إهناسيا 22 هـ (Ahnasia)'],
        summaryAr: 'تُكتب الياء المتطرفة والمفردة بصورتين أصيلتين في المصاحف الحجازية والنقوش: الياء الراجعة للخلف بخط أفقي مستقيم طويل نحو اليمين تحت السطر، أو المنكسرة للأسفل.',
        isolatedFormDesc: 'خط راجع للخلف أفقياً نحو اليمين بزاوية حادة تحت السطر.',
        initialFormDesc: 'تُكتب على هيئة الباء تماماً (سنة رأسية قصيرة مستقيمة).',
        medialFormDesc: 'سنة رأسية قصيرة كالباء والتاء والنون.',
        finalFormDesc: 'تشتهر بالياء الراجعة (المردودة نحو اليمين تحت السطر بخط أفقي مستقيم طويل) في المصاحف الخمسة والنقوش الحجرية.',
        distinguishingFeature: 'الياء الراجعة للخلف بخط مستقيم نحو اليمين هي إحدى أبرز العلامات البصرية للخط الحجازي المبكر.',
        svgPaths: {
            berlin: 'M 38 48 L 22 64 L 22 75 L 78 75',
            paris: 'M 38 48 L 22 64 L 22 75 L 78 75',
            london: 'M 38 48 L 22 64 L 22 75 L 78 75',
            birmingham: 'M 38 48 L 22 64 L 22 75 L 78 75',
            tubingen: 'M 54 42 L 50 82 L 32 80',
            inscription: 'M 38 48 L 22 64 L 22 75 L 78 75'
        }
    }
];

export const HIJAZI_STUDY_CONCLUSIONS = [
    {
        number: 1,
        title: 'الأصل الشمالي النبطي للخط الحجازي',
        detail: 'ينتمي الخط الحجازي الشمالي الذي كُتب به القرآن الكريم إلى مجموعة الخطوط التي سادت في شمال الجزيرة العربية وبلاد الشام، متطوراً عن الخط النبطي منذ القرن الرابع الميلادي حتى استقرت خصائصه في القرن السادس الميلادي.'
    },
    {
        number: 2,
        title: 'نسخ المصاحف المبكرة بالخط الحجازي اللين',
        detail: 'أثبتت الدراسة أن نسخ المصاحف المبكرة الخمسة التي وصلتنا (برلين، برمنجهام، توبنجن، باريس، لندن) قد نُسخت وكُتبت بالخط الحجازي اللين (Soft Hijazi Calligraphy).'
    },
    {
        number: 3,
        title: 'إثبات أصالة النص القرآني الكريم',
        detail: 'أثبتت الدراسة ونماذج المخطوطات المصحفية والشواهد الأثرية أصالة النص القرآني الكريم ومطابقته للمصحف المتداول اليوم رغم ادعاءات المستشرقين والمشككين.'
    },
    {
        number: 4,
        title: 'تطابق إملاء المصحف مع النقوش العربية المبكرة',
        detail: 'وجود تطابق وثيق بين النظام الإملائي المستعمل في رسم المصاحف المبكرة والنظام الإملائي في النقوش الحجرية والبرديات المؤرخة في القرن الأول الهجري (مثل حذف الألف الوسطية، ورسم التاء المبسوطة والهاء، وعدم رسم الهمزة المفردة).'
    },
    {
        number: 5,
        title: 'إضافة علامات التعشير والتخميس في فترة لاحقة',
        detail: 'كشفت الدراسة الفاحصة أن معظم علامات التعشير والتخميس وفواتح السور في المخطوطات المبكرة أُضيفت في فترة لاحقة على نسخها، لعدم ترك فراغات كافية لها في أواخر الآيات واختلاف المداد والقلم.'
    },
    {
        number: 6,
        title: 'منهجية التأريخ العلمي للمخطوطات وترتيب المعايير',
        detail: 'حددت الدراسة أن المعايير الرئيسية لتأريخ المخطوطات المصحفية المبكرة تبدأ بالمعايير الفنية (نوع الخط، وجود أو غياب الإعجام والشكل، الزخارف، الفواصل)، ثم المعايير اللغوية والمقارنة مع النقوش المؤرخة، ثم فحص الكربون المشع (C14) كقرينة مساعدة.'
    }
];

/**
 * Maps standard pointed Arabic letters to their unpointed archaic Rasm (التجرد من النقط والإعجام)
 * as written in the first phase of Hijazi Quranic manuscripts.
 */
const ARCHAIC_RASM_MAP: Record<string, string> = {
    'ب': 'ٮ',
    'ت': 'ٮ',
    'ث': 'ٮ',
    'ف': 'ڡ',
    'ق': 'ٯ',
    'ن': 'ں',
    'ي': 'ى',
    'ئ': 'ى',
    'أ': 'ا',
    'إ': 'ا',
    'آ': 'ا',
    'ؤ': 'و',
    'ء': '',
    'ة': 'ه',
    'خ': 'ح',
    'ج': 'ح',
    'ذ': 'د',
    'ز': 'ر',
    'ش': 'س',
    'ض': 'ص',
    'ظ': 'ط',
    'غ': 'ع'
};

/**
 * Strips all Arabic vowel diacritics and Quranic annotations, and optionally removes letter dots (i'jam)
 * to simulate the first-century AH Hijazi Rasm.
 */
export function transformToHijaziScript(
    text: string,
    options: {
        stripDiacritics: boolean;
        stripDots: boolean;
        omitMedialAlif: boolean;
    }
): string {
    if (!text) return '';
    let result = text;

    // Normalize Quranic symbols if stripping diacritics
    if (options.stripDiacritics) {
        result = result
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08FF]/g, '')
            .replace(/ٱ/g, 'ا');
    }

    // Apply early Hijazi medial Alif omission simulation if enabled
    if (options.omitMedialAlif) {
        result = result
            .replace(/العالمين/g, 'العلمين')
            .replace(/السماوات/g, 'السموت')
            .replace(/إبراهيم/g, 'ابرهيم')
            .replace(/ابراهيم/g, 'ابرهيم')
            .replace(/إسماعيل/g, 'اسمعيل')
            .replace(/اسماعيل/g, 'اسمعيل')
            .replace(/إسحاق/g, 'اسحق')
            .replace(/اسحاق/g, 'اسحق')
            .replace(/الرحمن/g, 'الرحمن')
            .replace(/سبحان/g, 'سبحن')
            .replace(/هؤلاء/g, 'هولا')
            .replace(/أولئك/g, 'اوليك')
            .replace(/ذلك/g, 'دلك')
            .replace(/قالوا/g, 'قلوا')
            .replace(/ربنا/g, 'ربنا');
    }

    if (options.stripDots) {
        // Also strip diacritics first so unpointed glyph forms connect cleanly
        const clean = result
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08FF]/g, '')
            .replace(/ٱ/g, 'ا');

        const words = clean.split(' ');
        result = words
            .map((word) => {
                const chars = Array.from(word);
                return chars
                    .map((ch, idx) => {
                        const isLast = idx === chars.length - 1;
                        // In initial/medial positions, Noon and Yaa share the tooth form of Baa (ٮ)
                        if (!isLast && (ch === 'ن' || ch === 'ي' || ch === 'ئ' || ch === 'ى')) {
                            return 'ٮ';
                        }
                        // In initial/medial positions, Qaf shares the loop form of Faa (ڡ)
                        if (!isLast && ch === 'ق') {
                            return 'ڡ';
                        }
                        return ARCHAIC_RASM_MAP[ch] !== undefined ? ARCHAIC_RASM_MAP[ch] : ch;
                    })
                    .join('');
            })
            .join(' ');
    }

    return result;
}

/**
 * Inspects the last vowel of a vocalized Arabic word to determine Abu al-Aswad al-Du'ali's red dot position:
 * - 'above' for Fathah (نقطة حمراء فوق الحرف للفتح)
 * - 'below' for Kasrah (نقطة حمراء تحت الحرف للكسر)
 * - 'before' for Dammah (نقطة حمراء أمام/بين يدي الحرف للضم)
 */
export function detectAbuAlAswadDot(vocalizedWord: string): 'above' | 'below' | 'before' | null {
    if (!vocalizedWord) return null;
    for (let i = vocalizedWord.length - 1; i >= 0; i--) {
        const code = vocalizedWord.charCodeAt(i);
        if (code === 0x064e || code === 0x064b) return 'above'; // Fathah / Fathatan
        if (code === 0x0650 || code === 0x064d) return 'below'; // Kasrah / Kasratan
        if (code === 0x064f || code === 0x064c) return 'before'; // Dammah / Dammatan
    }
    return null;
}
