const fs = require('fs');
const file = 'components/search/MuqattaatBinaryMatrix.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<!-- 1\. Visual Matrix -->/g, '{/* 1. Visual Matrix */}');
content = content.replace(/<!-- 2\. Radix converters cards -->/g, '{/* 2. Radix converters cards */}');

fs.writeFileSync(file, content);
console.log("Success");
