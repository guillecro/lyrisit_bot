
require('dotenv').config()
const TeleBot = require('telebot');
const mysql = require('mysql');
const format = require('date-format');

const bot = new TeleBot({
  token: process.env.TELEGRAM_BOT_API_KEY,
  usePlugins: ['commandButton']
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4_general_ci'
});

function preparePagination(msg, page, edit){
  // Prepare query
  db.query('SELECT * FROM daily ORDER BY date DESC LIMIT 3 OFFSET ?', [page*3], function (error, results) {
    // Execute
    // Error?
    if (error) {
      console.error(error)
      return bot.sendMessage(msg.chat.id, ' Perdon, tuve un error interno y no pude obtener los logs... UwU', { parseMode: 'markdown' });
    };
    // All OK, prepare message
    let message = '🗯 *EXPLORADOR DE LOGS*\n\n'
    results.forEach(r => {
      message += `• _${r.log}_\nLog \`#${r.id}\` hecho el ${format('dd/MM/yyyy hh:mm', r.date)} por \`${('@' + r.username) || '(?)'}\`\n\n`
    })
    if(results.length < 3){
      message += `📑 _Fin de los logs_`
    }
    // Prepare buttons
    let buttons = []
    if(results.length == 3){
      buttons.push(bot.inlineButton('⬅️ Anterior', { callback: `{"command": "logs", "page": ${page+1}}` }))
    }
    if(page > 0){
      buttons.push(bot.inlineButton('Siguiente ➡️', { callback: `{"command": "logs", "page": ${page-1}}` }))
    }
    const markupButtons = bot.inlineKeyboard([buttons, [bot.inlineButton('✖️ Cerrar', {callback: '{"command": "deleteLogs"}'})]])
    // Return message
    if(edit){
      return bot.editMessageText({chatId: msg.chat.id, messageId: msg.message_id}, message, { parseMode: 'markdown', replyMarkup: markupButtons });
    }
    return bot.sendMessage(msg.chat.id, message, { parseMode: 'markdown', replyMarkup: markupButtons });

  })
}

function closeLogs(msg){
  let message = '🗯 *EXPLORADOR DE LOGS*\n\n'
  message += 'Gracias por usar el explorador. Bye!'
  bot.answerCallbackQuery(msg.id, {text: 'Gracias por usar el explorador!'})
  return bot.deleteMessage(msg.chat.id, msg.message_id);
}

// Command /start
bot.on('/logs', msg => preparePagination(msg,0));

// Button callback
bot.on('callbackQuery', (msg) => {
  const theData = JSON.parse(msg.data)
  // debug
  // console.log(theData)
  if(theData.command == 'logs'){
    preparePagination(msg.message, theData.page, true)
    bot.answerCallbackQuery(msg.id)
  }
  if(theData.command == 'deleteLogs'){
    closeLogs(msg.message)
    bot.answerCallbackQuery(msg.id, {text: 'Gracias por usar el explorador!'})
  }
});

bot.start();