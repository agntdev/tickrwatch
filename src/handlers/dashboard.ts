import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getOwnerMetrics, updateUserCount } from "../toolkit/index.js";

// /dashboard command - View aggregated usage and alert statistics (owner only)
const composer = new Composer<Ctx>();

// Owner user ID - in production, this would come from environment variable
const OWNER_USER_ID = process.env.OWNER_USER_ID;

composer.command("dashboard", async (ctx) => {
  // Check if user is owner
  const userId = String(ctx.from?.id ?? 0);
  if (OWNER_USER_ID && userId !== OWNER_USER_ID) {
    await ctx.reply(
      "⛔ Access denied.\n\n" +
      "This command is only available to the bot owner."
    );
    return;
  }
  
  await ctx.replyWithChatAction("typing");
  
  // Update user count and get metrics
  await updateUserCount();
  const metrics = await getOwnerMetrics();
  
  // Format alert counts by ticker
  let tickerStats = "";
  const tickerEntries = Object.entries(metrics.alertCountsByTicker);
  if (tickerEntries.length > 0) {
    tickerEntries.sort((a, b) => b[1] - a[1]); // Sort by count descending
    tickerStats = tickerEntries
      .map(([ticker, count]) => `${ticker}: ${count} alerts`)
      .join("\n");
  } else {
    tickerStats = "No alerts triggered yet";
  }
  
  const message = 
    `📈 <b>Owner Dashboard</b>\n\n` +
    `👥 Total Users: ${metrics.userCount}\n\n` +
    `📊 <b>Alert Statistics</b>\n` +
    `Threshold Alerts: ${metrics.alertTypesDistribution.threshold}\n` +
    `Percent Move Alerts: ${metrics.alertTypesDistribution.percentMove}\n\n` +
    `🎯 <b>Alerts by Ticker</b>\n` +
    tickerStats;
  
  const keyboard = inlineKeyboard([
    [inlineButton("🔄 Refresh", "dashboard:refresh")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

// Handle dashboard refresh
composer.callbackQuery("dashboard:refresh", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  await updateUserCount();
  const metrics = await getOwnerMetrics();
  
  let tickerStats = "";
  const tickerEntries = Object.entries(metrics.alertCountsByTicker);
  if (tickerEntries.length > 0) {
    tickerEntries.sort((a, b) => b[1] - a[1]);
    tickerStats = tickerEntries
      .map(([ticker, count]) => `${ticker}: ${count} alerts`)
      .join("\n");
  } else {
    tickerStats = "No alerts triggered yet";
  }
  
  const message = 
    `📈 <b>Owner Dashboard</b>\n\n` +
    `👥 Total Users: ${metrics.userCount}\n\n` +
    `📊 <b>Alert Statistics</b>\n` +
    `Threshold Alerts: ${metrics.alertTypesDistribution.threshold}\n` +
    `Percent Move Alerts: ${metrics.alertTypesDistribution.percentMove}\n\n` +
    `🎯 <b>Alerts by Ticker</b>\n` +
    tickerStats;
  
  const keyboard = inlineKeyboard([
    [inlineButton("🔄 Refresh", "dashboard:refresh")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

export default composer;
