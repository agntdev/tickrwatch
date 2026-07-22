import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { addToWatchlist, getUserProfile, updateUserProfile } from "../toolkit/index.js";

// Alert configuration handler - handles threshold and percent move alerts
const composer = new Composer<Ctx>();

// Handle threshold alert configuration
composer.callbackQuery(/^alert:threshold:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "threshold";
  
  const keyboard = inlineKeyboard([
    [inlineButton("⬆️ Above price", `alert:above:${ticker}`)],
    [inlineButton("⬇️ Below price", `alert:below:${ticker}`)],
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Configure threshold alert for <b>${ticker}</b>:\n\n` +
    `Choose alert direction:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

// Handle percent move alert configuration
composer.callbackQuery(/^alert:percent:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "percent";
  
  const keyboard = inlineKeyboard([
    [inlineButton("📈 Price up", `alert:up:${ticker}`)],
    [inlineButton("📉 Price down", `alert:down:${ticker}`)],
    [inlineButton("🔄 Both directions", `alert:both:${ticker}`)],
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Configure percent move alert for <b>${ticker}</b>:\n\n` +
    `Choose alert direction:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

// Handle above threshold direction
composer.callbackQuery(/^alert:above:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "threshold";
  
  // Ask for price threshold
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Enter the price threshold for <b>${ticker}</b>:\n\n` +
    `Example: 50000 (for $50,000)`,
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Handle below threshold direction
composer.callbackQuery(/^alert:below:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "threshold";
  
  // Ask for price threshold
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Enter the price threshold for <b>${ticker}</b>:\n\n` +
    `Example: 50000 (for $50,000)`,
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Handle up percent direction
composer.callbackQuery(/^alert:up:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "percent";
  
  // Ask for percent change
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Enter the percent change for <b>${ticker}</b>:\n\n` +
    `Example: 5 (for 5% move)`,
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Handle down percent direction
composer.callbackQuery(/^alert:down:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "percent";
  
  // Ask for percent change
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Enter the percent change for <b>${ticker}</b>:\n\n` +
    `Example: 5 (for 5% move)`,
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Handle both percent directions
composer.callbackQuery(/^alert:both:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  ctx.session.step = "awaiting_alert_config";
  ctx.session.pendingTicker = ticker;
  ctx.session.pendingAlertType = "percent";
  
  // Ask for percent change
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:main")],
  ]);
  
  await ctx.reply(
    `Enter the percent change for <b>${ticker}</b>:\n\n` +
    `Example: 5 (for 5% move)`,
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Handle save with defaults
composer.callbackQuery(/^alert:save:([A-Z]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  if (!ticker) {
    await ctx.reply("Invalid ticker.");
    return;
  }
  
  const userId = String(ctx.from?.id ?? 0);
  
  // Add to watchlist with default settings
  await addToWatchlist(userId, ticker, ticker);
  
  // Update user profile with default settings
  const profile = await getUserProfile(userId);
  profile.alertPreferences.threshold = true;
  profile.alertPreferences.percentMove = true;
  await updateUserProfile(userId, profile);
  
  ctx.session.step = "idle";
  
  const keyboard = inlineKeyboard([
    [inlineButton("📈 Check Price", `price:refresh:${ticker}`)],
    [inlineButton("⚙️ Settings", "menu:settings")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  await ctx.reply(
    `<b>${ticker}</b> has been added to your watchlist with default alert settings:\n\n` +
    `• Threshold alerts: Enabled\n` +
    `• Percent move alerts: Enabled\n` +
    `• Lookback period: 1 hour\n` +
    `• Cooldown: 30 minutes\n\n` +
    `You'll be notified when price conditions are met.`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

// Handle alert configuration input (price threshold or percent change)
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_alert_config") return next();
  
  const text = ctx.message.text.trim();
  const value = parseFloat(text);
  
  if (isNaN(value) || value <= 0) {
    await ctx.reply("Please enter a valid number.");
    return;
  }
  
  const ticker = ctx.session.pendingTicker;
  const alertType = ctx.session.pendingAlertType;
  
  if (!ticker || !alertType) {
    ctx.session.step = "idle";
    await ctx.reply("Something went wrong. Please try again.");
    return;
  }
  
  const userId = String(ctx.from?.id ?? 0);
  
  // Add to watchlist
  await addToWatchlist(userId, ticker, ticker);
  
  if (alertType === "threshold") {
    // Store threshold alert
    const keyboard = inlineKeyboard([
      [inlineButton("✅ Confirm", `alert:confirm:${ticker}:threshold:${value}`)],
      [inlineButton("❌ Cancel", "menu:main")],
    ]);
    
    await ctx.reply(
      `Set threshold alert for <b>${ticker}</b> at <b>$${value.toLocaleString()}</b>?`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  } else if (alertType === "percent") {
    // Store percent move alert
    const keyboard = inlineKeyboard([
      [inlineButton("✅ Confirm", `alert:confirm:${ticker}:percent:${value}`)],
      [inlineButton("❌ Cancel", "menu:main")],
    ]);
    
    await ctx.reply(
      `Set percent move alert for <b>${ticker}</b> at <b>${value}%</b>?`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  }
  
  ctx.session.step = "idle";
});

// Handle alert confirmation
composer.callbackQuery(/^alert:confirm:([A-Z]+):(threshold|percent):([\d.]+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const ticker = ctx.match?.[1]?.toUpperCase();
  const alertType = ctx.match?.[2] as "threshold" | "percent";
  const value = parseFloat(ctx.match?.[3] ?? "0");
  
  if (!ticker || !alertType || isNaN(value)) {
    await ctx.reply("Invalid alert configuration.");
    return;
  }
  
  const userId = String(ctx.from?.id ?? 0);
  const profile = await getUserProfile(userId);
  
  // Update profile with alert preferences
  // Map "percent" to "percentMove" for the profile
  const prefKey = alertType === "percent" ? "percentMove" : alertType;
  profile.alertPreferences[prefKey] = true;
  await updateUserProfile(userId, profile);
  
  const keyboard = inlineKeyboard([
    [inlineButton("📈 Check Price", `price:refresh:${ticker}`)],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  if (alertType === "threshold") {
    await ctx.reply(
      `✅ Threshold alert set for <b>${ticker}</b> at <b>$${value.toLocaleString()}</b>.\n\n` +
      `You'll be notified when the price crosses this level.`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  } else {
    await ctx.reply(
      `✅ Percent move alert set for <b>${ticker}</b> at <b>${value}%</b>.\n\n` +
      `You'll be notified when the price moves this much.`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  }
});

export default composer;