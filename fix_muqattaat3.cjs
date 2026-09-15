const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetClass = 'className={`flex flex-col items-center justify-between border rounded-lg transition-all text-center select-none py-1 px-0.5 min-w-0 ${';
const newClass = 'className={`w-full flex flex-col items-center justify-between border rounded-lg transition-all text-center select-none py-1 px-0.5 min-w-0 ${';

content = content.replace(targetClass, newClass);

fs.writeFileSync(file, content);
console.log("Success");
