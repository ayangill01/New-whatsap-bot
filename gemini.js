// Google Gemini AI Command Handler
const axios = require("axios");

module.exports = async function gemini({ conn, m, args, jid, reply }) {
  if (!args.length) {
    return reply(
      "✨ *Usage:* `.gemini your question here`\n\n_Powered by Google Gemini_"
    );
  }

  const question = args.join(" ");
  const loadingMsg = await reply("⏳ *Thinking...* 🤔");

  try {
    // Using free Gemini alternative API
    const response = await axios.get(
      `https://api.deepinfra.com/v1/openai/chat/completions`,
      {
        params: {
          model: "google/flan-t5-xxl",
          messages: JSON.stringify([{ role: "user", content: question }]),
        },
      }
    );

    const result =
      response.data?.choices?.[0]?.message?.content || "No response";

    await conn.sendMessage(
      jid,
      { text: `✨ *Google Gemini Response:*\n\n${result}` },
      { quoted: m }
    );
  } catch (err) {
    console.error("Gemini Error:", err.message);
    reply("❌ *Gemini Service Error*\nPlease try again later.");
  }
};
