const axios = require("axios")
require("dotenv").config()

async function run() {
  try {
    console.log("🚀 Starting request...")

    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        messages: [
          { role: "user", content: "قل مرحبا من Node" }
        ]
      },
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    )

    console.log("✅ RESPONSE:")
    console.log(res.data)
  } catch (err) {
    console.log("❌ ERROR:")
    console.log(err.response?.data || err.message)
  }
}

run()