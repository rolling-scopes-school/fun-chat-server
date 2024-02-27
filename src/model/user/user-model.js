/**
 * @exports
 * @typedef {{
 * login: string;
 * password?: string | null;
 * isLogined: boolean;
 * }} UserPayload
 */

module.exports = class User {
  /** @type {string | null} */
  #login = null;
  /** @type {string | null} */
  #password = null;
  /** @type {boolean | null} */
  #isLogined = null;

  get login() {
    return this.#login;
  }
  set login(login) {
    this.#login = login;
  }
  get password() {
    return this.#password;
  }
  set password(password) {
    this.#password = password;
  }
  get isLogined() {
    return this.#isLogined;
  }
  set isLogined(isLogined) {
    this.#isLogined = isLogined;
  }
  /**
   * @param {User} payload
   * @returns {boolean}
   */
  static isCorrectPayload(payload) {
    return (
      payload !== undefined &&
      payload.login !== undefined &&
      typeof payload.login === 'string' &&
      payload.password !== undefined &&
      typeof payload.password === 'string'
    );
  }
};
