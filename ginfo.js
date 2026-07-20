// Group Info Command
module.exports = async function ginfo({ conn, m, jid, isGroup, reply }) {
  if (!isGroup) {
    return reply("❌ *This command only works in groups!*");
  }

  try {
    const groupMetadata = await conn.groupMetadata(jid);
    const participants = groupMetadata.participants || [];
    const admins = participants.filter((p) => p.admin).length;
    const createdAt = new Date(groupMetadata.creation * 1000).toLocaleDateString();
    const desc = groupMetadata.desc || "No description";

    const info = `
╭─── *GROUP INFORMATION* ───╮
│ 👥 *Group Name:* ${groupMetadata.subject}
│ 📊 *Total Members:* ${participants.length}
│ 👨‍💼 *Admins:* ${admins}
│ 📝 *Description:* ${desc}
│ 📅 *Created:* ${createdAt}
│ 🆔 *Group ID:* ${jid}
│ 🔐 *Restricted:* ${groupMetadata.restrict ? "Yes" : "No"}
│ 🗣️ *Announce:* ${groupMetadata.announce ? "Yes" : "No"}
╰──────────────────────────╯
    `;

    reply(info);
  } catch (err) {
    console.error("Group Info Error:", err);
    reply("❌ *Error fetching group info!*");
  }
};
