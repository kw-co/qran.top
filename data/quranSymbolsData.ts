export interface SajdahInfo {
  sajdahNumber: number; // 1 to 15
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  juz: number;
  hizb: number;
  madinahPage: number;
  shamarlyPage: number;
  ayahText: string;
  sajdahWord: string;
  agreementType: 'متفق عليها' | 'مختلف فيها بين المذاهب' | 'متفق عليها عند الجمهور';
  agreementNotes: string;
  significance: string;
}

export interface JuzDetail {
  number: number; // 1 to 30
  name: string; // e.g. "الجزء الثلاثون (جزء عمّ)"
  commonTitle: string; // e.g. "جزء عمّ"
  startSurah: number;
  startSurahName: string;
  startAyah: number;
  endSurah: number;
  endSurahName: string;
  endAyah: number;
  madinahStartPage: number;
  madinahEndPage: number;
  shamarlyStartPage: number;
  shamarlyEndPage: number;
  hizbs: [number, number];
  surahNames: string[];
  totalAyahs: number;
  summary: string;
}

export interface HizbQuarterDetail {
  quarterNumber: number; // 1 to 240
  hizbNumber: number; // 1 to 60
  juzNumber: number; // 1 to 30
  quarterInHizb: 1 | 2 | 3 | 4;
  typeLabel: 'بداية الحزب' | 'ربع الحزب' | 'نصف الحزب' | 'ثلاثة أرباع الحزب';
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  madinahPage: number;
  shamarlyPage: number;
  startAyahExcerpt: string;
}

export const SAJDAH_DUAA = {
  primary: "سَجَدَ وَجْهِي لِلَّذِي خَلَقَهُ، وَشَقَّ سَمْعَهُ وَبَصَرَهُ، بِحَوْلِهِ وَقُوَّتِهِ، فَتَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ",
  primarySource: "رواه الترمذي (580) وأبو داود (1414) والنسائي (1129) وصححه الألباني",
  secondary: "اللَّهُمَّ اكْتُبْ لِي بِهَا عِنْدَكَ أَجْرًا، وَضَعْ عَنِّي بِهَا وِزْرًا، وَاجْعَلْهَا لِي عِنْدَكَ ذُخْرًا، وَتَقَبَّلْهَا مِنِّي كَمَا تَقَبَّلْتَهَا مِنْ عَبْدِكَ دَاوُدَ",
  secondarySource: "رواه الترمذي (579) وحسنه الألباني",
  ruling: "سجدة التلاوة سُنّة مؤكدة عند جمهور العلماء (الشافعية والمالكية والحنابلة)، وقال الحنفية بوجوبها. يُثاب فاعلها ولا يأثم تاركها، ويسجد سجدة واحدة خارج الصلاة أو داخلها تكريماً لكلام الله وخضوعاً له سبحانه."
};

export const ALL_15_SAJDAHS: SajdahInfo[] = [
  {
    sajdahNumber: 1,
    surahNumber: 7,
    surahName: "الأعراف",
    ayahNumber: 206,
    juz: 9,
    hizb: 18,
    madinahPage: 176,
    shamarlyPage: 152,
    ayahText: "إِنَّ الَّذِينَ عِندَ رَبِّكَ لَا يَسْتَكْبِرُونَ عَنْ عِبَادَتِهِ وَيُسَبِّحُونَهُ وَلَهُ يَسْجُدُونَ ۩",
    sajdahWord: "يَسْجُدُونَ",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها بين جميع الأئمة الأربعة.",
    significance: "بيان تواضع الملائكة المقربين وتسبيحهم الدائم وخضوعهم الكامل لرب العالمين."
  },
  {
    sajdahNumber: 2,
    surahNumber: 13,
    surahName: "الرعد",
    ayahNumber: 15,
    juz: 13,
    hizb: 25,
    madinahPage: 251,
    shamarlyPage: 216,
    ayahText: "وَلِلَّهِ يَسْجُدُ مَن فِي السَّمَاوَاتِ وَالْأَرْضِ طَوْعًا وَكَرْهًا وَظِلَالُهُم بِالْغُدُوِّ وَالْآصَالِ ۩",
    sajdahWord: "يَسْجُدُ",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها بين جميع الأئمة الأربعة.",
    significance: "إقرار بسجود كل الخلائق لله تعالى طوعاً واختياراً أو كُرهاً وظلالهم في الصباح والمساء."
  },
  {
    sajdahNumber: 3,
    surahNumber: 16,
    surahName: "النحل",
    ayahNumber: 50,
    juz: 14,
    hizb: 27,
    madinahPage: 272,
    shamarlyPage: 234,
    ayahText: "يَخَافُونَ رَبَّهُم مِّن فَوْقِهِمْ وَيَفْعَلُونَ مَا يُؤْمَرُونَ ۩",
    sajdahWord: "وَلِلَّهِ يَسْجُدُ مَا فِي السَّمَاوَاتِ... (النحل: 49-50)",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها بين جميع الأئمة الأربعة، وتكون عند ختام الآية 50.",
    significance: "خوف الملائكة والدواب من عظمة الله تعالى وامتثالهم الفوري لأوامره."
  },
  {
    sajdahNumber: 4,
    surahNumber: 17,
    surahName: "الإسراء",
    ayahNumber: 109,
    juz: 15,
    hizb: 30,
    madinahPage: 293,
    shamarlyPage: 252,
    ayahText: "وَيَخِرُّونَ لِلْأَذْقَانِ يَبْكُونَ وَيَزِيدُهُمْ خُشُوعًا ۩",
    sajdahWord: "يَخِرُّونَ",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها بين جميع الأئمة الأربعة.",
    significance: "وصف خشوع أهل العلم والإيمان وبكائهم عند سماع آيات القرآن وتأثر قلوبهم وجوارحهم."
  },
  {
    sajdahNumber: 5,
    surahNumber: 19,
    surahName: "مريم",
    ayahNumber: 58,
    juz: 16,
    hizb: 31,
    madinahPage: 309,
    shamarlyPage: 266,
    ayahText: "إِذَا تُتْلَىٰ عَلَيْهِمْ آيَاتُ الرَّحْمَٰنِ خَرُّوا سُجَّدًا وَبُكِيًّا ۩",
    sajdahWord: "خَرُّوا سُجَّدًا",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها بين جميع الأئمة الأربعة.",
    significance: "شأن الأنبياء المصطفين والصالحين: إذا تُليت عليهم آيات الرحمن خروا ساجدين باكين."
  },
  {
    sajdahNumber: 6,
    surahNumber: 22,
    surahName: "الحج",
    ayahNumber: 18,
    juz: 17,
    hizb: 33,
    madinahPage: 334,
    shamarlyPage: 288,
    ayahText: "أَلَمْ تَرَ أَنَّ اللَّهَ يَسْجُدُ لَهُ مَن فِي السَّمَاوَاتِ وَمَن فِي الْأَرْضِ وَالشَّمْسُ وَالْقَمَرُ وَالنُّجُومُ وَالْجِبَالُ وَالشَّجَرُ وَالدَّوَابُّ وَكَثِيرٌ مِّنَ النَّاسِ ۖ وَكَثِيرٌ حَقَّ عَلَيْهِ الْعَذَابُ ۗ وَمَن يُهِنِ اللَّهُ فَمَا لَهُ مِن مُّكْرِمٍ ۚ إِنَّ اللَّهَ يَفْعَلُ مَا يَشَاءُ ۩",
    sajdahWord: "يَسْجُدُ لَهُ",
    agreementType: "متفق عليها",
    agreementNotes: "السجدة الأولى في سورة الحج، وهي متفق عليها عند كافة الفقهاء.",
    significance: "شهادة الكون كله من شمس وقمر وشجر ودواب بسجود العبودية والتعظيم لله عز وجل."
  },
  {
    sajdahNumber: 7,
    surahNumber: 22,
    surahName: "الحج",
    ayahNumber: 77,
    juz: 17,
    hizb: 34,
    madinahPage: 341,
    shamarlyPage: 294,
    ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا ارْكَعُوا وَاسْجُدُوا وَاعْبُدُوا رَبَّكُمْ وَافْعَلُوا الْخَيْرَ لَعَلَّكُمْ تُفْلِحُونَ ۩",
    sajdahWord: "وَاسْجُدُوا",
    agreementType: "مختلف فيها بين المذاهب",
    agreementNotes: "يرى الشافعية والحنابلة مشروعيتها كسجدة ثانية في سورة الحج لحديث عقبة بن عامر، وخالفهم الحنفية والمالكية فعدوها ركوع صلاة.",
    significance: "أمر صريح للمؤمنين بالركوع والسجود وفعل الخير كطريق للفلاح التام."
  },
  {
    sajdahNumber: 8,
    surahNumber: 25,
    surahName: "الفرقان",
    ayahNumber: 60,
    juz: 19,
    hizb: 37,
    madinahPage: 365,
    shamarlyPage: 315,
    ayahText: "وَإِذَا قِيلَ لَهُمُ اسْجُدُوا لِلرَّحْمَٰنِ قَالُوا وَمَا الرَّحْمَٰنُ أَنَسْجُدُ لِمَا تَأْمُرُنَا وَزَادَهُمْ نُفُورًا ۩",
    sajdahWord: "اسْجُدُوا لِلرَّحْمَٰنِ",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها بين جميع الأئمة الأربعة.",
    significance: "مخالفة استكبار المشركين عن السجود للرحمن بالمبادرة إلى السجود تعظيماً لاسمه الكريم."
  },
  {
    sajdahNumber: 9,
    surahNumber: 27,
    surahName: "النمل",
    ayahNumber: 26,
    juz: 19,
    hizb: 38,
    madinahPage: 379,
    shamarlyPage: 326,
    ayahText: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ رَبُّ الْعَرْشِ الْعَظِيمِ ۩",
    sajdahWord: "أَلَّا يَسْجُدُوا لِلَّهِ... اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ (النمل: 25-26)",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها عند تمام الآية 26.",
    significance: "إعلان التوحيد الخالص لله رب العرش العظيم رداً على عبادة الشمس من دون الله."
  },
  {
    sajdahNumber: 10,
    surahNumber: 32,
    surahName: "السجدة",
    ayahNumber: 15,
    juz: 21,
    hizb: 42,
    madinahPage: 416,
    shamarlyPage: 358,
    ayahText: "إِنَّمَا يُؤْمِنُ بِآيَاتِنَا الَّذِينَ إِذَا ذُكِّرُوا بِهَا خَرُّوا سُجَّدًا وَسَبَّحُوا بِحَمْدِ رَبِّهِمْ وَهُمْ لَا يَسْتَكْبِرُونَ ۩",
    sajdahWord: "خَرُّوا سُجَّدًا",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها، وبسببها سُميت السورة باسم سورة السجدة.",
    significance: "علامة المؤمنين الصادقين: إذا ذُكّروا بآيات الله خرّوا ساجدين مسبحين دون كبر."
  },
  {
    sajdahNumber: 11,
    surahNumber: 38,
    surahName: "ص",
    ayahNumber: 24,
    juz: 23,
    hizb: 45,
    madinahPage: 454,
    shamarlyPage: 391,
    ayahText: "وَظَنَّ دَاوُودُ أَنَّمَا فَتَنَّاهُ فَاسْتَغْفَرَ رَبَّهُ وَخَرَّ رَاكِعًا وَأَنَابَ ۩",
    sajdahWord: "وَخَرَّ رَاكِعًا",
    agreementType: "مختلف فيها بين المذاهب",
    agreementNotes: "يراها الحنفية والمالكية سجدة تلاوة عزيمة، بينما يراها الشافعية والحنابلة سجدة شكر لله تعالى تأسيّاً بداود عليه السلام.",
    significance: "سجدة التوبة والاستغفار والإنابة إلى الله تعالى اقتداءً بنبي الله داود عليه السلام."
  },
  {
    sajdahNumber: 12,
    surahNumber: 41,
    surahName: "فصلت",
    ayahNumber: 38,
    juz: 24,
    hizb: 48,
    madinahPage: 480,
    shamarlyPage: 414,
    ayahText: "فَإِنِ اسْتَكْبَرُوا فَالَّذِينَ عِندَ رَبِّكَ يُسَبِّحُونَ لَهُ بِاللَّيْلِ وَالنَّهَارِ وَهُمْ لَا يَسْأَمُونَ ۩",
    sajdahWord: "لَا تَسْجُدُوا لِلشَّمْسِ وَلَا لِلْقَمَرِ وَاسْجُدُوا لِلَّهِ... (فصلت: 37-38)",
    agreementType: "متفق عليها",
    agreementNotes: "متفق على مشروعيتها. وعند الجمهور موضع السجدة عند الآية 38، وعند المالكية عند الآية 37.",
    significance: "الأمر بالسجود لخالق الشمس والقمر والكون، وبيان تسبيح الملائكة المقربين ليلاً ونهاراً بلا سآمة."
  },
  {
    sajdahNumber: 13,
    surahNumber: 53,
    surahName: "النجم",
    ayahNumber: 62,
    juz: 27,
    hizb: 53,
    madinahPage: 528,
    shamarlyPage: 456,
    ayahText: "فَاسْجُدُوا لِلَّهِ وَاعْبُدُوا ۩",
    sajdahWord: "فَاسْجُدُوا",
    agreementType: "متفق عليها عند الجمهور",
    agreementNotes: "أول سجدة أُنزلت وسجد فيها النبي صلى الله عليه وسلم والمسلمون والمشركون والجن والإنس بمكة.",
    significance: "أول سجدة صُدح بها في مكة المكرمة إعلاناً لوحدانية الله وعظمته وخضوع الخلائق له."
  },
  {
    sajdahNumber: 14,
    surahNumber: 84,
    surahName: "الانشقاق",
    ayahNumber: 21,
    juz: 30,
    hizb: 59,
    madinahPage: 589,
    shamarlyPage: 509,
    ayahText: "وَإِذَا قُرِئَ عَلَيْهِمُ الْقُرْآنُ لَا يَسْجُدُونَ ۩",
    sajdahWord: "لَا يَسْجُدُونَ",
    agreementType: "متفق عليها عند الجمهور",
    agreementNotes: "ثبتت في صحيح مسلم عن أبي هريرة رضي الله عنه أن رسول الله صلى الله عليه وسلم سجد فيها.",
    significance: "استنكار عدم الخضوع والسجود لله عند سماع آيات القرآن العظيم والمبادرة للسجود تصديقاً."
  },
  {
    sajdahNumber: 15,
    surahNumber: 96,
    surahName: "العلق",
    ayahNumber: 19,
    juz: 30,
    hizb: 60,
    madinahPage: 597,
    shamarlyPage: 516,
    ayahText: "كَلَّا لَا تُطِعْهُ وَاسْجُدْ وَاقْتَرِب ۩",
    sajdahWord: "وَاسْجُدْ وَاقْتَرِب",
    agreementType: "متفق عليها عند الجمهور",
    agreementNotes: "ختام سورة العلق، وأقرب ما يكون العبد من ربه وهو ساجد.",
    significance: "الأمر الإلهي الأعظم بالقرب من الله تعالى من خلال السجود والتذلل لجلاله."
  }
];

export const JUZ_NAMES: Record<number, { title: string; commonName: string; summary: string }> = {
  1: { title: "الجزء الأول", commonName: "الم", summary: "يحتوي على سورة الفاتحة ومطلع سورة البقرة؛ يرسخ أركان الإيمان وقصة استخلاف آدم عليه السلام وبني إسرائيل." },
  2: { title: "الجزء الثاني", commonName: "سيقول", summary: "أحكام تحويل القبلة، الصيام، القصاص، الوصية، الحج، وأحكام الأسرة والجهاد وقصة طالوت وجالوت." },
  3: { title: "الجزء الثالث", commonName: "تلك الرسل", summary: "يضم آية الكرسي، آيات الإنفاق، الربا، وأطول آية في القرآن (آية الدَّين)، مع مطلع سورة آل عمران وغزوة بدر." },
  4: { title: "الجزء الرابع", commonName: "لن تنالوا", summary: "استكمال سورة آل عمران مع أحداث غزوة أُحُد ودعوة الصبر، ثم مطلع سورة النساء وأحكام اليتامى والمواريث." },
  5: { title: "الجزء الخامس", commonName: "والمحصنات", summary: "أحكام النكاح والمحرمات، القوامة، الصلاة في الحرب (صلاة الخوف)، والهجرة والعدل." },
  6: { title: "الجزء السادس", commonName: "لا يحب الله", summary: "ختام سورة النساء مع بيان عقيدة التوحيد في عيسى عليه السلام، ثم مطلع سورة المائدة وأحكام العقود والصيد والوضوء." },
  7: { title: "الجزء السابع", commonName: "وإذا سمعوا", summary: "استكمال سورة المائدة (كفارة اليمين، تحريم الخمر والميسر)، ومطلع سورة الأنعام في توحيد الله ومحاجة المشركين." },
  8: { title: "الجزء الثامن", commonName: "ولو أننا", summary: "استكمال سورة الأنعام بالوصايا العشر، ومطلع سورة الأعراف بقصة آدم وإبليس وقصص الأنبياء." },
  9: { title: "الجزء التاسع", commonName: "قال الملأ", summary: "استكمال سورة الأعراف (قصة موسى مع فرعون وبني إسرائيل وسجدة الأعراف)، ومطلع سورة الأنفال وأحكام بدر." },
  10: { title: "الجزء العاشر", commonName: "واعلموا", summary: "استكمال سورة الأنفال مع أحكام الغنائم، ثم مطلع سورة التوبة والبراءة من المشركين وأحكام التوبة." },
  11: { title: "الجزء الحادي عشر", commonName: "يعتذرون", summary: "استكمال سورة التوبة بأوصاف المنافقين وفضل الصادقين، ثم سورة يونس كاملة ومطلع سورة هود." },
  12: { title: "الجزء الثاني عشر", commonName: "وما من دابة", summary: "قصص هود ونوح وصالح وإبراهيم ولوط وشعيب في سورة هود، ثم الثلثان الأولان من قصة يوسف عليه السلام." },
  13: { title: "الجزء الثالث عشر", commonName: "وما أبرئ", summary: "ختام سورة يوسف، سورة الرعد وتجليات القدرة الإلهية، وسورة إبراهيم ودعوات خليل الرحمن." },
  14: { title: "الجزء الرابع عشر", commonName: "ربما", summary: "سورة الحجر وحفظ الذكر وقصة خلق آدم، وسورة النحل (سورة النعم) والتفكر في آلاء الله." },
  15: { title: "الجزء الخامس عشر", commonName: "سبحان الذي", summary: "سورة الإسراء بحادثة المعراج والوصايا الإلهية، والنصف الأول من سورة الكهف (أصحاب الكهف وصاحب الجنتين وموسى والخضر)." },
  16: { title: "الجزء السادس عشر", commonName: "قال ألم", summary: "ختام سورة الكهف بذي القرنين، سورة مريم بقصص زكريا ويحيى وعيسى، وسورة طه ومناجاة موسى." },
  17: { title: "الجزء السابع عشر", commonName: "اقترب للناس", summary: "سورة الأنبياء وتوحيد الرسالات ومعجزات الرسل، وسورة الحج بأحكام المناسك والجهاد وسجدتي التلاوة." },
  18: { title: "الجزء الثامن عشر", commonName: "قد أفلح", summary: "سورة المؤمنون وصفات الفلاح، سورة النور وآداب الاستئذان وآية النور وحفظ الأعراض، ومطلع الفرقان." },
  19: { title: "الجزء التاسع عشر", commonName: "وقال الذين", summary: "استكمال الفرقان بصفات عباد الرحمن، سورة الشعراء وقصص الأنبياء وأقوامهم، ومطلع سورة النمل وقصة سليمان والهدهد." },
  20: { title: "الجزء العشرون", commonName: "أمن خلق", summary: "ختام سورة النمل، وسورة القصص كاملة (نشأة موسى وقارون وخسف داره)، ومطلع سورة العنكبوت والابتلاء." },
  21: { title: "الجزء الحادي والعشرون", commonName: "اتل ما أوحي", summary: "ختام العنكبوت، وسورة الروم وآيات الآفاق، وسورة لقمان ووصاياه لابنه، وسورة السجدة، ومطلع الأحزاب." },
  22: { title: "الجزء الثاني والعشرون", commonName: "ومن يقنت", summary: "استكمال سورة الأحزاب ومكانة أمهات المؤمنين وخاتم النبيين، وسورة سبأ، وسورة فاطر، ومطلع سورة يس." },
  23: { title: "الجزء الثالث والعشرون", commonName: "وما لي", summary: "استكمال سورة يس ومصائر الأمم، وسورة الصافات وحفظ السماء وذبح إسماعيل، وسورة ص وقصة داود وسليمان وأيوب، ومطلع الزمر." },
  24: { title: "الجزء الرابع والعشرون", commonName: "فمن أظلم", summary: "استكمال سورة الزمر والإخلاص، وسورة غافر (مؤمن آل فرعون وحملة العرش)، والثلثان الأولان من سورة فصلت." },
  25: { title: "الجزء الخامس والعشرون", commonName: "إليه يرد", summary: "ختام سورة فصلت، وسورة الشورى ومنهج التشريع، وسورة الزخرف، وسورة الدخان، وسورة الجاثية." },
  26: { title: "الجزء السادس والعشرون", commonName: "حم (الأحقاف)", summary: "سورة الأحقاف، وسورة محمد، وسورة الفتح وبيعة الرضوان، وسورة الحجرات وآداب الأخوة، وسورة ق، ومطلع الذاريات." },
  27: { title: "الجزء السابع والعشرون", commonName: "قال فما خطبكم", summary: "ختام الذاريات، وسورة الطور، وسورة النجم، وسورة القمر، وسورة الرحمن وآلاؤها، وسورة الواقعة، وسورة الحديد." },
  28: { title: "الجزء الثامن والعشرون", commonName: "قد سمع", summary: "عشر سور مدنية تعالج قضايا المجتمع والأسرة: المجادلة، الحشر، الممتحنة، الصف، الجمعة، المنافقون، التغابن، الطلاق، التحريم." },
  29: { title: "الجزء التاسع والعشرون", commonName: "تبارك", summary: "إحدى عشرة سورة مكية تبني العقيدة ويوم الحساب: الملك، القلم، الحاقة، المعارج، نوح، الجن، المزمل، المدثر، القيامة، الإنسان، المرسلات." },
  30: { title: "الجزء الثلاثون", commonName: "عمّ", summary: "سبع وثلاثون سورة مكية جليلة تهز الوجدان بالبعث والجزاء ومشاهد القيامة، من سورة النبأ إلى سورة الناس." }
};

export const JUZ_PAGE_RANGES: Record<number, { madinahStart: number; madinahEnd: number; shamarlyStart: number; shamarlyEnd: number; surahs: string[] }> = {
  1: { madinahStart: 1, madinahEnd: 21, shamarlyStart: 1, shamarlyEnd: 18, surahs: ["الفاتحة", "البقرة"] },
  2: { madinahStart: 22, madinahEnd: 41, shamarlyStart: 19, shamarlyEnd: 36, surahs: ["البقرة"] },
  3: { madinahStart: 42, madinahEnd: 61, shamarlyStart: 37, shamarlyEnd: 53, surahs: ["البقرة", "آل عمران"] },
  4: { madinahStart: 62, madinahEnd: 81, shamarlyStart: 54, shamarlyEnd: 70, surahs: ["آل عمران", "النساء"] },
  5: { madinahStart: 82, madinahEnd: 101, shamarlyStart: 71, shamarlyEnd: 87, surahs: ["النساء"] },
  6: { madinahStart: 102, madinahEnd: 121, shamarlyStart: 88, shamarlyEnd: 104, surahs: ["النساء", "المائدة"] },
  7: { madinahStart: 122, madinahEnd: 141, shamarlyStart: 105, shamarlyEnd: 121, surahs: ["المائدة", "الأنعام"] },
  8: { madinahStart: 142, madinahEnd: 161, shamarlyStart: 122, shamarlyEnd: 139, surahs: ["الأنعام", "الأعراف"] },
  9: { madinahStart: 162, madinahEnd: 181, shamarlyStart: 140, shamarlyEnd: 157, surahs: ["الأعراف", "الأنفال"] },
  10: { madinahStart: 182, madinahEnd: 201, shamarlyStart: 158, shamarlyEnd: 174, surahs: ["الأنفال", "التوبة"] },
  11: { madinahStart: 202, madinahEnd: 221, shamarlyStart: 175, shamarlyEnd: 191, surahs: ["التوبة", "يونس", "هود"] },
  12: { madinahStart: 222, madinahEnd: 241, shamarlyStart: 192, shamarlyEnd: 208, surahs: ["هود", "يوسف"] },
  13: { madinahStart: 242, madinahEnd: 261, shamarlyStart: 209, shamarlyEnd: 225, surahs: ["يوسف", "الرعد", "إبراهيم"] },
  14: { madinahStart: 262, madinahEnd: 281, shamarlyStart: 226, shamarlyEnd: 242, surahs: ["الحجر", "النحل"] },
  15: { madinahStart: 282, madinahEnd: 301, shamarlyStart: 243, shamarlyEnd: 259, surahs: ["الإسراء", "الكهف"] },
  16: { madinahStart: 302, madinahEnd: 321, shamarlyStart: 260, shamarlyEnd: 276, surahs: ["الكهف", "مريم", "طه"] },
  17: { madinahStart: 322, madinahEnd: 341, shamarlyStart: 277, shamarlyEnd: 294, surahs: ["الأنبياء", "الحج"] },
  18: { madinahStart: 342, madinahEnd: 361, shamarlyStart: 295, shamarlyEnd: 311, surahs: ["المؤمنون", "النور", "الفرقان"] },
  19: { madinahStart: 362, madinahEnd: 381, shamarlyStart: 312, shamarlyEnd: 328, surahs: ["الفرقان", "الشعراء", "النمل"] },
  20: { madinahStart: 382, madinahEnd: 401, shamarlyStart: 329, shamarlyEnd: 345, surahs: ["النمل", "القصص", "العنكبوت"] },
  21: { madinahStart: 402, madinahEnd: 421, shamarlyStart: 346, shamarlyEnd: 362, surahs: ["العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب"] },
  22: { madinahStart: 422, madinahEnd: 441, shamarlyStart: 363, shamarlyEnd: 379, surahs: ["الأحزاب", "سبأ", "فاطر", "يس"] },
  23: { madinahStart: 442, madinahEnd: 461, shamarlyStart: 380, shamarlyEnd: 397, surahs: ["يس", "الصافات", "ص", "الزمر"] },
  24: { madinahStart: 462, madinahEnd: 481, shamarlyStart: 398, shamarlyEnd: 415, surahs: ["الزمر", "غافر", "فصلت"] },
  25: { madinahStart: 482, madinahEnd: 501, shamarlyStart: 416, shamarlyEnd: 432, surahs: ["فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية"] },
  26: { madinahStart: 502, madinahEnd: 521, shamarlyStart: 433, shamarlyEnd: 449, surahs: ["الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات"] },
  27: { madinahStart: 522, madinahEnd: 541, shamarlyStart: 450, shamarlyEnd: 467, surahs: ["الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد"] },
  28: { madinahStart: 542, madinahEnd: 561, shamarlyStart: 468, shamarlyEnd: 485, surahs: ["المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم"] },
  29: { madinahStart: 562, madinahEnd: 581, shamarlyStart: 486, shamarlyEnd: 502, surahs: ["الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات"] },
  30: { madinahStart: 582, madinahEnd: 604, shamarlyStart: 503, shamarlyEnd: 522, surahs: ["النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"] }
};

/**
 * Returns Sajdah Info for an Ayah if it has a sajdah
 */
export const findSajdahByAyah = (surahNumber: number, ayahNumber: number): SajdahInfo | undefined => {
  return ALL_15_SAJDAHS.find(s => s.surahNumber === surahNumber && s.ayahNumber === ayahNumber);
};

/**
 * Returns Juz detailed information
 */
export const getJuzDetail = (juzNumber: number): JuzDetail | null => {
  if (juzNumber < 1 || juzNumber > 30) return null;
  const nameInfo = JUZ_NAMES[juzNumber] || { title: `الجزء ${juzNumber}`, commonName: `الجزء ${juzNumber}`, summary: '' };
  const pageRange = JUZ_PAGE_RANGES[juzNumber] || { madinahStart: 1, madinahEnd: 20, shamarlyStart: 1, shamarlyEnd: 18, surahs: [] };
  const hizb1 = (juzNumber - 1) * 2 + 1;
  const hizb2 = hizb1 + 1;

  return {
    number: juzNumber,
    name: `${nameInfo.title} (${nameInfo.commonName})`,
    commonTitle: nameInfo.commonName,
    startSurah: 0,
    startSurahName: '',
    startAyah: 0,
    endSurah: 0,
    endSurahName: '',
    endAyah: 0,
    madinahStartPage: pageRange.madinahStart,
    madinahEndPage: pageRange.madinahEnd,
    shamarlyStartPage: pageRange.shamarlyStart,
    shamarlyEndPage: pageRange.shamarlyEnd,
    hizbs: [hizb1, hizb2],
    surahNames: pageRange.surahs,
    totalAyahs: 0,
    summary: nameInfo.summary
  };
};

/**
 * Returns human-readable label for a Hizb Quarter (1-240)
 */
export const getHizbQuarterLabel = (quarterIndex: number): { hizbNumber: number; juzNumber: number; quarterInHizb: number; label: string; fullLabel: string } => {
  const q = Math.max(1, Math.min(240, quarterIndex));
  const hizbNumber = Math.floor((q - 1) / 4) + 1;
  const juzNumber = Math.floor((hizbNumber - 1) / 2) + 1;
  const quarterInHizb = ((q - 1) % 4) + 1;

  let label = 'الحزب';
  if (quarterInHizb === 1) label = `الحزب ${hizbNumber}`;
  else if (quarterInHizb === 2) label = `ربع الحزب ${hizbNumber}`;
  else if (quarterInHizb === 3) label = `نصف الحزب ${hizbNumber}`;
  else if (quarterInHizb === 4) label = `ثلاثة أرباع الحزب ${hizbNumber}`;

  const fullLabel = `${label} (الجزء ${juzNumber} - الربع ${q} من 240)`;

  return {
    hizbNumber,
    juzNumber,
    quarterInHizb,
    label,
    fullLabel
  };
};

export interface OpenQuranSymbolModalOptions {
  type?: 'sajdah' | 'hizb' | 'juz';
  sajdahNumber?: number; // 1-15
  hizbNumber?: number; // 1-60
  quarterNumber?: number; // 1-240
  juzNumber?: number; // 1-30
  surahNumber?: number;
  ayahNumberInSurah?: number;
}

export const openQuranSymbolModal = (options?: OpenQuranSymbolModalOptions) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-quran-symbol-modal', { detail: options || {} }));
  }
};
