const fs = require('fs');

async function go() {
    const data = await import('./data/quranSimpleClean.ts');
    const { findWordsByFingerprint } = require('./utils/reverseSearch.ts'); // fail because ts
}
go();
