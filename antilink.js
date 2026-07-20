// antilink.js - toggle antilink per group
module.exports = async function ({ conn, m, args, reply, jid }) {
  if (!jid || !jid.endsWith("@g.us")) return reply("This command works in groups only.");
  const mode = (args[0] || "").toLowerCase();
  if (!["on","off"].includes(mode)) {
    const status = (global.antilink && global.antilink[jid]) ? "ENABLED" : "DISABLED";
    return reply(`AntiLink status: ${status}\nUsage: .antilink on|off`);
  }
  global.antilink = global.antilink || {};
  if (mode === "on") {
    global.antilink[jid] = true;
    return reply("✅ AntiLink enabled for this group.");
  } else {
    delete global.antilink[jid];
    return reply("❌ AntiLink disabled for this group.");
  }
};
