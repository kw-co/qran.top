const fs = require('fs');
let code = fs.readFileSync('components/PrivacyPolicyView.tsx', 'utf8');

const privacyUpdate = `
                                <li><strong>أدوات التحليل والبنية:</strong> أدوات مثل "ماسح الحروف الأبجدية" و"البصمة النورانية" تعمل محلياً على جهازك بالكامل ولا يتم تخزين أو مشاركة أي بيانات متعلقة بالبحث.</li>`;

if (!code.includes('أدوات التحليل والبنية')) {
    code = code.replace(
        /<li><strong>النقاشات والتدبر العام:<\/strong> المشاركات والتعليقات العامة تُحفظ كنصوص عامة مجهولة الهوية\.<\/li>/,
        `<li><strong>النقاشات والتدبر العام:</strong> المشاركات والتعليقات العامة تُحفظ كنصوص عامة مجهولة الهوية.</li>${privacyUpdate}`
    );
    fs.writeFileSync('components/PrivacyPolicyView.tsx', code);
    console.log("Patched PrivacyPolicyView.");
} else {
    console.log("Already patched.");
}
