const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

const startBlock = content.indexOf('{sortedHighlightedWords.length > 0 && (');
const endBlock = content.indexOf('</div>\n            )}', startBlock) + '</div>\n            )}'.length;

content = content.substring(0, startBlock) + content.substring(endBlock);
fs.writeFileSync('components/SearchView.tsx', content);
