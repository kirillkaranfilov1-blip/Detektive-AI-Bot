import { Bot } from 'grammy';
import { config } from '../config/index.js';
import {
  handleStart,
  handleCaseCommand,
  handleNotebookCommand,
  handleCallbackQuery,
  handleTextMessage,
} from './handlers.js';

export function createBot(): Bot {
  if (!config.TELEGRAM_BOT_TOKEN || config.TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
    console.warn(
      '⚠️ TELEGRAM_BOT_TOKEN is not configured in .env. Bot polling will not start automatically until token is provided.'
    );
  }

  const bot = new Bot(config.TELEGRAM_BOT_TOKEN || 'dummy_token');

  // Error boundary
  bot.catch((err) => {
    console.error('❌ Bot error caught:', err.error);
  });

  // Commands
  bot.command('start', handleStart);
  bot.command('case', handleCaseCommand);
  bot.command('notebook', handleNotebookCommand);
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `🕵️‍♂️ **Detektive AI — Команды:**\n\n` +
        `/start — Начать / продолжить расследование\n` +
        `/case — Главное меню активного дела\n` +
        `/notebook — Просмотреть следственный блокнот и улики\n` +
        `/help — Справка по игре`,
      { parse_mode: 'Markdown' }
    );
  });

  // Callbacks
  bot.on('callback_query:data', handleCallbackQuery);

  // Messages (interrogation & text dialogue)
  bot.on('message:text', handleTextMessage);

  return bot;
}
