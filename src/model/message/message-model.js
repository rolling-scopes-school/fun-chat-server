const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {{
 * id: string,
 * from: string,
 * to: string,
 * text: string,
 * datetime: number,
 * status: MessageStatus,
 * }} MessagePayload
 */

/**
 * @typedef {{
 * isDelivered: boolean,
 * isReaded: boolean,
 * isDeleted: boolean,
 * isEdited: boolean,
 * }} MessageStatus
 */

/**
 * @typedef {{
 * to: string,
 * text: string,
 * }} MessageShortPayload
 */

module.exports = class Message {
  /** @type {string | null} */
  #id = null;
  /** @type {string | null} */
  #from = null;
  /** @type {string | null} */
  #to = null;
  /** @type {string | null} */
  #text = null;
  /** @type {number | null} */
  #datetime = null;
  /** @type {MessageStatus | null} */
  #status = null;

  /**
   * @param {string} loginFrom
   * @param {MessageShortPayload} message
   */
  constructor(loginFrom, message) {
    this.#datetime = Date.now();
    this.#id = `${uuidv4()}_${this.#datetime}`;
    this.#from = loginFrom;
    this.#to = message.to;
    this.#text = message.text;
    this.#status = {
      isDelivered: false,
      isReaded: false,
      isDeleted: false,
      isEdited: false,
    };
  }
  get id() {
    return this.#id;
  }
  get from() {
    return this.#from;
  }
  get to() {
    return this.#to;
  }
  get text() {
    return this.#text;
  }
  set text(value) {
    this.#text = value;
  }
  get datetime() {
    return this.#datetime;
  }
  get status() {
    return this.#status;
  }
  set isDelivered(isDelivered) {
    this.#status.isDelivered = isDelivered;
  }
  get isDelivered() {
    return this.#status.isDelivered;
  }
  set isReaded(isReaded) {
    this.#status.isReaded = isReaded;
  }
  get isReaded() {
    return this.#status.isReaded;
  }
  set isEdited(isEdited) {
    this.#status.isEdited = isEdited;
  }
  get isEdited() {
    return this.#status.isEdited;
  }
  getPayload() {
    return {
      id: this.#id,
      from: this.#from,
      to: this.#to,
      text: this.#text,
      datetime: this.#datetime,
      status: {
        isDelivered: this.#status.isDelivered,
        isReaded: this.#status.isReaded,
        isEdited: this.#status.isEdited,
      },
    };
  }
  /**
   * @param {MessagePayload} payload
   * @returns {boolean}
   */
  static isCorrectPayload(payload) {
    return (
      typeof payload.id === 'string' &&
      typeof payload.from === 'string' &&
      typeof payload.to === 'string' &&
      typeof payload.text === 'string' &&
      typeof payload.datetime === 'number' &&
      typeof payload.status.isDelivered === 'boolean' &&
      typeof payload.status.isReaded === 'boolean' &&
      typeof payload.status.isEdited === 'boolean'
    );
  }
  /**
   * @param {MessageShortPayload} payload
   * @returns {boolean}
   */
  static isCorrectShortPayload(payload) {
    return typeof payload.to === 'string' && typeof payload.text === 'string';
  }
};
