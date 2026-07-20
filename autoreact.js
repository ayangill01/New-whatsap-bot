// 📂 File: autoreact.js
// 💖 AutoReact System — SHABAAN GILL

const fs = require("fs");
const path = require("path");

// 🧼 Clean number from JID
function getCleanNumber(jid = "") {
  return jid.replace(/\D/g, "");
}

// 🔍 Resolve sender number (works in group & DM)
function resolveSenderNumber(m, conn) {
  let senderJid =
    m.key?.participant ||
    m.message?.extendedTextMessage?.contextInfo?.participant ||
    m.participant ||
    m.sender ||
    (m.key?.fromMe && conn?.user?.id) ||
    m.key?.remoteJid;

  try {
    if (!senderJid && conn?.decodeJid) {
      senderJid = conn.decodeJid(m?.key?.remoteJid);
    }
  } catch {}

  return getCleanNumber(senderJid || "");
}

// 🛡️ Rate limiting map to prevent rate-overlimit errors
const reactCooldown = new Map();
const COOLDOWN_MS = 3000; // 3 second cooldown between reactions

function isRateLimited(jid) {
  const now = Date.now();
  const lastReact = reactCooldown.get(jid) || 0;
  
  if (now - lastReact < COOLDOWN_MS) {
    return true;
  }
  
  reactCooldown.set(jid, now);
  return false;
}

module.exports = async function ({ conn, m, reply, args, jid }) {
  try {
    const isGroup = jid.endsWith("@g.us");
    const senderNum = resolveSenderNumber(m, conn);
    if (!senderNum) {
      return reply("❌ 𝑼𝒏𝒂𝒃𝒍𝒆 𝒕𝒐 𝒅𝒆𝒕𝒆𝒄𝒕 𝒔𝒆𝒏𝒅𝒆𝒓 𝒏𝒖𝒎𝒃𝒆𝒓.");
    }

    // ⚙️ Toggle AutoReact
    const mode = (args[0] || "").toLowerCase();
    if (!["on", "off"].includes(mode)) {
      return reply(
`╭━━━〔 *💖 AUTO-REACT USAGE* 〕━━━╮
┃ ⚙️ 𝑼𝒔𝒆: 
┃   .autoreact on
┃   .autoreact off
╰━━━━━━━━━━━━━━━━━━━╯`
      );
    }

    global.autoreact = mode === "on";
    global.reactCooldown = reactCooldown;
    global.isRateLimited = isRateLimited;

    return reply(
`╭━━━〔 *💖 AUTO-REACT STATUS* 〕━━━╮
┃ ${mode === "on" ? "✅ 𝑨𝒖𝒕𝒐-𝑹𝒆𝒂𝒄𝒕: *ENABLED*" : "❌ 𝑨𝒖𝒕𝒐-𝑹𝒆𝒂𝒄𝒕: *DISABLED*"}
┃ 👤 𝑻𝒐𝒈𝒈𝒍𝒆𝒅 𝒃𝒚: +${senderNum}
┃ ⏱️ 𝑹𝒂𝒕𝒆 𝑳𝒊𝒎𝒊𝒕: 3 seconds
┃ 💜 𝑷𝒐𝒘𝒆𝒓𝒆𝒅 𝒃𝒚: ✧•🔥• ＳＨＡＢＡＡＮ ＧＩＬＬ •🔥•✧
╰━━━━━━━━━━━━━━━━━━━╯`
    );

  } catch (err) {
    console.error("❌ AutoReact Error:", err);
    return reply("💥 𝑺𝒐𝒎𝒆𝒕𝒉𝒊𝒏𝒈 𝒘𝒆𝒏𝒕 𝒘𝒓𝒐𝒏𝒈.");
  }
};
