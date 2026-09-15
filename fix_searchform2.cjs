const fs = require('fs');
const file = 'components/SearchForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /placeholder=\{disabled \? "جاري تحميل بيانات البحث\.\.\." : "ابحث عن كلمة، أو أدخل مرجعاً مثل \(البقرة ٢٥٥\)\.\.\."\}/,
    'placeholder={disabled ? "جاري تحميل بيانات البحث..." : placeholder}'
);

fs.writeFileSync(file, content);
console.log("Success");
