const fs = require('fs');
const file = 'components/FingerprintToolView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /import SearchFiltersDrawer from '.\/search\/SearchFiltersDrawer';/,
    `import SearchFiltersDrawer from './search/SearchFiltersDrawer';\nimport SearchForm from './SearchForm';`
);

const formRegex = /<form onSubmit=\{handleSearch\} className="relative flex items-center">[\s\S]*?<\/form>/;

const newForm = `<SearchForm 
                    onSearch={(text) => {
                        setInputValue(text);
                        if (text.trim()) {
                            setQuery(text.trim());
                        }
                    }}
                    initialQuery={inputValue}
                    placeholder="اكتب كلمة واحدة لاستخراج بصمتها النورانية..."
                    buttonText="استخراج البصمة"
                />`;

content = content.replace(formRegex, newForm);

fs.writeFileSync(file, content);
console.log("Success");
