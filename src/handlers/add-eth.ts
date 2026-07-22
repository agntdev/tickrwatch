import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { addToWatchlist } from "../toolkit/index.js";

// Add Ethereum to watchlist with default alert settings
const composer = new Composer<Ctx>();

composer.callbackQuery("add:ETH", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const userId = String(ctx.from?.id ?? 0);
  const item = await addToWatchlist(userId, "ETH", "Ethereum");
  
  // Show alert configuration menu
  const keyboard = inlineKeyboard([
    [inlineButton("📈 Threshold Alert", "alert:threshold:ETH")],
    [inlineButton("📊 Percent Move", "alert:percent:ETH")],
    [inlineButton("✅ Save with defaults", "alert:save:ETH")],
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `<b>Ethereum (ETH)</b> added to your watchlist!\n\n` +
    `Current price will be checked against your alert settings.\n\n` +
    `Choose alert type to configure:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

export default composer;
