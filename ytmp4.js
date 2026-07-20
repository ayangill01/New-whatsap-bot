const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');
const path = require('path');

module.exports = async ({ conn, m, args, command, jid, isGroup, sender, reply }) => {
  const url = args[0] || (m.quoted && (m.quoted.message?.conversation || m.quoted.message?.extendedTextMessage?.text));
  if (!url) return reply('❗️ Provide a YouTube URL. Usage: .ytmp4 <url>');

  try {
    const info = await ytdl.getInfo(url);
    const title = (info.videoDetails.title || 'video').replace(/[<>:"/\\|?*]/g, '').slice(0,50);

    const tmpVideo = path.join(os.tmpdir(), `${Date.now()}_video.mp4`);
    const tmpAudio = path.join(os.tmpdir(), `${Date.now()}_audio.webm`);
    const outFile = path.join(os.tmpdir(), `${Date.now()}_${title}.mp4`);

    await Promise.all([
      new Promise((res, rej) => {
        ytdl(url, { quality: 'highestvideo' })
          .pipe(fs.createWriteStream(tmpVideo))
          .on('finish', res)
          .on('error', rej);
      }),
      new Promise((res, rej) => {
        ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })
          .pipe(fs.createWriteStream(tmpAudio))
          .on('finish', res)
          .on('error', rej);
      })
    ]);

    await new Promise((res, rej) => {
      ffmpeg()
        .addInput(tmpVideo)
        .addInput(tmpAudio)
        .outputOptions(['-c:v copy','-c:a aac','-strict -2'])
        .save(outFile)
        .on('end', res)
        .on('error', rej);
    });

    const maxSize = 100 * 1024 * 1024; // 100 MB
    const stats = fs.statSync(outFile);
    if (stats.size > maxSize) return reply('❌ Video too large to send via WhatsApp. Try a lower quality or use another method.');

    await conn.sendMessage(jid, {
      video: fs.createReadStream(outFile),
      caption: title,
      mimetype: 'video/mp4'
    }, { quoted: m });

    try { fs.unlinkSync(tmpVideo); } catch(e){}
    try { fs.unlinkSync(tmpAudio); } catch(e){}
    try { fs.unlinkSync(outFile); } catch(e){}
  } catch (err) {
    console.error('ytmp4 error', err);
    reply('❌ Failed to download video: ' + (err.message || err));
  }
};
