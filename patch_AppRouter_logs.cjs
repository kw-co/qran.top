const fs = require('fs');
let content = fs.readFileSync('components/AppRouter.tsx', 'utf8');

content = content.replace(
  "if (currentlyPlayingAyahGlobalNumber !== null && prevPlayingAyah !== null && playbackInfo?.isPlaying) {",
  "console.log('AppRouter play tracking:', { currentlyPlayingAyahGlobalNumber, prevPlayingAyah, isPlaying: playbackInfo?.isPlaying });\n             if (currentlyPlayingAyahGlobalNumber !== null && prevPlayingAyah !== null && playbackInfo?.isPlaying) {"
);

content = content.replace(
  "if (pathParts[0] === 'page' && playingPage !== undefined && prevPage !== undefined) {",
  "console.log('AppRouter page bounds:', { playingPage, prevPage, pathParts });\n                     if (pathParts[0] === 'page' && playingPage !== undefined && prevPage !== undefined) {"
);

content = content.replace(
  "if (currentPage === prevPage && playingPage !== prevPage) {",
  "console.log('AppRouter page change triggered:', { currentPage, prevPage, playingPage });\n                         if (currentPage === prevPage && playingPage !== prevPage) {"
);

fs.writeFileSync('components/AppRouter.tsx', content);
