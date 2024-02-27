/**
 * @exports
 * @typedef {{
 * id: string,
 * type: 'USER_LOGIN' |
 *       'USER_LOGOUT' |
 *       'USER_EXTERNAL_LOGIN' |
 *       'USER_EXTERNAL_LOGOUT' |
 *       'USER_ACTIVE' |
 *       'USER_INACTIVE' |
 *       'MSG_FROM_USER' |
 *       'MSG_SEND' |
 *       'MSG_DELIVERED' |
 *       'MSG_READED' |
 *       'ERROR' |
 *       'MSG_READED_FROM_SERVER' |
 *       'MSG_RECEIVE',
 * payload: null |
 *          import('../user/user-model').UserPayload |
 *          import('../../controller/message/message-controller').MessageAuthPayload |
 *          import('../../controller/message/message-controller').MessageTextPayload,
 * }} ConnectionMessage
 */
/**
 * @exports
 * @typedef {{
 * error?: string
 * }} ConnectionMessagePayload
 */
module.exports = class ConnectionMessageModel {
  /** @type {string | null} */
  #id = null;
  /** @type {string | null} */
  #type = null;
  /** @type {null | import('../user/user-model').UserPayload} */
  #payload = null;

  /**
   * @param {ConnectionMessage} connectionMessage
   * @throws {Error}
   */
  constructor(connectionMessage) {
    this.#id = connectionMessage.id;
    this.#type = connectionMessage.type;
    this.#payload = connectionMessage.payload;
  }
  get id() {
    return this.#id;
  }
  get type() {
    return this.#type;
  }
  get payload() {
    return this.#payload;
  }
  /**
   * @param {ConnectionMessage} connectionMessage
   * @returns {boolean}
   */
  static isCorrectMessage(connectionMessage) {
    return (
      (typeof connectionMessage.id === 'string' || connectionMessage.id === null) &&
      typeof connectionMessage.type === 'string' &&
      (typeof connectionMessage.payload === 'object' || connectionMessage.payload === null)
    );
  }
};
