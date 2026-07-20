const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async ({ conn, m, args, command, jid, isGroup, sender, reply }) => {
  const url = args[0] || (m.quoted && (m.quoted.message?.conversation || m.quoted.message?.extendedTextMessage?.text));
  if (!url) return reply('❗️ Provide a MediaFire URL. Usage: .mediafire <url>');

  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    // Try known selectors
    let dl = $('a#downloadButton').attr('href') || $('a').filter((i,el) => $(el).attr('href') && $(el).attr('href').includes('download')).first().attr('href');
    if (!dl) {
      // try regex fallback
      const match = res.data.match(/https:\/\/download[\d\.]*\.mediafire\.com\/[^"]+/i);
      if (match) dl = match[0];
    }

    if (!dl) return reply('❌ Could not find direct download link on MediaFire page.');

    const tmpFile = path.join(os.tmpdir(), `${Date.now()}_mediafire`);
    const r = await axios.get(dl, { responseType: 'stream' });
    await new Promise((resv, rej) => {
      r.data.pipe(fs.createWriteStream(tmpFile)).on('finish', resv).on('error', rej);
    });

    const stats = fs.statSync(tmpFile);
    if (stats.size > 100 * 1024 * 1024) return reply('❌ File too large to send via WhatsApp.');

    await conn.sendMessage(jid, { document: fs.createReadStream(tmpFile), fileName: path.basename(dl) }, { quoted: m });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
  } catch (err) {
    console.error('mediafire error', err);
    reply('❌ MediaFire download failed: ' + (err.message || err));
  }
};
