const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const apiKey = "AIzaSyCho6Qx42N2WaCxSTU-goqKfzXD8WZNq9o"; // from env.local
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  try {
    const result = await model.generateContent("Hello!");
    console.log("Success! Output:", result.response.text());
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
