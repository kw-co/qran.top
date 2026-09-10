import { normalizeArabicText, stripDiacritics } from './text';
import { getArabicRoot } from './roots';
import type { Ayah, SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';

// Stop words in Arabic (common particles, prepositions, pronouns that don't indicate semantic thematic pairing)
export const ARABIC_STOP_WORDS = new Set([
    'في', 'من', 'إلى', 'الي', 'على', 'علي', 'عن', 'حتى', 'مع', 'بين',
    'إن', 'ان', 'أن', 'لا', 'ما', 'ماذا', 'لم', 'لن', 'لو', 'لولا',
    'ثم', 'أو', 'او', 'أم', 'ام', 'بل', 'لكن', 'فإن', 'فان',
    'هو', 'هي', 'هم', 'هن', 'هما', 'أنت', 'انت', 'أنتم', 'انتم', 'أنا', 'انا', 'نحن',
    'هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك', 'أولئك', 'اولئك', 'هناك', 'هنا',
    'الذي', 'التي', 'الذين', 'اللاتي', 'اللواتي', 'اللائي',
    'كل', 'بعض', 'غير', 'سوى', 'عند', 'لدى', 'قبل', 'بعد',
    'كان', 'كانت', 'كانوا', 'يكون', 'تكون', 'نكون', 'كنتم',
    'قال', 'قالت', 'قالوا', 'يقول', 'تقول', 'نقول', 'قل',
    'إذا', 'اذا', 'إذ', 'اذ', 'لما', 'قد', 'سوف', 'يا', 'أيها', 'ايها'
]);

export interface WordToken {
    raw: string;
    clean: string;
    root: string;
    isStopWord: boolean;
}

export interface ProcessedAyah {
    surahNumber: number;
    ayahNumber: number;
    text: string;
    cleanText: string;
    tokens: WordToken[];
    uniqueSignificantWords: Set<string>;
    uniqueSignificantRoots: Set<string>;
}

export interface AyahMatch {
    sourceAyah: {
        surahNumber: number;
        ayahNumber: number;
        text: string;
    };
    targetAyah: {
        surahNumber: number;
        ayahNumber: number;
        text: string;
    };
    matchedTerms: string[];
    matchScore: number;
    jaccardIndex: number;
}

export interface SurahPairScore {
    surahNumber: number;
    surahName: string;
    numberOfAyahs: number;
    sharedSignificantWords: number;
    sharedSignificantRoots: number;
    rawAyahMatchesCount: number;
    // Jaccard similarity between vocabularies of the two surahs
    vocabularySimilarity: number;
    // Normalized pair affinity score (0 to 100%)
    pairingScore: number;
    // Is this a classically recognized pair in Quranic studies
    isClassicalPair?: boolean;
    // Top matched ayahs between this target surah and the source surah
    topAyahMatches: AyahMatch[];
}

export interface ClassicalPairInfo {
    pairSurahNumber: number;
    pairSurahName: string;
    relationshipDescription: string;
}

export const CLASSICAL_SURAH_PAIRS: Record<number, ClassicalPairInfo> = {
    1: { pairSurahNumber: 2, pairSurahName: 'البقرة', relationshipDescription: 'الدعاء بالهداية للصراط المستقيم في الفاتحة، وإجابة الدعاء ببيان الهداية في (ذلك الكتاب لا ريب فيه هدى للمتقين)' },
    2: { pairSurahNumber: 3, pairSurahName: 'آل عمران', relationshipDescription: 'الزهراوان؛ البقرة أرست أصول التشريع وعقائد الإسلام، وآل عمران ثبّتت قلوب المؤمنين وحاججت أهل الكتاب' },
    3: { pairSurahNumber: 2, pairSurahName: 'البقرة', relationshipDescription: 'قرينة البقرة؛ تتكامل معها في تثبيت أصول الإيمان والدفاع عن العقيدة والشريعة' },
    4: { pairSurahNumber: 5, pairSurahName: 'المائدة', relationshipDescription: 'النساء تناولت حقوق المستضعفين والأرحام واليتامى، والمائدة أمرت بالوفاء بكل العقود والعهود والشرائع' },
    5: { pairSurahNumber: 4, pairSurahName: 'النساء', relationshipDescription: 'متممة لأحكام النساء وتكميل الدين والوفاء بالعقود الإلهية والإنسانية' },
    6: { pairSurahNumber: 7, pairSurahName: 'الأعراف', relationshipDescription: 'الأنعام قررت أصول التوحيد بالحجة العقلية، والأعراف بينت تطبيقها في تاريخ وصراع الأمم مع الرسل' },
    7: { pairSurahNumber: 6, pairSurahName: 'الأنعام', relationshipDescription: 'تفصيل تاريخي وعملي لما قررته سورة الأنعام من أصول العقيدة والتوحيد' },
    8: { pairSurahNumber: 9, pairSurahName: 'التوبة', relationshipDescription: 'القرينتان في الجهاد والمواثيق مع المشركين، وكان الصحابة يعدونهما كالسورة الواحدة' },
    9: { pairSurahNumber: 8, pairSurahName: 'الأنفال', relationshipDescription: 'إتمام أحكام الغزوات والجهاد وإعلان البراءة ومفاصلة المنافقين' },
    10: { pairSurahNumber: 11, pairSurahName: 'هود', relationshipDescription: 'دعوة التوحيد وإثبات الوحي وقصص الأنبياء وتسليتهم ومواقف أقوامهم' },
    11: { pairSurahNumber: 10, pairSurahName: 'يونس', relationshipDescription: 'بيان مصارع المكذبين وقصص الرسل والأمر بالاستقامة (فاستقم كما أمرت)' },
    12: { pairSurahNumber: 13, pairSurahName: 'الرعد', relationshipDescription: 'يوسف تناولت العبرة في تدبير أقدار الأفراد، والرعد تناولت تدبير سنن الكون والمجتمعات' },
    13: { pairSurahNumber: 12, pairSurahName: 'يوسف', relationshipDescription: 'تقرير قدرة الله في الآفاق بعد تقرير لطائف صنعه في قصة يوسف' },
    14: { pairSurahNumber: 15, pairSurahName: 'الحجر', relationshipDescription: 'إبراهيم ركزت على دعوة التوحيد وشكر النعم، والحجر ركزت على حفظ الذكر وحفظ الرسول' },
    15: { pairSurahNumber: 14, pairSurahName: 'إبراهيم', relationshipDescription: 'تسلية الرسول وحفظ القرآن الكريم ومآل المكذبين' },
    16: { pairSurahNumber: 17, pairSurahName: 'الإسراء', relationshipDescription: 'النحل سورة النعم المادية والأرضية، والإسراء سورة النعم الروحية والمعراج وتكريم بني آدم' },
    17: { pairSurahNumber: 16, pairSurahName: 'النحل', relationshipDescription: 'تتصل بختام النحل بالصبر وإحسان الدعوة، فبدأت بسبحان الذي أسرى بعبده' },
    18: { pairSurahNumber: 19, pairSurahName: 'مريم', relationshipDescription: 'الكهف سورة الفتن والنجاة منها بالعلم واليقين، ومريم سورة الرحمة الإلهية بالأنبياء والصالحين' },
    19: { pairSurahNumber: 18, pairSurahName: 'الكهف', relationshipDescription: 'تكامل الرحمة الإلهية وتنزيه الله عن الولد بعد بيان النجاة من الفتن في الكهف' },
    20: { pairSurahNumber: 21, pairSurahName: 'الأنبياء', relationshipDescription: 'طه فصّلت قصة موسى والوحي، والأنبياء فصّلت مواكب الرسل ودعاءهم المستجاب في الشدائد' },
    21: { pairSurahNumber: 20, pairSurahName: 'طه', relationshipDescription: 'عرض شامل لرسالات الأنبياء ووحدة أمتهم ودينهم' },
    22: { pairSurahNumber: 23, pairSurahName: 'المؤمنون', relationshipDescription: 'الحج أمرت بالركوع والسجود وفعل الخير، والمؤمنون بدأت بـ (قد أفلح المؤمنون الذين هم في صلاتهم خاشعون)' },
    23: { pairSurahNumber: 22, pairSurahName: 'الحج', relationshipDescription: 'تجسيد صفات المفلحين الذين عظموا شعائر الله في سورة الحج' },
    24: { pairSurahNumber: 25, pairSurahName: 'الفرقان', relationshipDescription: 'النور طهرت البيوت ونشرت الآداب ونور الله، والفرقان فرقت بين الحق والباطل وصفات عباد الرحمن' },
    25: { pairSurahNumber: 24, pairSurahName: 'النور', relationshipDescription: 'بيان صفات عباد الرحمن بعد بيان نور الهداية والآداب الاجتماعية في النور' },
    26: { pairSurahNumber: 27, pairSurahName: 'النمل', relationshipDescription: 'من الطواسين الثلاثة؛ قصص الأنبياء والتنكيل بالمكذبين وإظهار النعم' },
    27: { pairSurahNumber: 28, pairSurahName: 'القصص', relationshipDescription: 'استكمال الطواسين بقصص داود وسليمان وموسى وبسط السنن الإلهية' },
    28: { pairSurahNumber: 27, pairSurahName: 'النمل', relationshipDescription: 'تتمة الطواسين وتفصيل قصة موسى وفرعون وعاقبة قارون' },
    31: { pairSurahNumber: 32, pairSurahName: 'السجدة', relationshipDescription: 'لقمان دعت للحكمة والتفكر، والسجدة دعت للإيمان والتصديق بآيات الله والسجود لها' },
    32: { pairSurahNumber: 31, pairSurahName: 'لقمان', relationshipDescription: 'تأكيد الحكمة واليقين ومصير المؤمنين والمجرمين' },
    33: { pairSurahNumber: 34, pairSurahName: 'سبأ', relationshipDescription: 'الأحزاب بينت حفظ الله لأهل الإيمان ونبيه في الشدائد، وسبأ بينت دوام النعم بالشكر' },
    34: { pairSurahNumber: 33, pairSurahName: 'الأحزاب', relationshipDescription: 'شكر نعم الله وإثبات البعث والعدل الإلهي' },
    35: { pairSurahNumber: 36, pairSurahName: 'يس', relationshipDescription: 'فاطر تفتتح بالحمد وخلق الملائكة والكون، ويس قلب القرآن في إثبات الرسالة والبعث والنشور' },
    36: { pairSurahNumber: 35, pairSurahName: 'فاطر', relationshipDescription: 'تأكيد الرسالة والبعث وعظمة الخالق' },
    37: { pairSurahNumber: 38, pairSurahName: 'ص', relationshipDescription: 'الصافات تنزيه الملائكة والأنبياء، وص عرضت ابتلاءات الأنبياء (داود وسليمان وأيوب)' },
    38: { pairSurahNumber: 37, pairSurahName: 'الصافات', relationshipDescription: 'تأكيد صدق الرسل وتخليد ذكرهم في العالمين' },
    39: { pairSurahNumber: 40, pairSurahName: 'غافر', relationshipDescription: 'الزمر ركزت على إخلاص الدين لله، وغافر ركزت على غفران الذنب وقبول التوب والدفاع عن الرسل' },
    40: { pairSurahNumber: 41, pairSurahName: 'فصلت', relationshipDescription: 'فاتحة الحواميم السبع الشريفة المتتابعة في تعظيم القرآن والدعوة إلى الله' },
    55: { pairSurahNumber: 56, pairSurahName: 'الواقعة', relationshipDescription: 'الرحمن سورة النعم الإلهية (فبأي آلاء ربكما تكذبان)، والواقعة سورة القيامة وتفصيل جزاء المقربين وأصحاب اليمين' },
    56: { pairSurahNumber: 55, pairSurahName: 'الرحمن', relationshipDescription: 'بيان وقوع الجزاء وحق اليقين لما فُصل من نعيم الجنان في الرحمن' },
    61: { pairSurahNumber: 62, pairSurahName: 'الجمعة', relationshipDescription: 'الصف حثت على الصف الواحد والجهاد، والجمعة جمعت المؤمنين على صلاة الجمعة وسماع الذكر' },
    62: { pairSurahNumber: 63, pairSurahName: 'المنافقون', relationshipDescription: 'الجمعة نادت المؤمنين لطاعة الله، والمنافقون حذرت من خداع النفاق والصد عن السبيل' },
    63: { pairSurahNumber: 62, pairSurahName: 'الجمعة', relationshipDescription: 'بيان التناقض بين التزام المؤمنين لصلاة الجمعة ومكر المنافقين' },
    65: { pairSurahNumber: 66, pairSurahName: 'التحريم', relationshipDescription: 'الطلاق تنظم حدود العلاقة الأسرية والفراق، والتحريم تنظم آداب البيت النبوي وتماسكه' },
    66: { pairSurahNumber: 65, pairSurahName: 'الطلاق', relationshipDescription: 'حفظ بيوت المسلمين وتأكيد التقوى والإخلاص' },
    67: { pairSurahNumber: 68, pairSurahName: 'القلم', relationshipDescription: 'الملك عظمة الملك والخلق الإلهي، والقلم تزكية خُلق الرسول (وإنك لعلى خلق عظيم) والدفاع عنه' },
    68: { pairSurahNumber: 67, pairSurahName: 'الملك', relationshipDescription: 'تثبيت النبي في وجه الطغاة بعد بيان ملك الله وقدرته' },
    73: { pairSurahNumber: 74, pairSurahName: 'المدثر', relationshipDescription: 'المزمل (قم الليل) لإعداد النفس والزاد الروحي، والمدثر (قم فأنذر) للتحرك والبلاغ في الناس' },
    74: { pairSurahNumber: 73, pairSurahName: 'المزمل', relationshipDescription: 'البلاغ والإنذار ثمرة الزاد الروحي وقيام الليل في المزمل' },
    75: { pairSurahNumber: 76, pairSurahName: 'الإنسان', relationshipDescription: 'القيامة صورت شدائد البعث، والإنسان صورت خلق الإنسان ونعيم الأبرار وثواب الصابرين' },
    76: { pairSurahNumber: 75, pairSurahName: 'القيامة', relationshipDescription: 'تفصيل جزاء الأبرار في الجنة مقابلة لما في سورة القيامة' },
    77: { pairSurahNumber: 78, pairSurahName: 'النبأ', relationshipDescription: 'المرسلات ختمت بـ (فبأي حديث بعده يؤمنون)، والنبأ بدأت بـ (عمّ يتساءلون عن النبأ العظيم)' },
    78: { pairSurahNumber: 77, pairSurahName: 'المرسلات', relationshipDescription: 'بيان النبأ العظيم الذي تساءل عنه المكذبون في المرسلات' },
    79: { pairSurahNumber: 80, pairSurahName: 'عبس', relationshipDescription: 'النازعات تنتهي بذكر الطامة والإنذار، وعبس تبدأ بالتذكرة ثم الصاخة الكبرى' },
    81: { pairSurahNumber: 82, pairSurahName: 'الانفطار', relationshipDescription: 'التكوير (إذا الشمس كورت)، والانفطار (إذا السماء انفطرت) - مشهدان متكاملان لانقلاب نظام الكون' },
    82: { pairSurahNumber: 81, pairSurahName: 'التكوير', relationshipDescription: 'تكملة لمشاهد القيامة وانكشاف حقائق الأعمال' },
    87: { pairSurahNumber: 88, pairSurahName: 'الغاشية', relationshipDescription: 'الأعلى سورة التسبيح وتيسير اليسرى، والغاشية سورة التذكرة وجزاء الوجوه الخاشعة والناعمة (كان النبي يقرنهما في صلاة الجمعة والعيدين)' },
    88: { pairSurahNumber: 87, pairSurahName: 'الأعلى', relationshipDescription: 'قرينة الأعلى في سنة القراءة النبوية؛ تذكرة بالجنة والنار' },
    89: { pairSurahNumber: 90, pairSurahName: 'البلد', relationshipDescription: 'الفجر بينت عاقبة طغاة البلاد والنفس المطمئنة، والبلد بينت كبد الإنسان في البلد الحرام واقتحام العقبة' },
    90: { pairSurahNumber: 89, pairSurahName: 'الفجر', relationshipDescription: 'دعوة لاقتحام عقبة إطعام المسكين وفك الرقبة للفوز بالنفس المطمئنة' },
    91: { pairSurahNumber: 92, pairSurahName: 'الليل', relationshipDescription: 'الشمس أقسمت بنور النهار وضحاها وتزكية النفس، والليل أقسمت بالليل إذا يغشى وسعي الإنسان شتى' },
    92: { pairSurahNumber: 91, pairSurahName: 'الشمس', relationshipDescription: 'قرينة الشمس في أقسام الكون وتفاوت سعى المتقين والأشقياء' },
    93: { pairSurahNumber: 94, pairSurahName: 'الشرح', relationshipDescription: 'الضحى عددت نعم الله الظاهرة على النبي (ما ودعك ربك وما قلى)، والشرح عددت نعمه الباطنة (ألم نشرح لك صدرك)' },
    94: { pairSurahNumber: 93, pairSurahName: 'الضحى', relationshipDescription: 'متصلة بالضحى اتصال الروح بالجسد؛ شرح الصدر ورفع الذكر وتيسير العسر' },
    95: { pairSurahNumber: 96, pairSurahName: 'العلق', relationshipDescription: 'التين (لقد خلقنا الإنسان في أحسن تقويم)، والعلق (خلق الإنسان من علق.. اقرأ وربك الأكرم)' },
    96: { pairSurahNumber: 95, pairSurahName: 'التين', relationshipDescription: 'بيان وسيلة ترقية الإنسان بالعلم والقراءة ليظل في أحسن تقويم ولا يُرد أسفل سافلين' },
    97: { pairSurahNumber: 98, pairSurahName: 'البينة', relationshipDescription: 'القدر بينت إنزال القرآن في ليلة القدر المباركة، والبينة بينت ضرورة هذا الكتاب والرسول لإخراج الناس من الضلال' },
    98: { pairSurahNumber: 97, pairSurahName: 'القدر', relationshipDescription: 'بيان أثر إنزال القرآن المذكور في القدر في تبيين الحق لأهل الكتاب والمشركين' },
    99: { pairSurahNumber: 100, pairSurahName: 'العاديات', relationshipDescription: 'الزلزلة (وأخرجت الأرض أثقالها)، والعاديات (أفلا يعلم إذا بُعثر ما في القبور وحُصّل ما في الصدور)' },
    100: { pairSurahNumber: 99, pairSurahName: 'الزلزلة', relationshipDescription: 'تأكيد حشر الإنسان بعد غفلته وشحه، والشهادة على أعماله بدقة مثقال الذرة' },
    101: { pairSurahNumber: 102, pairSurahName: 'التكاثر', relationshipDescription: 'القارعة ذكرت موازين القيامة وهاوية من خفت موازينه، والتكاثر بينت سبب خفة الميزان وهو الانشغال بالتكاثر حتى زيارة القبور' },
    102: { pairSurahNumber: 101, pairSurahName: 'القارعة', relationshipDescription: 'كشف الغفلة المسببة لثقل الموازين أو خفتها في القارعة' },
    103: { pairSurahNumber: 104, pairSurahName: 'الهمزة', relationshipDescription: 'العصر قررت أن كل إنسان في خسر إلا المؤمن العامل الصابر، والهمزة فصّلت نموذج الإنسان الخاسر الجامع للمال الهماز اللماز' },
    104: { pairSurahNumber: 103, pairSurahName: 'العصر', relationshipDescription: 'الوجه التطبيقي للخسران بالهمز واللمز واكتناز المال بدلاً من التواصي بالحق والصبر' },
    105: { pairSurahNumber: 106, pairSurahName: 'قريش', relationshipDescription: 'الفيل بينت نعمة إهلاك العدو المغير على البيت الحرام، وقريش بينت نعمة الأمن والإطعام لأهل البيت (فليعبدوا رب هذا البيت)' },
    106: { pairSurahNumber: 105, pairSurahName: 'الفيل', relationshipDescription: 'تتصل بالفيل مباشرة؛ فلأجل إيلاف قريش أهلك الله أصحاب الفيل' },
    107: { pairSurahNumber: 108, pairSurahName: 'الكوثر', relationshipDescription: 'الماعون ذمّت من يكذب بالدين ويصلي رياءً ويمنع الماعون، والكوثر بشّرت النبي بالخير الكثير وأمرته بإخلاص الصلاة لله والنحر (فصلّ لربك وانحر)' },
    108: { pairSurahNumber: 107, pairSurahName: 'الماعون', relationshipDescription: 'مقابلة تامة وبديعة؛ في الماعون (فويل للمصلين الذين هم عن صلاتهم ساهون... ويمنعون الماعون)، وفي الكوثر أمر بالصلاة الخالصة والإنفاق والنحر (فصل لربك وانحر) جزاء للكوثر' },
    109: { pairSurahNumber: 110, pairSurahName: 'النصر', relationshipDescription: 'الكافرون براءة مطلقة من الشرك (لكم دينكم ولي دين)، والنصر ثمرة الثبات على التوحيد بدخول الناس في دين الله أفواجاً' },
    110: { pairSurahNumber: 109, pairSurahName: 'الكافرون', relationshipDescription: 'إعلان نصر التوحيد والفتح بعد المفاصلة التامة في الكافرون' },
    111: { pairSurahNumber: 112, pairSurahName: 'الإخلاص', relationshipDescription: 'المسد قضت بهلاك أبي لهب الشركي، والإخلاص رفعت راية التوحيد الخالص (قل هو الله أحد)' },
    112: { pairSurahNumber: 111, pairSurahName: 'المسد', relationshipDescription: 'إفراد الإله الصمد الأحد بعد زوال أبي لهب وأصنام الجاهلية' },
    113: { pairSurahNumber: 114, pairSurahName: 'الناس', relationshipDescription: 'المعوذتان؛ الفلق للاستعاذة من الشرور الكونية والآفاقية الخارجية (غاسق، نفاثات، حاسد)، والناس للاستعاذة من الوسواس الخناس والشرور النفسية الباطنة' },
    114: { pairSurahNumber: 113, pairSurahName: 'الفلق', relationshipDescription: 'المعوذة الثانية المتممة للتحصين الرباني الشامل للإنسان في ظاهره وباطنه' },
};

export interface SurahPairingAnalysisResult {
    sourceSurahNumber: number;
    sourceSurahName: string;
    sourceAyahsCount: number;
    calculationMode: 'word' | 'root';
    // Classical pair metadata if exists
    classicalPair?: ClassicalPairInfo;
    // Ranked list of other 113 surahs with their affinity
    rankedPairs: SurahPairScore[];
    // Top matched ayahs across all other surahs in the Quran
    allQuranTopAyahMatches: AyahMatch[];
}

// Tokenizes an ayah into clean words and roots, tagging stop words
export const tokenizeAyah = (ayahText: string): WordToken[] => {
    if (!ayahText) return [];
    const rawWords = ayahText.trim().split(/\s+/);
    
    return rawWords.map(raw => {
        const clean = normalizeArabicText(stripDiacritics(raw)).replace(/[^\u0621-\u064A]/g, '');
        const isStopWord = ARABIC_STOP_WORDS.has(clean) || clean.length <= 1;
        const root = clean.length > 1 ? getArabicRoot(clean) : clean;
        return {
            raw,
            clean,
            root,
            isStopWord
        };
    }).filter(t => t.clean.length > 0);
};

// Prepares processed data for a list of surahs (usually simpleCleanData)
export const prepareProcessedQuranData = (quranData: SurahData[]): ProcessedAyah[] => {
    const list: ProcessedAyah[] = [];
    
    for (const s of quranData) {
        for (const a of s.ayahs) {
            const rawText = a.text || '';
            const tokens = tokenizeAyah(rawText);
            const uniqueSignificantWords = new Set<string>();
            const uniqueSignificantRoots = new Set<string>();

            for (const t of tokens) {
                if (!t.isStopWord) {
                    if (t.clean.length >= 2) uniqueSignificantWords.add(t.clean);
                    if (t.root && t.root.length >= 2) uniqueSignificantRoots.add(t.root);
                }
            }

            list.push({
                surahNumber: s.number,
                ayahNumber: a.numberInSurah,
                text: rawText,
                cleanText: normalizeArabicText(stripDiacritics(rawText)),
                tokens,
                uniqueSignificantWords,
                uniqueSignificantRoots
            });
        }
    }

    return list;
};

// Global cache for processed ayahs to avoid re-tokenizing on every click
let cachedProcessedAyahs: ProcessedAyah[] | null = null;
let lastQuranDataRef: SurahData[] | null = null;

export const getProcessedQuranAyahs = (quranData: SurahData[]): ProcessedAyah[] => {
    if (cachedProcessedAyahs && lastQuranDataRef === quranData) {
        return cachedProcessedAyahs;
    }
    cachedProcessedAyahs = prepareProcessedQuranData(quranData);
    lastQuranDataRef = quranData;
    return cachedProcessedAyahs;
};

/**
 * Calculates surah pairing scores and finds the most matching ayahs
 * @param sourceSurahNumber The target surah number (1 - 114)
 * @param quranData All 114 surahs
 * @param mode 'word' for exact lexical matching or 'root' for morphological/thematic root matching
 */
export const calculateSurahPairings = (
    sourceSurahNumber: number,
    quranData: SurahData[],
    mode: 'word' | 'root' = 'root'
): SurahPairingAnalysisResult => {
    const processedAyahs = getProcessedQuranAyahs(quranData);

    const sourceAyahs = processedAyahs.filter(a => a.surahNumber === sourceSurahNumber);
    const sourceSurahInfo = QURAN_INDEX.find(s => s.number === sourceSurahNumber);
    const sourceSurahName = sourceSurahInfo?.name || `سورة ${sourceSurahNumber}`;

    // Aggregate vocabulary for the source surah
    const sourceVocab = new Set<string>();
    for (const a of sourceAyahs) {
        const terms = mode === 'word' ? a.uniqueSignificantWords : a.uniqueSignificantRoots;
        terms.forEach(t => sourceVocab.add(t));
    }

    // Prepare map of target surahs (surahNumber -> ProcessedAyah[])
    const targetSurahsAyahsMap = new Map<number, ProcessedAyah[]>();
    for (const a of processedAyahs) {
        if (a.surahNumber === sourceSurahNumber) continue;
        if (!targetSurahsAyahsMap.has(a.surahNumber)) {
            targetSurahsAyahsMap.set(a.surahNumber, []);
        }
        targetSurahsAyahsMap.get(a.surahNumber)!.push(a);
    }

    const rankedPairs: SurahPairScore[] = [];
    const allAyahMatches: AyahMatch[] = [];

    // Helper to evaluate matching between two ayahs
    const getAyahOverlap = (a1: ProcessedAyah, a2: ProcessedAyah): { matchedTerms: string[]; score: number; jaccard: number } => {
        const set1 = mode === 'word' ? a1.uniqueSignificantWords : a1.uniqueSignificantRoots;
        const set2 = mode === 'word' ? a2.uniqueSignificantWords : a2.uniqueSignificantRoots;
        
        if (set1.size === 0 || set2.size === 0) return { matchedTerms: [], score: 0, jaccard: 0 };

        const matched: string[] = [];
        for (const item of set1) {
            if (set2.has(item)) {
                matched.push(item);
            }
        }

        if (matched.length === 0) return { matchedTerms: [], score: 0, jaccard: 0 };

        const unionSize = set1.size + set2.size - matched.length;
        const jaccard = unionSize > 0 ? matched.length / unionSize : 0;
        
        // Match score gives weight to number of shared terms and Jaccard overlap
        const score = (matched.length * 2) + (jaccard * 5);
        return { matchedTerms: matched, score, jaccard };
    };

    // Evaluate for each of the other 113 surahs
    for (const surahMeta of QURAN_INDEX) {
        const targetSurahNum = surahMeta.number;
        if (targetSurahNum === sourceSurahNumber) continue;

        const targetAyahs = targetSurahsAyahsMap.get(targetSurahNum) || [];
        const targetVocab = new Set<string>();
        const targetWordsVocab = new Set<string>();
        const targetRootsVocab = new Set<string>();

        for (const a of targetAyahs) {
            a.uniqueSignificantWords.forEach(w => targetWordsVocab.add(w));
            a.uniqueSignificantRoots.forEach(r => targetRootsVocab.add(r));
            const terms = mode === 'word' ? a.uniqueSignificantWords : a.uniqueSignificantRoots;
            terms.forEach(t => targetVocab.add(t));
        }

        // Shared unique terms count
        let sharedTermsCount = 0;
        for (const t of sourceVocab) {
            if (targetVocab.has(t)) {
                sharedTermsCount++;
            }
        }

        let sharedWordsCount = 0;
        let sharedRootsCount = 0;
        for (const a of sourceAyahs) {
            a.uniqueSignificantWords.forEach(w => {
                if (targetWordsVocab.has(w)) sharedWordsCount++;
            });
            a.uniqueSignificantRoots.forEach(r => {
                if (targetRootsVocab.has(r)) sharedRootsCount++;
            });
        }

        // Jaccard similarity of vocabulary
        const vocabUnion = sourceVocab.size + targetVocab.size - sharedTermsCount;
        const vocabSimilarity = vocabUnion > 0 ? (sharedTermsCount / vocabUnion) : 0;

        // Find top ayah-to-ayah matches between source and this target surah
        const surahAyahMatches: AyahMatch[] = [];

        for (const srcAyah of sourceAyahs) {
            for (const tgtAyah of targetAyahs) {
                const overlap = getAyahOverlap(srcAyah, tgtAyah);
                // We consider significant match if they share at least 2 significant terms, or 1 term for short ayahs (<= 7 words) or high jaccard
                if (overlap.matchedTerms.length >= 2 || (overlap.matchedTerms.length === 1 && (overlap.jaccard >= 0.15 || srcAyah.tokens.length <= 7 || tgtAyah.tokens.length <= 7))) {
                    const match: AyahMatch = {
                        sourceAyah: {
                            surahNumber: srcAyah.surahNumber,
                            ayahNumber: srcAyah.ayahNumber,
                            text: srcAyah.text
                        },
                        targetAyah: {
                            surahNumber: tgtAyah.surahNumber,
                            ayahNumber: tgtAyah.ayahNumber,
                            text: tgtAyah.text
                        },
                        matchedTerms: overlap.matchedTerms,
                        matchScore: overlap.score,
                        jaccardIndex: overlap.jaccard
                    };
                    surahAyahMatches.push(match);
                    allAyahMatches.push(match);
                }
            }
        }

        // Sort matches descending by score
        surahAyahMatches.sort((a, b) => b.matchScore - a.matchScore);

        // Calculate a balanced Normalized Pairing Affinity Score:
        // We combine:
        // 1. Vocabulary Jaccard similarity (scale 0-1)
        // 2. Significant Ayah Matches Density (matches / geometric mean of ayahs count)
        // 3. Shared terms ratio
        const geomAyahsCount = Math.sqrt(sourceAyahs.length * Math.max(1, targetAyahs.length));
        const matchDensity = surahAyahMatches.length / geomAyahsCount;
        
        // Raw score formula giving fair weight to both short surahs (which have high similarity) and medium/long surahs
        const rawScore = (vocabSimilarity * 60) + (Math.min(matchDensity, 2.5) * 25) + (Math.min(sharedTermsCount / Math.max(1, sourceVocab.size), 1.0) * 15);
        
        // Scaling to a nice intuitive 0-100 percentage
        const pairingScore = Math.min(99.9, Math.max(5.0, rawScore * 2.2));

        const isClassical = CLASSICAL_SURAH_PAIRS[sourceSurahNumber]?.pairSurahNumber === targetSurahNum;

        rankedPairs.push({
            surahNumber: targetSurahNum,
            surahName: surahMeta.name,
            numberOfAyahs: surahMeta.numberOfAyahs || targetAyahs.length,
            sharedSignificantWords: sharedWordsCount,
            sharedSignificantRoots: sharedRootsCount,
            rawAyahMatchesCount: surahAyahMatches.length,
            vocabularySimilarity: vocabSimilarity,
            pairingScore: parseFloat(pairingScore.toFixed(1)),
            isClassicalPair: isClassical,
            topAyahMatches: surahAyahMatches.slice(0, 15) // Keep top 15 for each surah
        });
    }

    // Sort ranked pairs descending by pairingScore
    rankedPairs.sort((a, b) => b.pairingScore - a.pairingScore);

    // Global top ayah matches sorted descending
    allAyahMatches.sort((a, b) => b.matchScore - a.matchScore);

    return {
        sourceSurahNumber,
        sourceSurahName,
        sourceAyahsCount: sourceAyahs.length,
        calculationMode: mode,
        classicalPair: CLASSICAL_SURAH_PAIRS[sourceSurahNumber],
        rankedPairs,
        allQuranTopAyahMatches: allAyahMatches.slice(0, 50)
    };
};
