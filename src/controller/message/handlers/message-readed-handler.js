const MessagePool = require('../../../pool/message-pool');
const DefaultHandler = require('../../default-handler');
const ConnectionPool = require('../../../pool/connection-pool');
const { HANDLER_ID_MESSAGE_INVALID, HANDLER_USER_NOT_RECEIVER } = require('./handler-messages');
const { PAYLOAD_INVALID, TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class MessageReadedHandler extends DefaultHandler {
  type = RequestTypes.MSG_READED;
  /**
   * @param {string} currentUserLogin
   */
  constructor(currentUserLogin) {
    super();
    this.currentUserLogin = currentUserLogin;
  }
  /**
   * @param {import('../../../model/connection-message/connection-message-model').ConnectionMessage} message
   * @returns {boolean}
   */
  handle(message) {
    if (this.type !== message.type && this.nextHandler) {
      return this.nextHandler.handle(message);
    }
    if (this.type !== message.type && !this.nextHandler) {
      return this.getErrorAnswer(TYPE_INVALID);
    }

    if (
      !message.payload.message ||
      message.payload.message.id === undefined ||
      typeof message.payload.message.id !== 'string'
    ) {
      return this.getErrorAnswer(PAYLOAD_INVALID);
    }

    const messagePool = MessagePool.getInstance();

    const msg = messagePool.getMessageById(message.payload.message.id);
    if (msg === null) {
      return this.getErrorAnswer(HANDLER_ID_MESSAGE_INVALID);
    }

    const sender = msg.from;
    const receiver = msg.to;
    if (this.currentUserLogin !== receiver) {
      return this.getErrorAnswer(HANDLER_USER_NOT_RECEIVER);
    }

    const isReaded = messagePool.setReaded(message.payload.message.id);
    if (!isReaded) {
      return this.getErrorAnswer(HANDLER_ID_MESSAGE_INVALID);
    }

    const result = {
      message: {
        id: message.payload.message.id,
        status: {
          isReaded,
        },
      },
    };

    const connectionsPool = ConnectionPool.getInstance();
    const userConnection = connectionsPool.getConnectionByLogin(sender);
    if (userConnection) {
      const messageFrom = {
        id: null,
        type: RequestTypes.MSG_READED_FROM_SERVER,
        payload: result,
      };
      userConnection.messageHandler(messageFrom);
    }

    return result;
  }
};
