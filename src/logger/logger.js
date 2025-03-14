const chalk = require('chalk');

/**
 * @typedef {{
 * header: 'Incoming' | 'Outcoming',
 * connection: string,
 * data: import('../model/connection-message/connection-message-model').ConnectionMessage
 * }} LogMessage
 */

/**
 * @typedef {{
 * type: 'open' | 'close' | 'error',
 * id: string,
 * }} LogConnection
 */

module.exports = class Logger {
  /**
   * @param {LogConnection} message
   */
  connection(message) {
    if (process.env.LOG.toLowerCase() === 'none') {
      return;
    }
    const type = message.type.toLowerCase() === 'error' ? chalk.red(message.type) : chalk.green(message.type);
    console.log(
      `${this.#getDate()} ${chalk.bold.underline.white('Connection')} ${type} ${chalk.underline.white('id:')} ${chalk.white(message.id)}`
    );
  }
  /**
   * @param {string} text
   */
  message(text) {
    if (process.env.LOG.toLowerCase() === 'none') {
      return;
    }
    console.log(`${this.#getDate()} ${chalk.white(text)}`);
  }
  /**
   * @param {LogMessage} message
   */
  log(message) {
    if (process.env.LOG.toLowerCase() === 'none') {
      return;
    }
    if (process.env.LOG.toLowerCase() === 'incoming' && message.header.toLowerCase() !== 'incoming') {
      return;
    }
    if (process.env.LOG.toLowerCase() === 'outcoming' && message.header.toLowerCase() !== 'outcoming') {
      return;
    }
    if (process.env.LOG.toLowerCase() === 'error' && message.data.type.toLowerCase() !== 'error') {
      return;
    }
    const type =
      message.data.type.toLowerCase() === 'error' ? chalk.red(message.data.type) : chalk.green(message.data.type);
    const request = message.header === 'Incoming' ? chalk.bold.magenta('Incoming') : chalk.bold.cyan('Outcoming');
    const header = `${request} ${type}`;
    const connectionId = `${chalk.bold.white('Connection id:')} ${chalk.white(message.connection)}`;
    const messageId = `${chalk.bold.white('Message id:')} ${chalk.white(message.data.id)}`;
    const payload = `${chalk.bold.white('Payload:')} ${chalk.white(JSON.stringify(message.data.payload))}`;
    console.log(
      `${this.#getDate()} ${header}
                       ${connectionId}
                       ${messageId}
                       ${payload}`
    );
  }
  #getDate() {
    const date = new Date();
    return chalk.gray(`[${date.toLocaleString('ru', { timeZone: 'UTC' })}]`);
  }
};
