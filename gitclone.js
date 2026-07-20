const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async ({ conn, m, args, command, jid, isGroup, sender, reply }) => {
  const url = args[0] || (m.quoted && (m.quoted.message?.conversation || m.quoted.message?.extendedTextMessage?.text));
  if (!url) return reply('❗️ Provide a GitHub repo URL. Usage: .gitclone <repo-url>');

  try {
    // Normalize GitHub URL
    const githubMatch = url.match(/github\.com\/(.+?)\/(.+?)(?:\.git|\/|$)/i);
    let downloadUrl;
    if (githubMatch) {
      const owner = githubMatch[1];
      const repo = githubMatch[2];
      // try main then master
      const tryMain = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
      const tryMaster = `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`;

      const tmpFile = path.join(os.tmpdir(), `${Date.now()}_${repo}.zip`);
      try {
        const r = await axios.get(tryMain, { responseType: 'stream' });
        await new Promise((res, rej) => {
          r.data.pipe(fs.createWriteStream(tmpFile)).on('finish', res).on('error', rej);
        });
      } catch (e) {
        // try master
        const r = await axios.get(tryMaster, { responseType: 'stream' });
        await new Promise((res, rej) => {
          r.data.pipe(fs.createWriteStream(tmpFile)).on('finish', res).on('error', rej);
        });
      }

      const stats = fs.statSync(tmpFile);
      if (stats.size > 100 * 1024 * 1024) return reply('❌ Repo archive is too large to send via WhatsApp.');

      await conn.sendMessage(jid, { document: fs.createReadStream(tmpFile), fileName: `${repo}.zip` }, { quoted: m });
      try { fs.unlinkSync(tmpFile); } catch (e) {}
      return;
    }

    // fallback: attempt to download raw url
    const tmpFile = path.join(os.tmpdir(), `${Date.now()}_download`);
    const r = await axios.get(url, { responseType: 'stream' });
    await new Promise((res, rej) => {
      r.data.pipe(fs.createWriteStream(tmpFile)).on('finish', res).on('error', rej);
    });
    await conn.sendMessage(jid, { document: fs.createReadStream(tmpFile), fileName: path.basename(url) }, { quoted: m });
    try { fs.unlinkSync(tmpFile); } catch (e) {}
  } catch (err) {
    console.error('gitclone error', err);
    reply('❌ Failed to clone/download: ' + (err.message || err));
  }
};
