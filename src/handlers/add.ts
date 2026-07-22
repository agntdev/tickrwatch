import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

// /add command - Add a new ticker to watchlist via text input
const composer = new Composer<Ctx>();

composer.command("add", async (ctx) => {
  // Check if a ticker was provided as argument
  const text = ctx.message?.text ?? "";
  const args = text.split(/\s+/).slice(1); // Remove /add command
  
  if (args.length > 0) {
    // Ticker provided as argument
    const ticker = args[0].toUpperCase();
    ctx.session.step = "idle";
    ctx.session.pendingTicker = ticker;
    
    // Redirect to the add flow
    const keyboard = inlineKeyboard([
      [inlineButton("📈 Threshold Alert", `alert:threshold:${ticker}`)],
      [inlineButton("📊 Percent Move", `alert:percent:${ticker}`)],
      [inlineButton("✅ Save with defaults", `alert:save:${ticker}`)],
      [inlineButton("❌ Cancel", "menu:main")],
    ]);
    
    await ctx.reply(
      `<b>${ticker}</b> added to your watchlist!\n\n` +
      `Current price will be checked against your alert settings.\n\n` +
      `Choose alert type to configure:`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  } else {
    // No ticker provided - ask for input
    ctx.session.step = "awaiting_ticker";
    
    const keyboard = inlineKeyboard([
      [inlineButton("❌ Cancel", "menu:main")],
    ]);
    
    await ctx.reply(
      "Enter the ticker symbol for the cryptocurrency you want to track (e.g., BTC, ETH, SOL):",
      {
        reply_markup: {
          ...keyboard,
          force_reply: true,
        },
      }
    );
  }
});

// Handle ticker input when user replies to the /add prompt
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_ticker") return next();
  
  const ticker = ctx.message.text.trim().toUpperCase();
  if (!ticker || ticker.length > 10) {
    await ctx.reply("Please enter a valid ticker symbol (e.g., BTC, ETH, SOL).");
    return;
  }
  
  ctx.session.step = "idle";
  ctx.session.pendingTicker = ticker;
  
  const keyboard = inlineKeyboard([
    [inlineButton("📈 Threshold Alert", `alert:threshold:${ticker}`)],
    [inlineButton("📊 Percent Move", `alert:percent:${ticker}`)],
    [inlineButton("✅ Save with defaults", `alert:save:${ticker}`)],
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `<b>${ticker}</b> added to your watchlist!\n\n` +
    `Current price will be checked against your alert settings.\n\n` +
    `Choose alert type to configure:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

export default composer;
