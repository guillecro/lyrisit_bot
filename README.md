# Daily Logs - Telegram Bot
> A Telegram BOT for Lyris IT

This is a simple bot made with [Telebot](https://github.com/mullwar/telebot). Exclusively made for a telegram group for the developers to record "daily logs"

### Problem
We needed something simple to leave notes on the go but we didnt wanted another service.

### Solution
Create a bot in Telegram that saves our logs in a database, and also retrieve the logs in a easy way.

### Setup

First, we need a MySQL database for the bot to use. Must be a simple database with a charset collation like `utf8mb4_general_ci` so it supports saving emojis in the logs

Now create the only table the bot needs with name "daily"

```
CREATE TABLE `daily` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(100) DEFAULT NULL,
  `username` varchar(250) DEFAULT NULL,
  `log` longtext NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`)
)
```



### Enviroment Vars

Create a .env file with the following env vars
```
TELEGRAM_BOT_API_KEY=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
TELEGRAM_GROUP_ID=
TELEGRAM_CHAT_TEST_ID=
```

* `TELEGRAM_BOT_API_KEY` is the key that `@BotFather` gives you to use the bot. If you dont have one I reccomend you to interact with [@GodFather](https://t.me/GodFather).
* The bot interacts with a database. In this case, a mysql databese. So please complete the `DB_HOST`
`DB_USER`,
`DB_PASSWORD` and
`DB_NAME` to set up the connection.
* `TELEGRAM_GROUP_ID` is the group that the bot listens and interacts. The bot is not intended to have or answer in a 1-on-1 conversations. It is intended to work in a Telegram Group.
* `TELEGRAM_CHAT_TEST_ID` is the only exception to the previous rule. You can put any chat id for testing purpose. I recommend you add your chat id with the bot here. For that, start the bot, now go, talk with the bot, and execute `/start`. The chat id will be displayed in the console for you to get it and then use add it in the env vars.



### Features

You can save a "log" by typing 

```
/daily <text>
```

Explore the logs with pagination buttons by typing

```
/logs
```

You can delete a daily by giving the id this command. **Only pass the integer number, without simbols.**
```
/deleteDaily <idDaily>
```

---

Made by **Guillermo Croppi**

Github: [@guillecro](https://github.com/guillecro)

Telegram username: [ZachariasVonZaqueo](https://t.me/ZachariasVonZaqueo)
