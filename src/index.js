/* eslint-disable no-unused-vars */

const Socket = require('./socket');

let socket = new Socket();

const clearInterval = process.env.CLEAR_INTERVAL * 60 * 60 * 1000;
if (clearInterval) {
  setInterval(() => {
    socket.close();
    socket = new Socket();
  }, clearInterval);
}
