// GitHub Copilot AI Command Handler
const axios = require("axios");

module.exports = async function copilot({ conn, m, args, jid, reply }) {
  if (!args.length) {
    return reply(
      "🚀 *Usage:* `.copilot your coding question`\n\n_Powered by GitHub Copilot_"
    );
  }

  const question = args.join(" ");
  const loadingMsg = await reply("⏳ *Analyzing code...* 🚀");

  try {
    const response = await axios.post(
      `https://api.deepinfra.com/v1/inference`,
      {
        model: "meta-llama/Llama-2-70b-chat-hf",
        input: {
          prompt: `As a programming expert, help with: ${question}`,
        },
      }
    );

    const result = response.data?.results?.[0]?.generated_text || "No response";

    await conn.sendMessage(
      jid,
      { text: `🚀 *GitHub Copilot Response:*\n\n\`\`\`\n${result}\n\`\`\`` },
      { quoted: m }
    );
  } catch (err) {
    console.error("Copilot Error:", err.message);
    reply("❌ *Copilot Service Error*\nPlease try again later.");
  }
};
