const fs = require('fs');
const file = 'components/SearchForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /interface SearchFormProps \{[\s\S]*?\}/,
    `interface SearchFormProps {
    onSearch: (query: string) => void;
    disabled?: boolean;
    initialQuery?: string;
    placeholder?: string;
    buttonText?: string;
}`
);

content = content.replace(
    /const SearchForm: React\.FC<SearchFormProps> = \(\{ onSearch, disabled = false, initialQuery = '' \}\) => \{/,
    `const SearchForm: React.FC<SearchFormProps> = ({ onSearch, disabled = false, initialQuery = '', placeholder = 'ابحث في القرآن الكريم... (مثال: الصلاة، الزكاة)', buttonText = 'بحث' }) => {`
);

content = content.replace(
    /placeholder="ابحث في القرآن الكريم\.\.\. \(مثال: الصلاة، الزكاة\)"/,
    `placeholder={placeholder}`
);

content = content.replace(
    /<span className="hidden sm:inline">بحث<\/span>/,
    `<span className="hidden sm:inline">{buttonText}</span>`
);

fs.writeFileSync(file, content);
console.log("Success");
