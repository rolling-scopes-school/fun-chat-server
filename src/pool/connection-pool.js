module.exports = class ConnectionPool {
  static #connectionPool = new ConnectionPool();
  /** @type {Map<string, import('../connection/connection')>} */
  #connections = new Map();

  static getInstance() {
    return this.#connectionPool;
  }
  getAllConnections() {
    return this.#connections;
  }
  getAuthConnections() {
    const result = new Map();
    this.#connections.forEach((connection) => {
      const user = connection.getUser();
      if (user && user.isLogined) {
        result.set(connection.getConnectionId(), connection);
      }
    });
    return result;
  }
  /**
   * @param {string} connectionId
   */
  getConnectionById(connectionId) {
    return this.#connections.get(connectionId);
  }
  /**
   * @param {string} login
   * @returns {import('../connection/connection') | undefined}
   */
  getConnectionByLogin(login) {
    let result;
    this.#connections.forEach((connection) => {
      const user = connection.getUser();
      if (user !== null && user.login === login) {
        result = connection;
      }
    });
    return result;
  }
  /**
   * @param {import('../connection/connection')} connection
   */
  addConnection(connection) {
    this.#connections.set(connection.getConnectionId(), connection);
  }
  /**
   * @param {string} connectionId
   */
  removeConnection(connectionId) {
    this.#connections.delete(connectionId);
  }
};
