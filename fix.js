const fs = require('fs');
let code = fs.readFileSync('hooks/useQuranData.ts', 'utf8');
code = code.replace('if (successSurahs) { {', 'if (successSurahs) {');
fs.writeFileSync('hooks/useQuranData.ts', code);
