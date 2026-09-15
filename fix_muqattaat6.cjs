const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

const reportRegex = /const report = `====================================\\nتقرير البصمة النورانية \(29 سورة قرآنية\)[\s\S]*?المصدر: تطبيق القرآن الكريم التدبري`;/m;

const reportRepl = "const report = `====================================\\nتقرير البصمة النورانية (29 سورة قرآنية)\\n====================================\\n• كلمة / جملة البحث: \"${query}\"\\n• عدد السور النورانية المطابقة: ${presentCount} من 29 سورة\\n• مصفوفة التواجد الثنائية (29-bit):  ${binaryString}\\n------------------------------------\\nالتحويلات العددية لأنظمة العد:\\n------------------------------------\\n• النظام الثنائي (Base 2):       ${binaryString}\\n• النظام السداسي (Base 6):       ${base6Val}\\n• النظام السباعي (Base 7):       ${base7Val}\\n• النظام العشري (Base 10):      ${decimalVal}\\n• النظام الست عشري (Base 16):   ${hexVal}\\n• النظام الإثنا عشري (Base 12):  ${base12Val}\\n• النظام التسعة عشري (Base 19):  ${base19Val}\\n• خاصية القسمة على 19:          ${isDivisibleBy19 ? \`يقبل القسمة تماماً (الناتج: \${quotient19})\` : \`لا يقبل القسمة (الباقي: \${remainder19})\`}\\n------------------------------------\\nتفصيل السور الـ 29 بترتيب المصحف:\\n------------------------------------\\n${breakdown}\\n====================================\\nالمصدر: تطبيق القرآن الكريم التدبري`;";

content = content.replace(reportRegex, reportRepl);

fs.writeFileSync(file, content);
console.log("Success");
