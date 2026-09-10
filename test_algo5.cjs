const http = require('https');

// Simulate getArabicRoot
const quranRoots = require('./utils/roots.ts'); // Wait, roots.ts is TS. We can't require it directly in Node easily.
