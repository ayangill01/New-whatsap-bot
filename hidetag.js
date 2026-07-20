// Hidetag Command (Broadcast Mention)
module.exports = async function hidetag({
  conn,
  m,
  args,
  jid,
  isGroup,
  reply,
}) {
  if (!isGroup) {
    return reply("❌ *This command only works in groups!*");
  }

  try {
    const groupMetadata = await conn.groupMetadata(jid);
    const participants = groupMetadata.participants.map((p) => p.id);

    const message = args.join(" ") || "👻 *Hidetag Message*";

    await conn.sendMessage(jid, {
      text: message,
      mentions: participants,
    });

    reply("✅ *Broadcast mention sent!*");
  } catch (err) {
    console.error("Hidetag Error:", err);
    reply("❌ *Error sending hidetag!*");
  }
};
