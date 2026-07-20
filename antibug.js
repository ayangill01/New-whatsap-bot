// antibug.js - minimal safe antibug handler
module.exports.antibugHandler = async function ({ conn, m }) {
  try {
    // Example heuristic: if message contains protocolMessage (delete/stub) treat as suspicious
    if (m.message?.protocolMessage || m.message?.messageStubType) {
      const jid = m.key.remoteJid;
      try { await conn.sendMessage(jid, { text: '⚠️ Detected suspicious message (anti-bug). Ignored.' }, { quoted: m }); } catch {}
      return true; // identified as bug
    }
    return false; // not a bug
  } catch (e) {
    console.error("antibugHandler error:", e);
    return false;
  }
};
