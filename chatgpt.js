// ChatGPT AI Command Handler
const axios = require("axios");

module.exports = async function chatgpt({ conn, m, args, jid, reply }) {
  if (!args.length) {
    return reply("💬 *Usage:* `.chatgpt your question here`\n\n_Powered by OpenAI API_");
  }

  const question = args.join(" ");
  const loadingMsg = await reply("⏳ *Thinking...* 🤔");

  try {
    // Using free alternative API (replace with your OpenAI API if you have)
    const response = await axios.get(
      `https://api.deepinfra.com/v1/openai/chat/completions`,
      {
        params: {
          model: "gpt-3.5-turbo",
          messages: JSON.stringify([{ role: "user", content: question }]),
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result =
      response.data?.choices?.[0]?.message?.content ||
      "No response from ChatGPT";

    await conn.sendMessage(
      jid,
      { text: `🤖 *ChatGPT Response:*\n\n${result}` },
      { quoted: m }
    );
  } catch (err) {
    console.error("ChatGPT Error:", err.message);
    reply(
      "❌ *ChatGPT Service Error*\nPlease try again later or check your API key."
    );
  }
};
