// Demote Admin Command
module.exports = async function demote({
  conn,
  m,
  jid,
  isGroup,
  reply,
  sender,
}) {
  if (!isGroup) {
    return reply("❌ *This command only works in groups!*");
  }

  try {
    const groupMetadata = await conn.groupMetadata(jid);
    const userJid = m.key.fromMe
      ? conn.user.id.split(":")[0] + "@s.whatsapp.net"
      : m.key.participant || m.key.remoteJid;
    const userAdmin = groupMetadata.participants.find((p) => p.id === userJid);

    if (!userAdmin?.admin) {
      return reply("❌ *Only admins can demote members!*");
    }

    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentionedJid || mentionedJid.length === 0) {
      return reply("👤 *Mention an admin to demote them*");
    }

    const targetJid = mentionedJid[0];
    const targetUser = groupMetadata.participants.find((p) => p.id === targetJid);

    if (!targetUser?.admin) {
      return reply("⚠️ *This user is not an admin!*");
    }

    await conn.groupParticipantsUpdate(jid, [targetJid], "demote");
    reply(`✅ *@${targetJid.split("@")[0]} has been demoted!*`);
  } catch (err) {
    console.error("Demote Error:", err);
    reply("❌ *Error demoting user!*");
  }
};
