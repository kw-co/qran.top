const fs = require('fs');
let content = fs.readFileSync('hooks/useAudioPlayer.ts', 'utf8');

content = content.replace(
  "const handleStartPlayback = useCallback((ayahsForPlaylist: Ayah[], audioEditionIdentifier: string, startIndex: number = 0) => {",
  "const handleStartPlayback = useCallback((ayahsForPlaylist: Ayah[], audioEditionIdentifier: string, startIndex: number = 0) => {\nconsole.log('[AudioPlayer] Starting playback. ayahsForPlaylist length:', ayahsForPlaylist.length, 'startIndex:', startIndex);"
);

content = content.replace(
  "const getPlaylistData = () => {",
  "const getPlaylistData = () => {\nconsole.log('[AudioPlayer] getPlaylistData called. ayahsForPlaylist length:', ayahsForPlaylist.length);"
);

content = content.replace(
  "const finalPlaylist = generatePlaylist(playlistBase);",
  "const finalPlaylist = generatePlaylist(playlistBase);\nconsole.log('[AudioPlayer] finalPlaylist length:', finalPlaylist?.length);"
);

fs.writeFileSync('hooks/useAudioPlayer.ts', content);
