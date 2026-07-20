const yts = require('yt-search');

module.exports = async ({ conn, m, args, command, jid, isGroup, sender, reply }) => {
  const query = args.join(' ');
  if (!query) return reply('Usage: .play <song name or url>');
  try {
    if (query.startsWith('http')) {
      const ytmp3 = require('./ytmp3.js');
      return await ytmp3({ conn, m, args: [query], command: 'ytmp3', jid, isGroup, sender, reply });
    }

    const r = await yts(query);
    const video = r.videos && r.videos.length ? r.videos[0] : null;
    if (!video) return reply('No results found.');
    const ytmp3 = require('./ytmp3.js');
    await ytmp3({ conn, m, args: [video.url], command: 'ytmp3', jid, isGroup, sender, reply });
  } catch (err) {
    console.error('play error', err);
    reply('❌ Play command error: ' + (err.message || err));
  }
};
