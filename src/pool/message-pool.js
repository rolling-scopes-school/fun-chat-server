module.exports = class MessagePool {
  static #messagePool = new MessagePool();
  /** @type {import('../model/message/message-model')[]} */
  #messages = [];

  static getInstance() {
    return this.#messagePool;
  }
  /**
   * @param {import('../model/message/message-model')} message
   */
  addMessage(message) {
    // TODO обработка при добавлении сообщения с дублирующимся id
    this.#messages.push(message);
  }
  /**
   * @param {string} id
   */
  setDelivered(id) {
    let result = false;
    this.#messages.forEach((message) => {
      if (message.id === id) {
        // eslint-disable-next-line no-param-reassign
        message.isDelivered = true;
        result = true;
        return true;
      }
      return false;
    });
    return result;
  }
  /**
   * @param {string} id
   */
  setReaded(id) {
    let result = false;
    this.#messages.forEach((message) => {
      if (message.id === id) {
        // eslint-disable-next-line no-param-reassign
        message.isReaded = true;
        result = true;
      }
    });
    return result;
  }
  /**
   * @param {string} id
   * @param {string} text
   */
  editMessage(id, text) {
    let result = false;
    this.#messages.forEach((message) => {
      if (message.id === id) {
        // eslint-disable-next-line no-param-reassign
        message.text = text;
        // eslint-disable-next-line no-param-reassign
        message.isEdited = true;
        result = true;
      }
    });
    return result;
  }
  /**
   * @param {string} id
   */
  deleteMessage(id) {
    let result = false;
    this.#messages.forEach((message, index, array) => {
      if (message.id === id) {
        // eslint-disable-next-line no-param-reassign
        array.splice(index, 1);
        result = true;
      }
    });
    return result;
  }
  /**
   * @param {string} loginFrom
   * @param {string} loginTo
   * @returns {import('../model/message/message-model')[]}
   */
  getMessageByUserFromTo(loginFrom, loginTo) {
    const result = this.#messages.filter((message) => message.from === loginFrom && message.to === loginTo);
    return result;
  }
  /**
   * @param {string} id
   * @returns {import('../model/message/message-model') | null}
   */
  getMessageById(id) {
    const result = this.#messages.filter((message) => message.id === id);
    return result[0] || null;
  }
  clear() {
    this.#messages = [];
  }
};
