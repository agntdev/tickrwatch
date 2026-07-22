import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlist, removeFromWatchlist } from "../toolkit/index.js";

// /remove command - Remove a ticker from watchlist
const composer = new Composer<Ctx>();

composer.command("remove", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const args = text.split(/\s+/).slice(1);
  
  if (args.length > 0) {
    const ticker = args[0].toUpperCase();
    const userId = String(ctx.from?.id ?? 0);
    const removed = await removeFromWatchlist(userId, ticker);
    
    if (removed) {
      await ctx.reply(
        `<b>${ticker}</b> has been removed from your watchlist.`,
        { parse_mode: "HTML" }
      );
    } else {
      await ctx.reply(
        `Couldn't find <b>${ticker}</b> in your watchlist.`,
        { parse_mode: "HTML" }
      );
    }
    return;
  }
  
  const userId = String(ctx.from?.id ?? 0);
  const watchlist = await getWatchlist(userId);
  
  if (watchlist.length === 0) {
    await ctx.reply(
      "Your watchlist is empty.\n\n" +
      "Tap /start to add some tickers first."
    );
    return;
  }
  
  // Show watchlist with remove buttons
  const rows = watchlist.map((item) => [
    inlineButton(`🗑️ ${item.displayName} (${item.ticker})`, `remove:${item.ticker}`),
  ]);
  rows.push([inlineButton("❌ Cancel", "menu:main")]);
  
  const keyboard = inlineKeyboard(rows);
  
  await ctx.reply(
    "Select a ticker to remove from your watchlist:",
    {
      reply_markup: keyboard,
    }
  );
});

// Handle remove confirmation
composer.callbackQuery(/^remove:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  const userId = String(ctx.from?.id ?? 0);
  const removed = await removeFromWatchlist(userId, ticker);
  
  if (removed) {
    await ctx.reply(
      `<b>${ticker}</b> has been removed from your watchlist.`,
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.reply(
      `Couldn't find <b>${ticker}</b> in your watchlist.`,
      { parse_mode: "HTML" }
    );
  }
});

// Handle ticker argument in /remove command
composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text;
  if (!text.startsWith("/remove")) return next();
  
  const args = text.split(/\s+/).slice(1);
  if (args.length === 0) return;
  
  const ticker = args[0].toUpperCase();
  const userId = String(ctx.from?.id ?? 0);
  const removed = await removeFromWatchlist(userId, ticker);
  
  if (removed) {
    await ctx.reply(
      `<b>${ticker}</b> has been removed from your watchlist.`,
      { parse_mode: "HTML" }
    );
  } else {
    await ctx.reply(
      `Couldn't find <b>${ticker}</b> in your watchlist.`,
      { parse_mode: "HTML" }
    );
  }
});

export default composer;
