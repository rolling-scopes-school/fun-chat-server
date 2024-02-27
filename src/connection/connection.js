const AuthController = require('../controller/auth/auth-controller');
const Logger = require('../logger/logger');
const UserModel = require('../model/user/user-model');
const UserState = require('../pool/user-pool');
const { TYPE_INVALID } = require('../controller/default-messages');
const MessageController = require('../controller/message/message-controller');
const UserController = require('../controller/user/user-controller');
const ConnectionMessageModel = require('../model/connection-message/connection-message-model');
const { REQUEST_INVALID } = require('../controller/default-messages');
const { RequestTypes } = require('./request-types');

module.exports = class Connection {
  /** @type {WebSocket} */
  #socket = null;
  /** @type {string} */
  #connectionId = null;
  /** @type {UserModel} */
  #user = null;

  #logger = new Logger();
  /**
   * @param {WebSocket} socket
   * @param {string} connectionId
   */
  constructor(socket, connectionId) {
    this.#socket = socket;
    this.#connectionId = connectionId;

    this.#user = new UserModel();

    this.#setEventHandlers();
  }
  getUser() {
    return this.#user;
  }
  getConnectionId() {
    return this.#connectionId;
  }
  /**
   * @param {import('../model/connection-message/connection-message-model').ConnectionMessage} message
   */
  messageHandler(message) {
    this.#logger.log({ header: 'Incoming', connection: this.#connectionId, data: message });

    /** @type {import('../model/connection-message/connection-message-model').ConnectionMessage} */
    const answer = {
      id: message.id,
      type: message.type,
      payload: null,
    };

    switch (message.type) {
      case RequestTypes.USER_LOGIN:
      case RequestTypes.USER_LOGOUT: {
        const authController = new AuthController();
        answer.payload = authController.run(message);

        if (answer.payload.user) {
          const userState = UserState.getInstance();
          const user = userState.getUser(message.payload.user.login);
          this.#user = user.isLogined ? user : null;

          const messageToAll = {
            id: null,
            type:
              message.type === RequestTypes.USER_LOGIN
                ? RequestTypes.USER_EXTERNAL_LOGIN
                : RequestTypes.USER_EXTERNAL_LOGOUT,
            payload: {
              user: answer.payload.user,
            },
          };
          authController.run(messageToAll);
        }
        break;
      }
      case RequestTypes.USER_ACTIVE:
      case RequestTypes.USER_INACTIVE: {
        const userController = new UserController();
        answer.payload = userController.run(message);
        break;
      }
      case RequestTypes.MSG_DELIVERED:
      case RequestTypes.USER_EXTERNAL_LOGIN:
      case RequestTypes.USER_EXTERNAL_LOGOUT: {
        answer.payload = message.payload;
        break;
      }
      case RequestTypes.MSG_SEND:
      case RequestTypes.MSG_READED:
      case RequestTypes.MSG_EDIT:
      case RequestTypes.MSG_DELETE:
      case RequestTypes.MSG_FROM_USER: {
        const messageController = new MessageController(this.#user);
        answer.payload = messageController.run(message);
        break;
      }
      case RequestTypes.MSG_READED_FROM_SERVER: {
        answer.type = RequestTypes.MSG_READED;
        answer.payload = message.payload;
        break;
      }
      case RequestTypes.MSG_DELETED_FROM_SERVER: {
        answer.type = RequestTypes.MSG_DELETE;
        answer.payload = message.payload;
        break;
      }
      case RequestTypes.MSG_EDITED_FROM_SERVER: {
        answer.type = RequestTypes.MSG_EDIT;
        answer.payload = message.payload;
        break;
      }
      case RequestTypes.MSG_SENDED_FROM_SERVER: {
        answer.type = RequestTypes.MSG_SEND;
        answer.payload = message.payload;
        break;
      }
      default: {
        answer.type = RequestTypes.ERROR;
        answer.payload = {
          error: TYPE_INVALID,
        };
      }
    }

    if ('error' in answer.payload) {
      answer.type = RequestTypes.ERROR;
    }

    this.#sendMessage(answer);
  }
  #clientMessageHandler(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      const answer = {
        id: message ? message.id || null : null,
        type: RequestTypes.ERROR,
        payload: {
          error: REQUEST_INVALID,
        },
      };
      this.#sendMessage(answer);
      return;
    }
    if (!ConnectionMessageModel.isCorrectMessage(message)) {
      /** @type {import('../model/connection-message/connection-message-model').ConnectionMessage} */
      const answer = {
        id: message.id || null,
        type: RequestTypes.ERROR,
        payload: {
          error: REQUEST_INVALID,
        },
      };
      this.#sendMessage(answer);
      return;
    }

    switch (message.type) {
      case RequestTypes.ERROR:
      case RequestTypes.USER_EXTERNAL_LOGIN:
      case RequestTypes.USER_EXTERNAL_LOGOUT:
      case RequestTypes.MSG_DELIVERED:
      case RequestTypes.MSG_DELETED_FROM_SERVER:
      case RequestTypes.MSG_READED_FROM_SERVER:
      case RequestTypes.MSG_SENDED_FROM_SERVER:
      case RequestTypes.MSG_EDITED_FROM_SERVER: {
        /** @type {import('../model/connection-message/connection-message-model').ConnectionMessage} */
        const answer = {
          id: message.id,
          type: RequestTypes.ERROR,
          payload: {
            error: TYPE_INVALID,
          },
        };
        this.#sendMessage(answer);
        break;
      }
      default: {
        this.messageHandler(message);
      }
    }
  }
  #closeHandler() {
    if (this.#user !== null && this.#user.login !== null) {
      this.#user.isLogined = false;

      /** @type {import('../model/connection-message/connection-message-model').ConnectionMessage} */
      const messageToAll = {
        id: null,
        type: RequestTypes.USER_EXTERNAL_LOGOUT,
        payload: {
          user: {
            login: this.#user.login,
            isLogined: this.#user.isLogined,
          },
        },
      };
      const authController = new AuthController();
      authController.run(messageToAll);
    }
    this.#socket = null;
    this.#user = null;
  }
  #errorHandler() {
    this.#closeHandler();
  }
  #setEventHandlers() {
    this.#socket.on('error', this.#errorHandler.bind(this));
    this.#socket.on('close', this.#closeHandler.bind(this));
    this.#socket.on('message', this.#clientMessageHandler.bind(this));
  }
  /**
   * @param {import('../model/connection-message/connection-message-model').ConnectionMessage} answer
   */
  #sendMessage(answer) {
    this.#socket.send(JSON.stringify(answer));

    this.#logger.log({ header: 'Outcoming', connection: this.#connectionId, data: answer });
  }
};
