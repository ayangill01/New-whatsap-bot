// Demote All Admins Command
module.exports = async function demoteall({
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

    const admins = groupMetadata.participants.filter(
      (p) => p.admin && p.id !== userJid
    ); // Exclude self

    if (admins.length === 0) {
      return reply("ℹ️ *No other admins to demote!*");
    }

    const adminJids = admins.map((p) => p.id);

    await conn.groupParticipantsUpdate(jid, adminJids, "demote");
    reply(`✅ *${adminJids.length} admins have been demoted!*`);
  } catch (err) {
    console.error("DemoteAll Error:", err);
    reply("❌ *Error demoting admins!*");
  }
};
