import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserProfile, updateUserProfile } from "../toolkit/index.js";

// Settings handler - manages user preferences like quiet hours, summary time, etc.
const composer = new Composer<Ctx>();

// Settings menu
composer.callbackQuery("menu:settings", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const userId = String(ctx.from?.id ?? 0);
  const profile = await getUserProfile(userId);
  
  const quietHoursText = profile.quietHoursStart !== undefined && profile.quietHoursEnd !== undefined
    ? `${profile.quietHoursStart}:00 - ${profile.quietHoursEnd}:00`
    : "Not set";
  
  const summaryTimeText = profile.summaryTime ?? "Not set";
  
  const message = 
    `⚙️ <b>Settings</b>\n\n` +
    `🕐 Quiet Hours: ${quietHoursText}\n` +
    `📊 Daily Summary: ${summaryTimeText}\n` +
    `⏱️ Alert Cooldown: ${profile.cooldownLength} minutes\n\n` +
    `Configure your preferences:`;
  
  const keyboard = inlineKeyboard([
    [inlineButton("🌙 Set Quiet Hours", "settings:quiet:start")],
    [inlineButton("📊 Set Summary Time", "settings:summary:start")],
    [inlineButton("⏱️ Set Alert Cooldown", "settings:cooldown:start")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
  
  await ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "HTML",
  });
});

// Quiet hours configuration
composer.callbackQuery("settings:quiet:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.step = "awaiting_quiet_hours";
  
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:settings")],
  ]);
  
  await ctx.reply(
    "Enter quiet hours window in format: <b>HH:MM-HH:MM</b>\n\n" +
    "Example: <code>22:00-07:00</code> (10 PM to 7 AM)",
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Summary time configuration
composer.callbackQuery("settings:summary:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.step = "awaiting_summary_time";
  
  const keyboard = inlineKeyboard([
    [inlineButton("❌ Cancel", "menu:settings")],
  ]);
  
  await ctx.reply(
    "Enter daily summary time in format: <b>HH:MM</b>\n\n" +
    "Example: <code>08:00</code> (8 AM daily)",
    {
      reply_markup: {
        ...keyboard,
        force_reply: true,
      },
      parse_mode: "HTML",
    }
  );
});

// Cooldown configuration
composer.callbackQuery("settings:cooldown:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const userId = String(ctx.from?.id ?? 0);
  const profile = await getUserProfile(userId);
  
  const keyboard = inlineKeyboard([
    [inlineButton("15 min", "settings:cooldown:15")],
    [inlineButton("30 min", "settings:cooldown:30")],
    [inlineButton("1 hour", "settings:cooldown:60")],
    [inlineButton("2 hours", "settings:cooldown:120")],
    [inlineButton("❌ Cancel", "menu:settings")],
  ]);
  
  await ctx.reply(
    `Current cooldown: <b>${profile.cooldownLength} minutes</b>\n\n` +
    `Choose a new cooldown period:`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

// Handle cooldown selection
composer.callbackQuery(/^settings:cooldown:(\d+)$/i, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const minutes = parseInt(ctx.match?.[1] ?? "30");
  if (isNaN(minutes) || minutes < 5 || minutes > 1440) {
    await ctx.reply("Invalid cooldown period.");
    return;
  }
  
  const userId = String(ctx.from?.id ?? 0);
  await updateUserProfile(userId, { cooldownLength: minutes });
  
  const keyboard = inlineKeyboard([
    [inlineButton("⬅️ Back to settings", "menu:settings")],
  ]);
  
  await ctx.reply(
    `✅ Alert cooldown set to <b>${minutes} minutes</b>.`,
    {
      reply_markup: keyboard,
      parse_mode: "HTML",
    }
  );
});

// Handle quiet hours input
composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step === "awaiting_quiet_hours") {
    const text = ctx.message.text.trim();
    const match = text.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
    
    if (!match) {
      await ctx.reply(
        "Please enter time in format: <b>HH:MM-HH:MM</b>\n\n" +
        "Example: <code>22:00-07:00</code>",
        { parse_mode: "HTML" }
      );
      return;
    }
    
    const startHour = parseInt(match[1]);
    const startMinute = parseInt(match[2]);
    const endHour = parseInt(match[3]);
    const endMinute = parseInt(match[4]);
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 ||
        startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
      await ctx.reply("Please enter valid hours (0-23) and minutes (0-59).");
      return;
    }
    
    const userId = String(ctx.from?.id ?? 0);
    await updateUserProfile(userId, {
      quietHoursStart: startHour,
      quietHoursEnd: endHour,
    });
    
    ctx.session.step = "idle";
    
    const keyboard = inlineKeyboard([
      [inlineButton("⬅️ Back to settings", "menu:settings")],
    ]);
    
    await ctx.reply(
      `✅ Quiet hours set to <b>${startHour}:${String(startMinute).padStart(2, '0')} - ${endHour}:${String(endMinute).padStart(2, '0')}</b>.\n\n` +
      `Alerts will be queued during this window and delivered after.`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  } else if (ctx.session.step === "awaiting_summary_time") {
    const text = ctx.message.text.trim();
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    
    if (!match) {
      await ctx.reply(
        "Please enter time in format: <b>HH:MM</b>\n\n" +
        "Example: <code>08:00</code>",
        { parse_mode: "HTML" }
      );
      return;
    }
    
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      await ctx.reply("Please enter valid hour (0-23) and minutes (0-59).");
      return;
    }
    
    const userId = String(ctx.from?.id ?? 0);
    await updateUserProfile(userId, {
      summaryTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    });
    
    ctx.session.step = "idle";
    
    const keyboard = inlineKeyboard([
      [inlineButton("⬅️ Back to settings", "menu:settings")],
    ]);
    
    await ctx.reply(
      `✅ Daily summary time set to <b>${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}</b>.\n\n` +
      `You'll receive a daily summary of your watchlist prices.`,
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );
  } else {
    return next();
  }
});

export default composer;