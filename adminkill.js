// Remove All Admins Command (OWNER ONLY)
module.exports = async function adminkill({
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
    const admins = groupMetadata.participants.filter((p) => p.admin);

    const botId =
      conn.user.id.split(":")[0] + "@s.whatsapp.net";
    const adminsToRemove = admins
      .filter((a) => a.id !== botId)
      .map((a) => a.id);

    if (adminsToRemove.length === 0) {
      return reply("ℹ️ *No admins to remove!*");
    }

    await conn.groupParticipantsUpdate(jid, adminsToRemove, "demote");
    reply(`✅ *${adminsToRemove.length} admins have been removed!*`);
  } catch (err) {
    console.error("AdminKill Error:", err);
    reply("❌ *Error removing admins!*");
  }
};
