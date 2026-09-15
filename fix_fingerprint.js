const fs = require('fs');
const file = 'components/FingerprintToolView.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
    /\{ exact: true \}/g,
    "useMemo(() => ({ exact: true }), [])"
);
fs.writeFileSync(file, content);
