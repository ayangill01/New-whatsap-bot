// Group Profile Picture Command
const fs = require("fs");
const path = require("path");

module.exports = async function gpp({ conn, m, args, jid, isGroup, reply }) {
  if (!isGroup) {
    return reply("❌ *This command only works in groups!*");
  }

  try {
    // Check if user sent an image
    const mediaMessage = m.message?.imageMessage;

    if (!mediaMessage) {
      return reply(
        "📸 *Reply to an image with `.gpp` to set it as group profile picture*"
      );
    }

    // Download the image
    const buffer = await conn.downloadMediaMessage(m);

    // Set as group profile picture
    await conn.updateProfilePicture(jid, buffer);
    reply("✅ *Group profile picture updated successfully!*");
  } catch (err) {
    console.error("Group PP Error:", err);
    reply("❌ *Error updating group profile picture!*");
  }
};
