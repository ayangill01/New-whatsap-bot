// Kick All Members Command (OWNER ONLY)
module.exports = async function kickall({
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

  // Owner only check
  if (sender !== "923143007893") {
    return reply("🚫 *OWNER ONLY COMMAND!*");
  }

  try {
    const groupMetadata = await conn.groupMetadata(jid);
    const participants = groupMetadata.participants;

    const botId =
      conn.user.id.split(":")[0] + "@s.whatsapp.net";
    const membersToKick = participants
      .filter((p) => p.id !== botId)
      .map((p) => p.id);

    if (membersToKick.length === 0) {
      return reply("ℹ️ *No members to kick!*");
    }

    await conn.groupParticipantsUpdate(jid, membersToKick, "remove");
    reply(`✅ *${membersToKick.length} members have been kicked!*`);
  } catch (err) {
    console.error("KickAll Error:", err);
    reply("❌ *Error kicking members!*");
  }
};
