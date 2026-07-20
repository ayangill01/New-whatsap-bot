// autotyping.js — simple global toggle command
module.exports = async function ({ conn, m, args, reply }) {
  try {
    const opt = (args[0] || "").toLowerCase();
    if (!opt || !["on","off"].includes(opt)) {
      return reply(`Usage:\n.autotyping on\n.autotyping off\nCurrent: ${global.autotyping ? "ON" : "OFF"}`);
    }
    global.autotyping = opt === "on";
    return reply(`AutoTyping is now ${global.autotyping ? "ENABLED ✅" : "DISABLED ❌"}`);
  } catch (err) {
    console.error("autotyping command error:", err);
    return reply("Error toggling autotyping.");
  }
};
