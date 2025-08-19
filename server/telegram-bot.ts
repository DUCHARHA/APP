import { Telegraf } from 'telegraf';
import { storage } from './storage';
import { generateVerificationCode } from './auth';

// Bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
}

// Create bot instance
const bot = new Telegraf(BOT_TOKEN || 'dummy-token');

// Store user sessions (in production, use Redis or database)
const userSessions = new Map<number, any>();

// Bot commands and handlers
bot.start(async (ctx: any) => {
  const welcomeMessage = `🛒 Добро пожаловать в ДУЧАРХА!

Я бот для доставки продуктов в течение 10-15 минут.

🔐 Для входа на сайт я буду отправлять вам коды подтверждения.

📱 Используйте сайт или приложение ДУЧАРХА для заказов.

Команды:
/help - помощь
/phone - привязать номер телефона
/status - проверить статус`;

  await ctx.reply(welcomeMessage);
});

bot.help(async (ctx: any) => {
  const helpMessage = `📋 Команды бота:

/start - начать работу с ботом
/phone - привязать номер телефона  
/status - проверить ваш статус
/help - показать эту справку

🔐 Коды входа:
Бот автоматически отправляет коды для входа на сайт ДУЧАРХА.

❓ Поддержка: @support_ducharha`;

  await ctx.reply(helpMessage);
});

// Phone number registration
bot.command('phone', async (ctx: any) => {
  userSessions.set(ctx.from!.id, { awaitingPhone: true });
  
  await ctx.reply(`📱 Отправьте ваш номер телефона в формате +992XXXXXXXXX

Например: +992901234567

Этот номер будет использоваться для входа на сайт ДУЧАРХА.`);
});

// Status command
bot.command('status', async (ctx: any) => {
  const userId = ctx.from!.id;
  const session = userSessions.get(userId);
  
  if (session?.phone) {
    await ctx.reply(`✅ Ваш статус активен
📱 Номер: ${session.phone}
🔐 Готов получать коды входа`);
  } else {
    await ctx.reply(`❌ Номер телефона не привязан
Используйте /phone для привязки номера`);
  }
});

// Handle text messages
bot.on('text', async (ctx: any) => {
  const userId = ctx.from!.id;
  const session = userSessions.get(userId);
  const text = ctx.message.text;
  
  // If user is registering phone number
  if (session?.awaitingPhone) {
    const phoneRegex = /^\+992\d{9}$/;
    
    if (phoneRegex.test(text)) {
      // Save phone number
      userSessions.set(userId, { 
        phone: text,
        telegramId: userId,
        username: ctx.from!.username,
        firstName: ctx.from!.first_name,
        lastName: ctx.from!.last_name
      });
      
      await ctx.reply(`✅ Номер ${text} успешно привязан!
🔐 Теперь вы будете получать коды входа от бота.`);
    } else {
      await ctx.reply(`❌ Неверный формат номера!
📱 Используйте формат: +992XXXXXXXXX
Например: +992901234567`);
    }
    return;
  }
  
  // Default response for unrecognized messages
  await ctx.reply(`🤖 Не понимаю эту команду.
Используйте /help для списка команд.`);
});

// Function to send verification code (used by API)
export async function sendCodeToTelegram(phone: string, code: string): Promise<boolean> {
  try {
    // Find user by phone number
    let targetUserId: number | null = null;
    
    for (const [userId, session] of Array.from(userSessions.entries())) {
      if (session.phone === phone) {
        targetUserId = userId;
        break;
      }
    }
    
    if (!targetUserId) {
      console.log(`❌ Пользователь с номером ${phone} не найден в Telegram боте`);
      return false;
    }
    
    const message = `🔐 <b>Код входа в ДУЧАРХА</b>

<code>${code}</code>

⏰ Код действителен 5 минут
🔒 Не сообщайте этот код никому!`;
    
    await bot.telegram.sendMessage(targetUserId, message, { 
      parse_mode: 'HTML' 
    });
    
    console.log(`✅ Код ${code} отправлен пользователю ${phone}`);
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка отправки Telegram сообщения:', error);
    return false;
  }
}

// Function to get user's Telegram info by phone
export async function getTelegramUserByPhone(phone: string): Promise<any | null> {
  for (const [userId, session] of Array.from(userSessions.entries())) {
    if (session.phone === phone) {
      return {
        telegramId: userId,
        phone: session.phone,
        username: session.username,
        firstName: session.firstName,
        lastName: session.lastName
      };
    }
  }
  return null;
}

// Function to notify user about order updates
export async function notifyOrderUpdate(phone: string, orderId: string, status: string): Promise<boolean> {
  try {
    let targetUserId: number | null = null;
    
    for (const [userId, session] of Array.from(userSessions.entries())) {
      if (session.phone === phone) {
        targetUserId = userId;
        break;
      }
    }
    
    if (!targetUserId) {
      return false;
    }
    
    let statusText = '';
    let emoji = '';
    
    switch (status) {
      case 'confirmed':
        statusText = 'подтвержден';
        emoji = '✅';
        break;
      case 'preparing':
        statusText = 'готовится';
        emoji = '👨‍🍳';
        break;
      case 'delivering':
        statusText = 'доставляется';
        emoji = '🚗';
        break;
      case 'delivered':
        statusText = 'доставлен';
        emoji = '🎉';
        break;
      case 'cancelled':
        statusText = 'отменен';
        emoji = '❌';
        break;
      default:
        statusText = status;
        emoji = '📦';
    }
    
    const message = `${emoji} <b>Заказ #${orderId}</b>

Статус: <b>${statusText}</b>

🛒 Спасибо за покупку в ДУЧАРХА!`;
    
    await bot.telegram.sendMessage(targetUserId, message, { 
      parse_mode: 'HTML' 
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления о заказе:', error);
    return false;
  }
}

// Error handling
bot.catch((err: any, ctx: any) => {
  console.error('❌ Ошибка в Telegram боте:', err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// Start bot function
export async function startTelegramBot() {
  if (!BOT_TOKEN) {
    console.log('🤖 Telegram бот не запущен - отсутствует токен');
    return;
  }
  
  try {
    await bot.launch();
    console.log('🤖 Telegram бот запущен успешно');
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    console.error('❌ Ошибка запуска Telegram бота:', error);
  }
}

export { bot };