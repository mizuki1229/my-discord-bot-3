// main.mjs
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

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
    await message.delete().catch(() => {}); // フォーマット外も削除するならここ
    return;
  }

  const level = parseInt(match[1], 10);
  const userIdLike = match[2];     // 8文字部分
  const restText = match[3] || ""; // 本文（なければ空）

  let targetChannelName = null;
  if (level === 0) {
    targetChannelName = "お助け通常";
  } else if (level >= 1 && level <= 4) {
    targetChannelName = "レベル1～4";
  } else if (level >= 5 && level <= 7) {
    targetChannelName = "レベル5～7";
  } else if (level >= 8 && level <= 10) {
    targetChannelName = "レベル8〜10"; // ← 実際のチャンネル名に合わせる
  } else if (level >= 11 && level <= 15) {
    targetChannelName = "レベル11～15";
  } else if (level >= 16) {
    // 無効レベルの警告メッセージを送信
    const warn = await message.channel.send("⚠️ このレベルは無効です");
    setTimeout(() => {
      warn.delete().catch(() => {});
    }, 5000); // 5秒後に削除
    await message.delete().catch(() => {}); // 元の投稿も削除
    return;
  }

  if (targetChannelName) {
    const guild = message.guild;
    const targetChannel = guild.channels.cache.find(
      (ch) => ch.name === targetChannelName && ch.isTextBased()
    );

    if (targetChannel) {
      if (level === 0) {
        // レベル0は本文だけ送信
        await targetChannel.send(userIdLike);
      } else {
        // レベル付きは本文+埋め込み
        await targetChannel.send({
          content: userIdLike, // コピーできるのはこれだけ
          embeds: [
            {
              title: `レベル${level}`,
              description: restText || "（本文なし）",
              color: 0x00aa00, // Embed の色
            },
          ],
        });
      }
    }
  }

  // 元の「お助け募集」のメッセージを削除
  await message.delete().catch(() => {});
});

client.login(process.env.TOKEN);
