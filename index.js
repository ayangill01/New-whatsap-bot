// =============================================
// 🚀 REFERENCE DEPLOYMENT COMMANDS:
// 
// git add index.js
// git commit -m "sync configuration states from settings.js"
// git push origin main
// =============================================

const fs = require("fs");
const P = require("pino");
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, 
  DisconnectReason,
  delay // Imported delay helper from Baileys
} = require("@whiskeysockets/baileys");

const { handleCommand } = require("./menu/case");
const { loadSettings } = require("./settings");
const { storeMessage, handleMessageRevocation } = require("./antidelete");
const AntiLinkKick = require("./antilinkick.js");
const { antibugHandler } = require("./antibug.js"); 

// Print Git commands to the console for easy reference on startup
console.log("\n=============================================");
console.log("🚀 DEPLOYMENT COMMAND REMINDER:");
console.log("git add index.js");
console.log('git commit -m "sync configuration states from settings.js"');
console.log("git push origin main");
console.log("=============================================\n");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({ 
    version, 
    auth: state, 
    logger: P({ level: "fatal" }),
    printQRInTerminal: false // Disabled since we are explicitly using pairing codes
  });

  // ⚙️ Load operational states dynamically from settings.js
  const settings = typeof loadSettings === 'function' ? loadSettings() : {};
  
  // ✅ Explicitly setting your personal target fallback number here
  let ownerRaw = settings.ownerNumber?.[0] || "923143007893";
  const ownerJid = ownerRaw.includes("@s.whatsapp.net") ? ownerRaw : ownerRaw.replace(/\D/g, '') + "@s.whatsapp.net";

  global.sock = sock;
  global.settings = settings;
  global.signature = settings.signature || "> 𝗦𝗛𝗔𝗕𝗔𝗔𝗡 𝗚𝗜𝗟𝗟 ❦ ✓";
  global.owner = ownerJid;
  global.ownerNumber = ownerRaw;
  global.ownerName = settings.ownerName || "Shabaan Gill"; // ✅ Assigned clean profile name globally

  // ✅ Read public/private status from settings config dynamically
  global.publicMode = settings.public !== undefined ? settings.public : true; 

  // ✅ Active Feature Flags mapped explicitly from your configuration file
  global.antilink = {};
  global.antilinkick = {};
  global.antibug = settings.antiBug || false;
  global.autogreet = {};
  global.autotyping = settings.autoTyping || false;
  global.autoreact = settings.autoReact || false;
  global.autostatus = settings.autoStatusView || false;

  console.log("✅ BOT OWNER JID:", global.owner);
  console.log("👤 BOT OWNER NAME:", global.ownerName);
  console.log(`🔓 BOT STATUS: ${global.publicMode ? "Public Mode Enabled (Active in all chats)" : "Private Mode Enabled (Owner only)"}`);

  sock.ev.on("creds.update", saveCreds);

  // ✅ Fixed Pairing Code Lifecycle Handshake
  let pairingCodeRequested = false;
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {  
      console.log("✅ [BOT ONLINE] Connected to WhatsApp successfully!");  
    }  

    // Trigger pairing code if we are not registered and haven't requested one this lifecycle yet
    if (!sock.authState.creds.registered && !pairingCodeRequested) {
      pairingCodeRequested = true;
      
      // Using an immediate async block invocation with a proper await delay instead of standard setTimeout
      (async () => {
        // Allow Baileys internal socket structures 6 seconds to settle down completely
        await delay(6000); 

        let phoneNumber = process.env.PHONE_NUMBER || global.ownerNumber;

        if (!phoneNumber) {
          console.log("❌ ERROR: You must add 'PHONE_NUMBER' to your Railway Variables tab or global variable configuration.");
          pairingCodeRequested = false; 
          return;
        }

        // Clean phone number: remove +, spaces, dashes, leaving only pure digits
        phoneNumber = phoneNumber.replace(/\D/g, '');

        try {
          console.log(`📱 Requesting pairing code for: ${phoneNumber}`);
          const code = await sock.requestPairingCode(phoneNumber);
          
          if (code) {  
            // Formats the code dynamically into ABCD-EFGH visual segments if it isn't already formatted
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

            console.log("\n=============================================");
            console.log("🔗 WHATSAPP PAIRING CODE:");
            console.log(`👉  \x1b[36m${formattedCode}\x1b[0m  👈`);
            console.log("=============================================\n");
          } else {  
            console.log("❌ Pairing code generation returned empty. Check number format.");
            pairingCodeRequested = false;
          }  
        } catch (err) {
          console.error("❌ Failed to request pairing code:", err.message);
          // If the process fails due to early socket closures, allow a retry attempt on the next handshake
          pairingCodeRequested = false;
        }
      })();
    }

    if (connection === "close") {  
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);  
      console.log("❌ Disconnected. Reconnecting:", shouldReconnect);  
      if (shouldReconnect) {
        startBot();  
      } else {
        console.log("❌ Logged out of session. Please delete 'auth_info' directory and restart.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return; // Ignore status updates or empty payload notifications
    
    const jid = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    // ✅ AntiDelete
    if (settings.ANTIDELETE === true) {  
      try {  
        if (msg.message) storeMessage(msg);  
        if (msg.message?.protocolMessage?.type === 0) {  
          await handleMessageRevocation(sock, msg);  
          return;  
        }  
      } catch (err) {  
        console.error("❌ AntiDelete Error:", err.message);  
      }  
    }  

    // ✅ AutoTyping
    if (global.autotyping && jid !== "status@broadcast") {  
      try {  
        await sock.sendPresenceUpdate('composing', jid);  
      } catch (err) {  
        console.error("❌ AutoTyping Error:", err.message);  
      }  
    }  

    // ✅ AutoReact
    if (global.autoreact && jid !== "status@broadcast") {
      try {
        const hearts = [
          "❤️","☣️","🅣","🧡","💛","💚","💙","💜",
          "🖤","🤍","🤎","💕","💞","💓",
          "💗","💖","💘","💝","🇵🇰","♥️"
        ];
        const randomHeart = hearts[Math.floor(Math.random() * hearts.length)];
        await sock.sendMessage(jid, { react: { text: randomHeart, key: msg.key } });
      } catch (err) {
        console.error("❌ AutoReact Error:", err.message);
      }
    }  

    // ✅ AutoStatus View
    if (global.autostatus && jid === "status@broadcast") {  
      try {  
        await sock.readMessages([{  
          remoteJid: jid,  
          id: msg.key.id,  
          participant: msg.key.participant || msg.participant  
        }]);  
        console.log(`👁️ Status Seen: ${msg.key.participant || "Unknown"}`);  
      } catch (err) {  
        console.error("❌ AutoStatus View Error:", err.message);  
      }  
      return;  
    }  

    // ✅ Antilink
    if (
      jid.endsWith("@g.us") &&
      (global.antilink[jid] === true || settings.antiLink === true) &&
      /(chat\.whatsapp\.com|t\.me|discord\.gg|wa\.me|bit\.ly|youtu\.be|https?:\/\/)/i.test(text) &&
      !msg.key.fromMe
    ) {
      try {
        await sock.sendMessage(jid, {  
          delete: { remoteJid: jid, fromMe: false, id: msg.key.id, participant: msg.key.participant || msg.participant }  
        });  
      } catch (err) {
        console.error("❌ Antilink Delete Error:", err.message);
      }
    }

    // ✅ AntilinkKick
    if (
      jid.endsWith("@g.us") &&
      global.antilinkick[jid] === true &&
      /(chat\.whatsapp\.com|t\.me|discord\.gg|wa\.me|bit\.ly|youtu\.be|https?:\/\/)/i.test(text) &&
      !msg.key.fromMe
    ) {
      try {
        await AntiLinkKick.checkAntilinkKick({ conn: sock, m: msg });
      } catch (err) {
        console.error("❌ AntiLinkKick Error:", err.message || err);
      }
    }

    // ✅ AntiBug
    if (global.antibug === true && !msg.key.fromMe) {
      try {
        const isBug = await antibugHandler({ conn: sock, m: msg }); 
        if (isBug) return;
      } catch (err) {
        console.error("❌ AntiBug Error:", err.message || err);
      }
    }

    // ✅ Public/Private Mode command execution routing
    try {  
      await handleCommand(sock, msg, { publicMode: global.publicMode });  
    } catch (err) {  
      console.error("❌ Command error:", err.message || err);  
    }
  });

  // ✅ AutoGreet (Welcome/Farewell Update Logic)
  sock.ev.on("group-participants.update", async (update) => {
    const { id, participants, action } = update;
    if (settings.greetings !== true) return;

    try {
      const metadata = await sock.groupMetadata(id);
      const memberCount = metadata.participants.length;
      const groupName = metadata.subject || "Unnamed Group";
      const groupDesc = metadata.desc?.toString() || "No description set.";

      for (const user of participants) {
        const tag = `@${user.split("@")[0]}`;
        let message = "";

        if (action === "add") {
          message = `
┏━━━🔥༺ 𓆩💀𓆪 ༻🔥━━━┓
   💠 *WELCOME TO HELL* 💠
┗━━━🔥༺ 𓆩💀𓆪 ༻🔥━━━┛

👹 *Hey ${tag}, Welcome to*  
『 ${groupName} 』

⚡ *Current Members:* ${memberCount}  
📜 *Group Description:*  
『 ${groupDesc} 』

💀 *Attitude ON, Rules OFF*  
👾 *${settings.botName || "MEGATRON BOT"}* under command of *${global.ownerName}* welcomes you with POWER ⚡
          `;
        } else if (action === "remove") {
          message = `
┏━━━💔༺ 𓆩☠️𓆪 ༻💔━━━┓
   ❌ *GOODBYE WARRIOR* ❌
┗━━━💔༺ 𓆩☠️𓆪 ༻💔━━━┛

💔 ${tag} *has left the battlefield...*  
⚡ *Now only ${memberCount - 1} members remain in ${groupName}*  
☠️ *Hell doesn’t forget easily...*  
          `;
        }

        if (message) {
          await sock.sendMessage(id, { text: message, mentions: [user] });
        }
      }
    } catch (err) {
      console.error("❌ AutoGreet Error:", err.message);
    }
  });
}

startBot();
          
