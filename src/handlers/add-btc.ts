import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { addToWatchlist } from "../toolkit/index.js";

// Add Bitcoin to watchlist with default alert settings
const composer = new Composer<Ctx>();

composer.callbackQuery("add:BTC", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const userId = String(ctx.from?.id ?? 0);
  const item = await addToWatchlist(userId, "BTC", "Bitcoin");
  
  // Show alert configuration menu
  const keyboard = inlineKeyboard([
    [inlineButton("📈 Threshold Alert", "alert:threshold:BTC")],
    [inlineButton("📊 Percent Move", "alert:percent:BTC")],
    [inlineButton("✅ Save with defaults", "alert:save:BTC")],
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `<b>Bitcoin (BTC)</b> added to your watchlist!\n\n` +
    `Current price will be checked against your alert settings.\n\n` +
    `Choose alert type to configure:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

export default composer;
