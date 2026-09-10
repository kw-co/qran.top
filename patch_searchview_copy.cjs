const fs = require('fs');
let content = fs.readFileSync('components/SearchView.tsx', 'utf8');

const handleCopyStart = content.indexOf('const handleCopyHighlightedWords = () => {');
const handleCopyEnd = content.indexOf('}, 2000);\n  };', handleCopyStart) + '}, 2000);\n  };'.length;

const newHandleCopy = `  const handleCopyHighlightedWords = () => {
    if (phraseFilters.length === 0) return;
    let textToCopy = '';
    let toastMsg = '';
    let nextMode = 0;

    if (copyHighlightedMode === 0) {
        textToCopy = phraseFilters.map(w => w.phrase).join('، ');
        toastMsg = 'تم النسخ: الكلمات فقط';
        nextMode = 1;
    } else {
        textToCopy = phraseFilters.map(w => {
            const timesStr = w.count === 1 ? 'مرة' : w.count === 2 ? 'مرتان' : w.count <= 10 ? 'مرات' : 'مرة';
            return \`\${w.phrase} (\${w.count} \${timesStr})\`;
        }).join('، ');
        toastMsg = 'تم النسخ: الكلمات + عدد التكرار';
        nextMode = 0;
    }

    copyToClipboard(textToCopy);
    setCopyHighlightedMode(nextMode);
    setCopyHighlightedToast(toastMsg);
    setIsHighlightedCopied(true);
    setTimeout(() => {
        setIsHighlightedCopied(false);
    }, 2000);
  };`;

content = content.substring(0, handleCopyStart) + newHandleCopy + content.substring(handleCopyEnd);
fs.writeFileSync('components/SearchView.tsx', content);
