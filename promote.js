// Promote User to Admin Command
module.exports = async function promote({
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
      return reply("❌ *Only admins can promote members!*");
    }

    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentionedJid || mentionedJid.length === 0) {
      return reply("👤 *Mention a user to promote them as admin*");
    }

    const targetJid = mentionedJid[0];
    const targetUser = groupMetadata.participants.find((p) => p.id === targetJid);

    if (targetUser?.admin) {
      return reply("⚠️ *This user is already an admin!*");
    }

    await conn.groupParticipantsUpdate(jid, [targetJid], "promote");
    reply(`✅ *@${targetJid.split("@")[0]} has been promoted to admin!*`);
  } catch (err) {
    console.error("Promote Error:", err);
    reply("❌ *Error promoting user!*");
  }
};
