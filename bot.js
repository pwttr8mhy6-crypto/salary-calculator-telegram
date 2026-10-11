const TelegramBot = require('node-telegram-bot-api');

// Вставьте сюда ТОКЕН, который вы получили от @BotFather
const TOKEN = 'ВАШ_ТЕЛЕГРАМ_ТОКЕН_БОТА'; 

// Вставьте ссылку на ваш опубликованный GitHub Pages
const WEB_APP_URL = 'https://github.io';

const bot = new TelegramBot(TOKEN, { polling: true });

// Обработка стартовой команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, `Привет, ${msg.from.first_name}! 👋\nДобро пожаловать в экспериментальный калькулятор расчета зарплаты.\n\nНажми на кнопку ниже, чтобы открыть интерактивный календарь смен и рассчитать доход.`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '📊 Открыть калькулятор',
                        web_app: { url: WEB_APP_URL }
                    }
                ]
            ]
        }
    });
});

console.log('Бот успешно запущен и слушает команды...');
