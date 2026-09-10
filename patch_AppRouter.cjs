const fs = require('fs');
let content = fs.readFileSync('components/AppRouter.tsx', 'utf8');

const targetStr = "const isSearchPage = pathParts[0] === 'search';";

const injection = `
    const prevPlayingAyahRef = React.useRef<number | null>(currentlyPlayingAyahGlobalNumber);

    React.useEffect(() => {
        const prevPlayingAyah = prevPlayingAyahRef.current;
        if (currentlyPlayingAyahGlobalNumber !== prevPlayingAyah) {
             prevPlayingAyahRef.current = currentlyPlayingAyahGlobalNumber;
             
             if (currentlyPlayingAyahGlobalNumber !== null && prevPlayingAyah !== null && playbackInfo?.isPlaying) {
                 const simpleData = allQuranData?.['quran-simple-clean'];
                 if (simpleData) {
                     let playingPage: number | undefined;
                     let playingSurah: number | undefined;
                     let prevPage: number | undefined;
                     let prevSurah: number | undefined;
                     
                     for (const s of simpleData) {
                         if (playingPage === undefined || playingSurah === undefined) {
                             const ayah = s.ayahs.find(a => a.number === currentlyPlayingAyahGlobalNumber);
                             if (ayah) {
                                 playingPage = ayah.page;
                                 playingSurah = s.number;
                             }
                         }
                         if (prevPage === undefined || prevSurah === undefined) {
                             const prevA = s.ayahs.find(a => a.number === prevPlayingAyah);
                             if (prevA) {
                                 prevPage = prevA.page;
                                 prevSurah = s.number;
                             }
                         }
                         if (playingPage !== undefined && prevPage !== undefined) break;
                     }

                     if (pathParts[0] === 'page' && playingPage !== undefined && prevPage !== undefined) {
                         const currentPage = parseInt(pathParts[1], 10);
                         if (currentPage === prevPage && playingPage !== prevPage) {
                             window.location.hash = \`#/page/\${playingPage}\`;
                         }
                     } else if (pathParts[0] === 'surah' && playingSurah !== undefined && prevSurah !== undefined) {
                         const currentSurah = parseInt(pathParts[1], 10);
                         if (currentSurah === prevSurah && playingSurah !== prevSurah) {
                             window.location.hash = \`#/surah/\${playingSurah}\`;
                         }
                     }
                 }
             }
        }
    }, [currentlyPlayingAyahGlobalNumber, playbackInfo?.isPlaying, pathParts, allQuranData]);

`;

if (!content.includes('prevPlayingAyahRef.current = currentlyPlayingAyahGlobalNumber;')) {
    content = content.replace(targetStr, injection + targetStr);
    fs.writeFileSync('components/AppRouter.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Already patched");
}
