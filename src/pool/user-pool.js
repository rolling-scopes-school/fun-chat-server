module.exports = class UserPool {
  static #userPool = new UserPool();
  /** @type {import('../model/user/user-model')[]} */
  #users = [];

  static getInstance() {
    return this.#userPool;
  }
  /**
   * @param {string} login
   * @return {import('../model/user/user-model') | null}
   */
  getUser(login) {
    const result = this.#users.find((user) => user.login === login);
    if (result) {
      return result;
    }
    return null;
  }
  /**
   * @return {import('../model/user/user-model')[]}
   */
  getAllUser() {
    return this.#users;
  }
  /**
   * @param {import('../model/user/user-model')} user
   * @return {boolean}
   */
  addUser(user) {
    const isExists = this.getUser(user.login) !== null;
    if (!isExists) {
      this.#users.push(user);
      return true;
    }
    return false;
  }
  /**
   * @param {string} login
   * @returns {boolean}
   */
  deleteUser(login) {
    const index = this.#users.findIndex((user) => user.login === login);
    if (index !== -1) {
      this.#users.splice(index, 1);
      return true;
    }
    return false;
  }
  /**
   * @param {import('../model/user/user-model')} updatedUser
   * @returns {boolean}
   */
  updateUser(updatedUser) {
    const user = this.getUser(updatedUser.login);
    if (user === null) {
      return false;
    }
    user.password = updatedUser.password;
    user.isLogined = updatedUser.isLogined;
    return true;
  }
  clear() {
    this.#users = [];
  }
};
