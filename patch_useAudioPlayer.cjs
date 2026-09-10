const fs = require('fs');
let content = fs.readFileSync('hooks/useAudioPlayer.ts', 'utf8');

const targetFunction = `        const getPlaylistData = () => {
            if (ayahsForPlaylist.length > 0) return ayahsForPlaylist.slice(startIndex);
            const [path] = currentPath.substring(1).split('?');
            const pathParts = path.split('/').filter(Boolean);
            const uthmaniData = allQuranData?.['quran-uthmani-quran-academy'] || allQuranData?.['quran-uthmani']; // Fallback to either loaded version
            
            if (!uthmaniData) return [];

            // Case 1: Surah Playback
            if (pathParts[0] === 'surah' && pathParts[1]) {
                const surahNumber = parseInt(pathParts[1], 10);
                const surahData = uthmaniData.find(s => s.number === surahNumber);
                if (surahData) {
                    return surahData.ayahs.map(ayah => ({
                        ...ayah,
                        surah: { number: surahData.number, name: surahData.name, englishName: surahData.englishName, englishNameTranslation: surahData.englishNameTranslation, revelationType: surahData.revelationType, numberOfAyahs: surahData.numberOfAyahs }
                    })).slice(startIndex);
                }
            }
            
            // Case 2: Page Playback
            if (pathParts[0] === 'page' && pathParts[1]) {
                const pageNumber = parseInt(pathParts[1], 10);
                const pagePlaylist: Ayah[] = [];
                uthmaniData.forEach(surah => {
                    const ayahsOnPage = surah.ayahs.filter(a => a.page === pageNumber);
                    if (ayahsOnPage.length > 0) {
                        const mappedAyahs = ayahsOnPage.map(ayah => ({
                            ...ayah,
                            surah: { number: surah.number, name: surah.name, englishName: surah.englishName, englishNameTranslation: surah.englishNameTranslation, revelationType: surah.revelationType, numberOfAyahs: surah.numberOfAyahs }
                        }));
                        pagePlaylist.push(...mappedAyahs);
                    }
                });
                return pagePlaylist.slice(startIndex);
            }

            return [];
        };`;

const replacement = `        const getPlaylistData = () => {
            if (ayahsForPlaylist.length > 0) return ayahsForPlaylist.slice(startIndex);
            const [path] = currentPath.substring(1).split('?');
            const pathParts = path.split('/').filter(Boolean);
            const uthmaniData = allQuranData?.['quran-uthmani-quran-academy'] || allQuranData?.['quran-uthmani']; // Fallback to either loaded version
            
            if (!uthmaniData) return [];

            const allAyahsContinuous = uthmaniData.flatMap(surah => 
                surah.ayahs.map(ayah => ({
                    ...ayah,
                    surah: { number: surah.number, name: surah.name, englishName: surah.englishName, englishNameTranslation: surah.englishNameTranslation, revelationType: surah.revelationType, numberOfAyahs: surah.numberOfAyahs }
                }))
            );

            // Case 1: Surah Playback
            if (pathParts[0] === 'surah' && pathParts[1]) {
                const surahNumber = parseInt(pathParts[1], 10);
                const firstIndex = allAyahsContinuous.findIndex(a => a.surah?.number === surahNumber);
                if (firstIndex !== -1) {
                    return allAyahsContinuous.slice(firstIndex + startIndex);
                }
            }
            
            // Case 2: Page Playback
            if (pathParts[0] === 'page' && pathParts[1]) {
                const pageNumber = parseInt(pathParts[1], 10);
                const firstIndex = allAyahsContinuous.findIndex(a => a.page === pageNumber);
                if (firstIndex !== -1) {
                    return allAyahsContinuous.slice(firstIndex + startIndex);
                }
            }

            return [];
        };`;

if (content.includes("Case 1: Surah Playback")) {
    content = content.replace(targetFunction, replacement);
    fs.writeFileSync('hooks/useAudioPlayer.ts', content);
    console.log("Patched getPlaylistData successfully");
} else {
    console.log("Target not found");
}
