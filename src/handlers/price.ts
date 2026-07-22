import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlist } from "../toolkit/index.js";
import { fetchPriceData, formatPrice, formatPercentageChange, formatLargeNumber } from "../toolkit/index.js";

// /price command - View current prices for watchlist or specific ticker
const composer = new Composer<Ctx>();

composer.command("price", async (ctx) => {
  const userId = String(ctx.from?.id ?? 0);
  const watchlist = await getWatchlist(userId);
  
  if (watchlist.length === 0) {
    await ctx.reply(
      "Your watchlist is empty.\n\n" +
      "Tap /start to add some tickers first."
    );
    return;
  }
  
  const rows = watchlist.map((item) => [
    inlineButton(`${item.displayName} (${item.ticker})`, `price:refresh:${item.ticker}`),
  ]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  
  await ctx.reply(
    "📊 <b>Your Watchlist</b>\n\nTap a ticker to check its current price:",
    {
      reply_markup: inlineKeyboard(rows),
      parse_mode: "HTML",
    }
  );
});

// Handle specific ticker price check via text
composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text;
  if (!text.startsWith("/price")) return next();
  
  const args = text.split(/\s+/).slice(1);
  if (args.length === 0) return;
  
  const ticker = args[0].toUpperCase();
  await ctx.replyWithChatAction("typing");
  
  const priceData = await fetchPriceData(ticker);
  if (!priceData) {
    await ctx.reply(
      `Couldn't find price data for <b>${ticker}</b>.\n\n` +
      `Check the ticker symbol and try again.`,
      { parse_mode: "HTML" }
    );
    return;
  }
  
  const message = 
    `📊 <b>${priceData.ticker}</b>\n\n` +
    `Price: ${formatPrice(priceData.priceUsd)}\n` +
    `24h Change: ${formatPercentageChange(priceData.priceChangePercentage24h)}\n` +
    `1h Change: ${formatPercentageChange(priceData.priceChangePercentage1h)}\n` +
    `7d Change: ${formatPercentageChange(priceData.priceChangePercentage7d)}\n\n` +
    `Market Cap: ${formatLargeNumber(priceData.marketCap)}\n` +
    `Volume 24h: ${formatLargeNumber(priceData.volume24h)}`;
  
  const keyboard = inlineKeyboard([
    [inlineButton("🔄 Refresh", `price:refresh:${ticker}`)],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

// Handle price refresh callback
composer.callbackQuery(/^price:refresh:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) return;
  
  await ctx.replyWithChatAction("typing");
  const priceData = await fetchPriceData(ticker);
  if (!priceData) {
    await ctx.reply(
      `Couldn't refresh price data for <b>${ticker}</b>.`,
      { parse_mode: "HTML" }
    );
    return;
  }
  
  const message = 
    `📊 <b>${priceData.ticker}</b>\n\n` +
    `Price: ${formatPrice(priceData.priceUsd)}\n` +
    `24h Change: ${formatPercentageChange(priceData.priceChangePercentage24h)}\n` +
    `1h Change: ${formatPercentageChange(priceData.priceChangePercentage1h)}\n` +
    `7d Change: ${formatPercentageChange(priceData.priceChangePercentage7d)}\n\n` +
    `Market Cap: ${formatLargeNumber(priceData.marketCap)}\n` +
    `Volume 24h: ${formatLargeNumber(priceData.volume24h)}`;
  
  const keyboard = inlineKeyboard([
    [inlineButton("🔄 Refresh", `price:refresh:${ticker}`)],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

export default composer;