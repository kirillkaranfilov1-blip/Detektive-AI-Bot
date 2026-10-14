import { config } from './config/index.js';
import { connectDatabase, prisma } from './db/prisma.js';
import { createBot } from './bot/index.js';

async function bootstrap() {
  console.log('🕵️‍♂️ Starting Detektive AI engine...');

  // 1. Database connection check
  await connectDatabase();

  // 2. Initialize Telegram Bot
  const bot = createBot();

  const isTokenConfigured =
    Boolean(config.TELEGRAM_BOT_TOKEN) && config.TELEGRAM_BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN';

  if (!isTokenConfigured) {
    console.log('\n======================================================');
    console.log('📌 ВНИМАНИЕ: TELEGRAM_BOT_TOKEN не указан в файле .env');
    console.log('1. Откройте .env и укажите ваш токен от @BotFather:');
    console.log('   TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrs..."');
    console.log('2. Укажите OPENAI_API_KEY (или используйте эмуляцию):');
    console.log('   OPENAI_API_KEY="sk-..."');
    console.log('3. Перезапустите: npm run dev');
    console.log('======================================================\n');
    return;
  }

  // Graceful shutdown
  const stop = async () => {
    console.log('\n🛑 Shutting down Detektive AI...');
    bot.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  // 3. Start bot polling
  console.log('🚀 Detektive AI Telegram Bot is starting polling...');
  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} is now online and ready for investigations!`);
    },
  });
}

bootstrap().catch((err) => {
  console.error('💥 Fatal error starting Detektive AI:', err);
  process.exit(1);
});
