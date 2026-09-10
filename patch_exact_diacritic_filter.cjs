const fs = require('fs');
const file = './hooks/useSearchLogic.ts';
let content = fs.readFileSync(file, 'utf8');

const oldFilter = `return dFilters.some(df => cleanAyahText.includes(df));`;
const newFilter = `return dFilters.some(df => {
                        const regex = new RegExp(\`(^|\\\\s)\${df}(\\\\s|$)\`);
                        return regex.test(cleanAyahText);
                    });`;

content = content.replace(oldFilter, newFilter);
fs.writeFileSync(file, content);
