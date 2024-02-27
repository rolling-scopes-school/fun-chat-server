const { WebSocket } = require('ws');

/**
 * @returns {Promise<WebSocket>}
 */
async function createClient() {
  const client = new WebSocket(`ws://localhost:${process.env.SERVER_PORT}`);
  return new Promise((resolve, reject) => {
    client.on('open', () => {
      resolve(client);
    });
    client.on('error', () => {
      reject();
    });
    client.on('close', () => {
      reject();
    });
  });
}

async function waitTimeAnswers(latency = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, latency);
  });
}

async function waitSomeAnswers(answers = [], count = 0) {
  return new Promise((resolve) => {
    const id = setInterval(() => {
      if (answers.length >= count) {
        clearInterval(id);
        resolve();
      }
    }, 1);
  });
}

module.exports = { createClient, waitTimeAnswers, waitSomeAnswers };
