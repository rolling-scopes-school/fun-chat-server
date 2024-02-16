// eslint-disable-next-line import/no-extraneous-dependencies
require('dotenv').config();
const http = require('http');
const { WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');
const Connection = require('./connection/connection');
const Logger = require('./logger/logger');
const ConnectionPool = require('./pool/connection-pool');

module.exports = class Socket {
  #socket = null;
  #httpServer = null;
  #logger = new Logger();
  #connectionPool = ConnectionPool.getInstance();

  constructor() {
    // this.#socket = new WebSocket.Server({ port: process.env.SERVER_PORT });
    // this.#socket.on('connection', this.#newConnectionHandler.bind(this));

    const webSocketServerPort = process.env.PORT || process.env.SERVER_PORT;
    this.#httpServer = http.createServer();
    this.#httpServer.listen(webSocketServerPort);
    this.#socket = new WebSocket.Server({ server: this.#httpServer });
    this.#socket.on('connection', this.#newConnectionHandler.bind(this));

    this.#logger.message(`server runnig on port ${process.env.SERVER_PORT}`);
    this.#logger.message(`server timezone utc`);
  }
  close() {
    this.#socket.close();
    if (this.#httpServer !== null) {
      this.#httpServer.close();
    }
    this.#logger.message(`server shut down`);
  }
  #newConnectionHandler() {
    const connectionIndex = this.#socket.clients.size - 1;
    const socket = [...this.#socket.clients.values()][connectionIndex];

    const connectionId = uuidv4();
    const newConnection = new Connection(socket, connectionId);
    this.#connectionPool.addConnection(newConnection);

    socket.on('close', this.#closeConnectionHandler.bind(this, connectionId));
    socket.on('error', this.#errorConnectionHandler.bind(this, connectionId));

    this.#logger.connection({ type: 'open', id: connectionId });
  }
  /**
   * @param {string} connectionId
   */
  #closeConnectionHandler(connectionId) {
    this.#connectionPool.removeConnection(connectionId);
    this.#logger.connection({ type: 'close', id: connectionId });
  }
  /**
   * @param {string} connectionId
   */
  #errorConnectionHandler(connectionId) {
    this.#logger.connection({ type: 'error', id: connectionId });
    this.#closeConnectionHandler(connectionId);
  }
};
