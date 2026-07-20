// antilinkick.js
const pkRegex = /(chat\.whatsapp\.com|t\.me|discord\.gg|wa\.me|bit\.ly|youtu\.be|https?:\/\/)/i;

async function checkAntilinkKick({ conn, m }) {
  try {
    const jid = m.key.remoteJid;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '';
    if (!jid || !jid.endsWith('@g.us')) return false;
    if (!global.antilinkick || !global.antilinkick[jid]) return false;
    if (m.key.fromMe) return false;
    if (!pkRegex.test(text)) return false;

    // If bot is admin, remove offending user. If not admin, warn.
    try {
      const botId = (conn.user && conn.user.id) ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
      const meta = await conn.groupMetadata(jid);
      const botParticipant = meta.participants.find(p => (p.id || p)?.includes(botId));
      const botIsAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
      const offender = m.participant || m.key.participant || m.key.remoteJid;
      if (botIsAdmin) {
        await conn.groupParticipantsUpdate(jid, [offender], 'remove');
        await conn.sendMessage(jid, { text: `🚫 Link detected — user removed.` }, { quoted: m });
      } else {
        await conn.sendMessage(jid, { text: `⚠️ Link detected from ${offender}. Bot is not admin, cannot remove.` }, { quoted: m });
      }
      return true;
    } catch (e) {
      console.error("antilinkick action error:", e);
      try {
        await conn.sendMessage(jid, { text: `⚠️ Link detected. Could not remove user: ${e.message}` }, { quoted: m });
      } catch (er) {}
      return false;
    }
  } catch (err) {
    console.error("checkAntilinkKick error:", err);
    return false;
  }
}

module.exports = async function ({ conn, m, args, reply, jid }) {
  if (!jid || !jid.endsWith('@g.us')) return reply("This command works in groups only.");
  const mode = (args[0] || "").toLowerCase();
  if (!["on","off"].includes(mode)) {
    const status = (global.antilinkick && global.antilinkick[jid]) ? "ENABLED" : "DISABLED";
    return reply(`AntiLinkKick status: ${status}\nUsage: .antilinkick on|off`);
  }
  global.antilinkick = global.antilinkick || {};
  if (mode === "on") {
    global.antilinkick[jid] = true;
    return reply("✅ AntiLinkKick enabled for this group.");
  } else {
    delete global.antilinkick[jid];
    return reply("❌ AntiLinkKick disabled for this group.");
  }
};

module.exports.checkAntilinkKick = checkAntilinkKick;
