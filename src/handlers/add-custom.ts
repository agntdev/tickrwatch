import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

// Add custom ticker to watchlist - prompts user to enter ticker symbol
const composer = new Composer<Ctx>();

composer.callbackQuery("add:custom", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  // Set session step to await ticker input
  ctx.session.step = "awaiting_ticker";
  
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    "Enter the ticker symbol for the cryptocurrency you want to track (e.g., SOL, XRP, ADA):",
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
    }
  );
});

export default composer;
