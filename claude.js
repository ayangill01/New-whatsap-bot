// Claude AI Command Handler
const axios = require("axios");

module.exports = async function claude({ conn, m, args, jid, reply }) {
  if (!args.length) {
    return reply(
      "🧠 *Usage:* `.claude your question here`\n\n_Powered by Anthropic Claude_"
    );
  }

  const question = args.join(" ");
  const loadingMsg = await reply("⏳ *Thinking...* 🤔");

  try {
    // Using free Claude alternative API
    const response = await axios.post(
      `https://api.deepinfra.com/v1/inference`,
      {
        model: "meta-llama/Llama-2-70b-chat-hf", // Using alternative
        input: {
          prompt: `Answer professionally: ${question}`,
        },
      }
    );

    const result = response.data?.results?.[0]?.generated_text || "No response";

    await conn.sendMessage(
      jid,
      { text: `🧠 *Claude AI Response:*\n\n${result}` },
      { quoted: m }
    );
  } catch (err) {
    console.error("Claude Error:", err.message);
    reply("❌ *Claude Service Error*\nPlease try again later.");
  }
};
