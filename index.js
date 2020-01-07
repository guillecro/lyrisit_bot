require('dotenv').config()

const TeleBot = require('telebot');
const mysql = require('mysql');
const format = require('date-format');


// =========================
// SETUP 

console.log(process.env.DB_HOST)

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

// =========================
// FUNCTIONS

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  db.end(function (err) {
    if (err) {
      console.error('error disconnecting: ' + err.stack);
      process.exit(1);
    }
    console.log('MySQL db closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close dbs in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

function isLyrisGroup(msg) {
  return (msg.chat.type == 'group' && msg.chat.id == process.env.TELEGRAM_GROUP_ID) || msg.chat.id == process.env.TELEGRAM_CHAT_TEST_ID
}

// =========================

bot.on('/start', (msg) => {
  console.log(msg.chat.id)
  if (!isLyrisGroup(msg)) {
    return msg.reply.text('Sorry, this bot is only allowed to work in a specific group. See ya!')
  }
  return msg.reply.text('Hola Lyris IT! Es un hermoso dia para trabajar!')
});

/**
 * /daily <text>
 * 
 * Saves a daily log
 * 
 */

bot.on(/^\/daily (.+)$/, (msg, props) => {
  if (!isLyrisGroup(msg)) {
    console.warn(`> ${msg.from.username} (${msg.from.id}) is trying to execute command /daily. Refusing...`)
    return;
  }
  const text = props.match[1];
  db.query('INSERT INTO daily SET ?', { user: msg.from.id, username: msg.from.username, log: text, date: new Date() }, function (error, results) {
    if (error) {
      console.error(error)
    };
    console.log(`Added log #${results.insertId}`);
    return bot.sendMessage(msg.chat.id, `✅ Guardado log \`#${results.insertId}!\``, { parseMode: 'markdown', replyToMessage: msg.message_id });
  });
});

/**
 * /deleteDaily <id>
 * 
 * id - Integer
 * 
 * Deletes a daily log
 * 
 */

bot.on(/^\/deleteDaily ([0-9]+)$/, (msg, props) => {
  if (!isLyrisGroup(msg)) {
    console.warn(`> ${msg.from.username} (${msg.from.id}) is trying to execute command /deleteDaily. Refusing...`)
    return;
  }
  const idToDelete = props.match[1];
  db.query('DELETE FROM daily WHERE id = ?', [idToDelete], function (error, results) {
    if (error) {
      console.error(error)
    };
    if (results.affectedRows > 0) {
      console.log(`Deleted log #${idToDelete}`);
      return bot.sendMessage(msg.chat.id, `🗑 Eliminado log \`#${idToDelete}\`!`, { parseMode: 'markdown', replyToMessage: msg.message_id });
    } else {
      console.log(`No log with ID #${idToDelete}`);
      return bot.sendMessage(msg.chat.id, `El log \`#${idToDelete}\` no existe!`, { parseMode: 'markdown', replyToMessage: msg.message_id });
    }
  });
});

/**
 * /logs
 * 
 * Explores the log
 * 
 */

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

bot.on('/logs', msg => {
   if (!isLyrisGroup(msg)) {
    console.warn(`> ${msg.from.username} (${msg.from.id}) is trying to execute command /daily. Refusing...`)
    return;
  }
  return preparePagination(msg,0)
});

/**
 * Button callbacks
 * 
 */
bot.on('callbackQuery', (msg) => {
  // Collect the data
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

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
