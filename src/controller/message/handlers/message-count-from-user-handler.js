const MessagePool = require('../../../pool/message-pool');
const DefaultHandler = require('../../default-handler');
const UserPool = require('../../../pool/user-pool');
const { HANDLER_RECEIVER_INVALID, HANDLER_RECEIVER_NOT_FOUND } = require('./handler-messages');
const { PAYLOAD_INVALID, TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class MessageFromUserHandler extends DefaultHandler {
  type = RequestTypes.MSG_COUNT_NOT_READED_FROM_USER;
  /**
   * @param {string} currentUserLogin
   */
  constructor(currentUserLogin) {
    super();
    this.currentUserLogin = currentUserLogin;
  }
  /**
   * @param {import('../../../model/connection-message/connection-message-model').ConnectionMessage} message
   * @returns {import('../../../model/message/message-model')}
   */
  handle(message) {
    if (this.type !== message.type && this.nextHandler) {
      return this.nextHandler.handle(message);
    }
    if (this.type !== message.type && !this.nextHandler) {
      return this.getErrorAnswer(TYPE_INVALID);
    }

    if (
      !message.payload.user ||
      message.payload.user.login === undefined ||
      typeof message.payload.user.login !== 'string'
    ) {
      return this.getErrorAnswer(PAYLOAD_INVALID);
    }

    if (this.currentUserLogin === message.payload.user.login) {
      return this.getErrorAnswer(HANDLER_RECEIVER_INVALID);
    }

    const userTo = UserPool.getInstance().getUser(message.payload.user.login);
    if (userTo === null) {
      return this.getErrorAnswer(HANDLER_RECEIVER_NOT_FOUND);
    }

    const result = {
      count: 0,
    };

    const messagePool = MessagePool.getInstance();
    const messagesCurrentTo = messagePool.getMessageByUserFromTo(message.payload.user.login, this.currentUserLogin);
    for (let i = 0; i < messagesCurrentTo.length; i += 1) {
      if (!messagesCurrentTo[i].isReaded) {
        result.count += 1;
      }
    }

    return result;
  }
};
