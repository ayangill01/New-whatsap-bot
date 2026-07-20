const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');
const path = require('path');

module.exports = async ({ conn, m, args, command, jid, isGroup, sender, reply }) => {
  const url = args[0] || (m.quoted && (m.quoted.message?.conversation || m.quoted.message?.extendedTextMessage?.text));
  if (!url) return reply('❗️ Provide a YouTube URL. Usage: .ytmp3 <url>');

  try {
    const info = await ytdl.getInfo(url);
    const title = (info.videoDetails.title || 'audio').replace(/[<>:"/\\|?*]/g, '').slice(0, 60);
    const tmpAudio = path.join(os.tmpdir(), `${Date.now()}_audio.webm`);
    const outMp3 = path.join(os.tmpdir(), `${Date.now()}_${title}.mp3`);

    await new Promise((res, rej) => {
      const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
      stream.pipe(fs.createWriteStream(tmpAudio));
      stream.on('end', res);
      stream.on('error', rej);
    });

    await new Promise((res, rej) => {
      ffmpeg(tmpAudio)
        .noVideo()
        .audioBitrate(128)
        .save(outMp3)
        .on('end', res)
        .on('error', rej);
    });

    const maxSize = 100 * 1024 * 1024; // 100 MB WhatsApp limit approximate
    const stats = fs.statSync(outMp3);
    if (stats.size > maxSize) return reply('❌ File too large to send via WhatsApp. Try a shorter audio or use another method.');

    await conn.sendMessage(jid, {
      audio: fs.createReadStream(outMp3),
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    }, { quoted: m });

    try { fs.unlinkSync(tmpAudio); } catch (e) {}
    try { fs.unlinkSync(outMp3); } catch (e) {}
  } catch (err) {
    console.error('ytmp3 error', err);
    reply('❌ Failed to download audio: ' + (err.message || err));
  }
};
