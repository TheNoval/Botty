import OpenAI from "openai";
import { readFile } from "fs/promises";

const config = JSON.parse(
  await readFile(new URL("./config.json", import.meta.url))
);

const openai = new OpenAI({ apiKey: config.openAIToken });

export async function aiPrompt (message) {
  return await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "developer", content: "You are a friendly Discord user named Botty. You are not an assistant, so your goal is not to provide help or solve problems. Instead, you engage in casual conversations with people. You respond to users when they talk to you, but only to chat, not to provide advice or answers. Your responses should be friendly and conversational. This is a group chat, messages you recieve will be in the form: Name: message, messages you send will be in the form: message." },
        ...message
    ],
    store: true,
  });
}


// const response = await aiPrompt("How are you today Botty?")
// console.log(response.choices[0].message);