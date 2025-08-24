// main.mjs
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import express from "express"; // 追加

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 「お助け募集」チャンネルのみ対象
  if (message.channel.name !== "お助け募集") return;

  // 「#数字 スペース 8文字 本文...」をキャッチ
  const match = message.content.match(/^#(\d+)\s(.{8})(?:\s+([\s\S]*))?/);
  if (!match) {
    await message.delete().catch(() => {});
    return;
  }

  const level = parseInt(match[1], 10);
  const userIdLike = match[2];
  const restText = match[3] || "";

  let targetChannelName = null;
  if (level === 0) {
    targetChannelName = "お助け通常";
  } else if (level >= 1 && level <= 4) {
    targetChannelName = "レベル1～4";
  } else if (level >= 5 && level <= 7) {
    targetChannelName = "レベル5～7";
  } else if (level >= 8 && level <= 10) {
    targetChannelName = "レベル8〜10";
  } else if (level >= 11 && level <= 15) {
    targetChannelName = "レベル11～15";
  } else if (level >= 16) {
    const warn = await message.channel.send("⚠️ このレベルは無効です");
    setTimeout(() => {
      warn.delete().catch(() => {});
    }, 5000);
    await message.delete().catch(() => {});
    return;
  }

  if (targetChannelName) {
    const guild = message.guild;
    const targetChannel = guild.channels.cache.find(
      (ch) => ch.name === targetChannelName && ch.isTextBased()
    );

    if (targetChannel) {
      if (level === 0) {
        await targetChannel.send(userIdLike);
      } else {
        await targetChannel.send({
          content: userIdLike,
          embeds: [
            {
              title: `レベル${level}`,
              description: restText || "（本文なし）",
              color: 0x00aa00,
            },
          ],
        });
      }
    }
  }

  await message.delete().catch(() => {});
});

client.login(process.env.TOKEN);

// ----------------------------
// Render用のWebサーバー追加
// ----------------------------
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!"); // Renderがポート検出するため
});

app.listen(port, () => {
  console.log(`Webサーバー起動中: ${port}`);
});
