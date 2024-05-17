const MessagePool = require('../../../pool/message-pool');
const DefaultHandler = require('../../default-handler');
const ConnectionPool = require('../../../pool/connection-pool');
const { HANDLER_ID_MESSAGE_INVALID, HANDLER_USER_NOT_SENDER } = require('./handler-messages');
const { PAYLOAD_INVALID, TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class MessageEditHandler extends DefaultHandler {
  type = RequestTypes.MSG_EDIT;
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
      message.payload.message.text === undefined ||
      typeof message.payload.message.id !== 'string' ||
      typeof message.payload.message.text !== 'string'
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
    if (this.currentUserLogin !== sender) {
      return this.getErrorAnswer(HANDLER_USER_NOT_SENDER);
    }

    const isEdited = messagePool.editMessage(message.payload.message.id, message.payload.message.text);
    if (!isEdited) {
      return this.getErrorAnswer(HANDLER_ID_MESSAGE_INVALID);
    }

    const result = {
      message: {
        id: message.payload.message.id,
        text: message.payload.message.text,
        status: {
          isEdited,
        },
      },
    };

    const connectionsPool = ConnectionPool.getInstance();
    const userConnection = connectionsPool.getConnectionByLogin(receiver);
    if (userConnection) {
      const messageFrom = {
        id: null,
        type: RequestTypes.MSG_EDITED_FROM_SERVER,
        payload: result,
      };
      userConnection.innerMessageHandler(messageFrom);
    }

    return result;
  }
};
