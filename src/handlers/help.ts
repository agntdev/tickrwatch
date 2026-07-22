import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

// /help — plain-language explanation for non-technical users. This bot is
// button-driven: tell the user to tap /start to open the menu rather than listing
// slash commands. The same text is shown when the user taps the Help button on the
// main menu (`menu:help`). Enhance the copy for your specific bot; keep it short.
const composer = new Composer<Ctx>();

const HELP =
  "ℹ️ <b>How to use Crypto Watchlist Alerts</b>\n\n" +
  "1. Tap /start to open the main menu\n" +
  "2. Add cryptocurrencies to your watchlist\n" +
  "3. Set price alerts (threshold or percent move)\n" +
  "4. Get notified when conditions are met\n\n" +
  "📱 <b>Available Commands</b>\n" +
  "/start — Open the main menu\n" +
  "/help — Show this help message\n" +
  "/add — Add a ticker to your watchlist\n" +
  "/remove — Remove a ticker from your watchlist\n" +
  "/price — Check current prices\n" +
  "/dashboard — View usage statistics (owner only)\n\n" +
  "⚙️ <b>Settings</b>\n" +
  "Configure quiet hours, daily summaries, and alert cooldown in the settings menu.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP, { parse_mode: "HTML" });
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu, parse_mode: "HTML" });
});

export default composer;
