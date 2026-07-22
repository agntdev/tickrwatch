import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { updateUserProfile, updateUserCount } from "../toolkit/index.js";

// Register main menu items for adding common tickers
registerMainMenuItem({ label: "Bitcoin", data: "add:BTC", order: 10 });
registerMainMenuItem({ label: "Ethereum", data: "add:ETH", order: 20 });
registerMainMenuItem({ label: "Toncoin", data: "add:TON", order: 30 });
registerMainMenuItem({ label: "Other", data: "add:custom", order: 40 });

// The /start handler renders the bot's MAIN MENU — the primary way users operate
// a button-first bot. A feature adds its own button by calling
// `registerMainMenuItem(...)` in its own `src/handlers/<slug>.ts`; this handler
// renders whatever is registered (plus a Help button), so you do NOT edit this
// file to add a feature. Send ONE message — no placeholder line above the menu.
const composer = new Composer<Ctx>();

const WELCOME = "👋 Welcome! Tap a button below to get started.";

composer.command("start", async (ctx) => {
  // Track user for metrics
  const userId = String(ctx.from?.id ?? 0);
  await updateUserProfile(userId, { chatId: ctx.chat.id });
  await updateUserCount();
  
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

// "Back to menu" — re-render the main menu in place from any sub-view.
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
