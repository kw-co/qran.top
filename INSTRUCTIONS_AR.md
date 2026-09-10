# دليل المطور والتوثيق التقني لتطبيق QRAN.TOP

## جدول المحتويات
1.  [مقدمة](#1-مقدمة)
2.  [متطلبات التشغيل والبيئة](#2-متطلبات-التشغيل-والبيئة)
3.  [خطوات البناء والنشـر](#3-خطوات-البناء-والنشـر)
4.  [إعداد قاعدة بيانات Firebase](#4-إعداد-قاعدة-بيانات-firebase)
    *   [إعداد قواعد الأمان (Security Rules)](#41-إعداد-قواعد-الأمان-security-rules)
    *   [المجموعات والفهارس (Collections & Indexes)](#42-المجموعات-والفهارس-collections--indexes)
5.  [آلية عمل البرنامج والميزات](#5-آلية-عمل-البرنامج-والميزات)
    *   [فلسفة الإصدار المزدوج للمصحف](#51-فلسفة-الإصدار-المزدوج-للمصحف)
    *   [نظام الختمات الجماعية التفاعلية](#52-نظام-الختمات-الجماعية-التفاعلية)
    *   [محرك البحث الصوتي والنصي](#53-محرك-البحث-الصوتي-والنصي)
    *   [نظام التخزين بدون إنترنت وخطوط مصحف المدينة](#54-نظام-التخزين-بدون-إنترنت-وخطوط-مصحف-المدينة)
    *   [دفتر التدبر والملاحظات](#55-دفتر-التدبر-والملاحظات)
    *   [التكامل مع الذكاء الاصطناعي (Gemini API)](#56-التكامل-مع-الذكاء-الاصطناعي-gemini-api)
6.  [هيكلية المشروع](#6-هيكلية-المشروع)

---

## 1. مقدمة
تطبيق **QRAN.TOP** هو منصة قرآنية متطورة وسريعة مبنية كـ Progressive Web App (PWA). يجمع بين جمالية ودقة خطوط مصحف المدينة المنورة بالرسم العثماني المعتمد، وقوة محرك بحث إملائي وصوتي سريع، ونظام ختمات قرآنية جماعية تفاعلي مباشر دون الحاجة لجمع بيانات شخصية أو تسجيل حسابات.

**المكدس التقني:**
- **إطار العمل:** React 19 / TypeScript
- **التصميم:** Tailwind CSS مع نظام الثيمات المخصص
- **البيانات اللحظية والتفاعلية:** Firebase Firestore
- **أداة البناء:** Vite
- **دعم الأوفلاين والتخزين:** Service Worker & Cache API + IndexedDB

---

## 2. متطلبات التشغيل والبيئة
- بيئة Node.js (v18+)
- مدراء الحزم: npm
- خادم ويب أو استضافة ثابتة (GitHub Pages, Cloudflare Pages, Firebase Hosting)

---

## 3. خطوات البناء والنشـر
1. تثبيت الاعتمادات: `npm install`
2. بناء المشروع: `npm run build`
3. ينتج مجلد `dist` محتوياً على كافة ملفات التطبيق الثابتة والـ CNAME المهيأ لربط النطاق المخصص `qran.top`.

---

## 4. إعداد قاعدة بيانات Firebase

### 4.1. إعداد قواعد الأمان (Security Rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonts & Editions
    match /qran_fonts/{fontId} { allow read: if true; }
    match /qran_editions/{editionId} { allow read: if true; }
    
    // Discussion comments (anonymous)
    match /qran_comments/{commentId} {
      allow read: if resource.data.topicId != '__ADMIN_ACTIONS__' && resource.data.type != 'report';
      allow create: if request.resource.data.keys().hasAll(['topicId', 'text', 'parentId', 'createdAt'])
                    && request.resource.data.text is string
                    && request.resource.data.text.size() > 0 && request.resource.data.text.size() < 1000;
      allow update: if request.resource.data.replyCount == resource.data.replyCount + 1;
      allow delete: if false;
    }
    
    // Temporary notebook sync
    match /temp_notebook_sync/{code} {
      allow read, write, delete: if true;
    }
    
    // Khatmahs collection (Anonymous group reading)
    match /khatmahs/{khatmahId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['name', 'visibility', 'createdAt', 'juz_status']);
      allow update: if true;
      allow delete: if false;
    }
  }
}
```

---

## 5. آلية عمل البرنامج والميزات

### 5.1. فلسفة الإصدار المزدوج للمصحف
- **`quran-uthmani`**: نص القرآن بالرسم العثماني المعتمد لطبعة مجمع الملك فهد بالمدينة المنورة.
- **`quran-simple-clean`**: نص بالرسم الإملائي المجرد من التشكيل لعمليات البحث الفوري والمطابقة الصرفية والتراكيب اللغوية.

### 5.2. نظام الختمات الجماعية التفاعلية
- دعم حجز وقراءة الأجزاء (1 إلى 30) في الوقت الحقيقي عبر Firestore.
- حساب نسب الحجز ونسب الإنجاز فورياً.
- روابط مشاركة سريعة عبر واتساب وتيليجرام ونسخ الرابط المباشر.
- قفل تلقائي عند انتهاء المدة المحددة للختمة واعتبار الأجزاء المحجوزة مكتملة.

### 5.3. محرك البحث الصوتي والنصي
- معالجة ذكية للهمزات والألف والتاء المربوطة.
- إمكانية البحث بالصوت عبر Web Speech API.
- تحليل التراكيب المقترحة وجذور المفردات وإحصائيات الورود.

### 5.4. نظام التخزين بدون إنترنت وخطوط مصحف المدينة
- إمكانية تنزيل خطوط مصحف المدينة المنورة وتخزينها في Cache Storage.
- إخفاء خيار التحميل من القائمة تلقائياً بعد اكتمال التثبيت لراحة المستخدم.
- تشغيل التطبيق بالكامل بدون إنترنت بعد الزيارة الأولى عبر Service Worker.

### 5.5. دفتر التدبر والملاحظات
- حفظ الآيات الشخصية والملاحظات في IndexedDB & LocalStorage.
- دعم تصدير واستيراد الدفتر محلياً أو عبر رمز مؤقت دون أي حسابات.

### 5.6. التكامل مع الذكاء الاصطناعي (Gemini API)
- دعم مفتاح Google AI Studio المدخل من المستخدم والمخزن مشفراً في متصفحه لتحليل المتشابهات والمعاني البلاغية.

---

## 6. هيكلية المشروع
```
/
├── components/         # مكونات الواجهة (المصحف، الختمة، البحث، دفتر التدبر)
│   ├── khatmiyah/      # مكونات الختمة الجماعية (GroupKhatmahView, CreateKhatmahModal)
│   ├── settings/       # شاشات الإعدادات والبيانات والخطوط
│   ├── reader/         # مشغل التلاوة وعرض السور
│   └── icons.tsx       # أيقونات SVG المحسنة
├── contexts/           # سياقات الحالة العامة (SettingsContext, ThemeContext)
├── hooks/              # الخطافات المخصصة
├── public/             # الأصول الثابتة، CNAME، و Service Worker
├── utils/              # الدوال المساعدة للبحث والنصوص والتنقل
├── App.tsx             # الموجه وإدارة الشاشات
└── firebase.ts         # تهيئة الاتصال السحابي
```
