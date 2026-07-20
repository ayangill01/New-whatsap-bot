// Tag Admin Command
module.exports = async function tagadmin({
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
    const admins = groupMetadata.participants.filter((p) => p.admin);

    if (admins.length === 0) {
      return reply("ℹ️ *No admins in this group!*");
    }

    const message = args.join(" ") || "📢 *ADMIN ALERT*";
    const adminJids = admins.map((a) => a.id);

    const text = `${message}\n\n${adminJids.map((a) => "@" + a.split("@")[0]).join(" ")}`;

    await conn.sendMessage(jid, { text, mentions: adminJids });

    reply("✅ *All admins tagged!*");
  } catch (err) {
    console.error("TagAdmin Error:", err);
    reply("❌ *Error tagging admins!*");
  }
};
