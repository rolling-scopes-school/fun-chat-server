const Socket = require('../src/socket');
const { createClient, waitSomeAnswers, waitTimeAnswers } = require('./utils/client');
const { getAuthUserRequest } = require('./requests/user-case');
const { getMessageRequest } = require('./requests/message-case');

describe('Send message to user', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Send one message to logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.answer.messageToLogged.from.payload.message.id = serverAnswers[4].payload.message.id;
    messageToUser.answer.messageToLogged.from.payload.message.datetime = serverAnswers[4].payload.message.datetime;

    expect(serverAnswers[4]).toEqual(messageToUser.answer.messageToLogged.from);

    client.close();
    clientSecond.close();
  });
  test('Send many messages to logged user', async () => {
    const countMessages = 10;
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messagesToUser = [];
    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser.push(getMessageRequest(userFirst, userSecond));
    }
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    clientSecond.send(JSON.stringify(userSecond.request.login));
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    for (let i = 0; i < countMessages; i += 1) {
      client.send(JSON.stringify(messagesToUser[i].request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, countMessages + 1);

    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser[i].answer.messageToLogged.from.payload.message.id = serverAnswers[i + 1].payload.message.id;
      messagesToUser[i].answer.messageToLogged.from.payload.message.datetime =
        serverAnswers[i + 1].payload.message.datetime;
      expect(serverAnswers[i + 1]).toEqual(messagesToUser[i].answer.messageToLogged.from);
    }

    client.close();
    clientSecond.close();
  });
  test('Send one message to not logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 6);

    messageToUser.answer.messageToNotLogged.from.payload.message.id = serverAnswers[5].payload.message.id;
    messageToUser.answer.messageToNotLogged.from.payload.message.datetime = serverAnswers[5].payload.message.datetime;

    expect(serverAnswers[5]).toEqual(messageToUser.answer.messageToNotLogged.from);

    client.close();
    clientSecond.close();
  });
  test('Send many messages to not logged user', async () => {
    const countMessages = 10;
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messagesToUser = [];
    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser.push(getMessageRequest(userFirst, userSecond));
    }
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    for (let i = 0; i < countMessages; i += 1) {
      client.send(JSON.stringify(messagesToUser[i].request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, countMessages + 1);

    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser[i].answer.messageToNotLogged.from.payload.message.id = serverAnswers[i + 1].payload.message.id;
      messagesToUser[i].answer.messageToNotLogged.from.payload.message.datetime =
        serverAnswers[i + 1].payload.message.datetime;
      expect(serverAnswers[i + 1]).toEqual(messagesToUser[i].answer.messageToNotLogged.from);
    }

    client.close();
    clientSecond.close();
  });
  test('Send to myself user', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(messageToUser.error.messageToMySelf);

    client.close();
  });
  test('Send to non-existent (not registered) user', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    messageToUser.request.messageToUser.payload.message.to = '1234';
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(messageToUser.error.messageToNotFound);

    client.close();
  });
  test('Send to empty user', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    messageToUser.request.messageToUser.payload.message.to = '';
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(messageToUser.error.messageToNotFound);

    client.close();
  });
  test('Send from not auth user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    clientSecond.send(JSON.stringify(userSecond.request.login));
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 1);

    expect(serverAnswers[0]).toEqual(messageToUser.error.userNotAuth);

    client.close();
    clientSecond.close();
  });
  test('Send from not logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 4);

    expect(serverAnswers[3]).toEqual(messageToUser.error.userNotAuth);

    client.close();
    clientSecond.close();
  });
  test('Send from logged user with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    messageToUser.request.messageToUser.payload = {
      to: userSecond.request.login.payload.user.login,
      text: '1234',
    };
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
  test('Send from logged user with invalid type text', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    messageToUser.request.messageToUser.payload.message.text = 1234;
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
  test('Send from logged user with invalid type to', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    messageToUser.request.messageToUser.payload.message.to = 1234;
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
  test('Send from logged user without text parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    delete messageToUser.request.messageToUser.payload.message.text;
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
  test('Send from logged user without to parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    delete messageToUser.request.messageToUser.payload.message.to;
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
});

describe('Receive message from user', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Receive one message from logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 2);

    messageToUser.answer.messageToLogged.to.payload.message.id = serverAnswers[1].payload.message.id;
    messageToUser.answer.messageToLogged.to.payload.message.datetime = serverAnswers[1].payload.message.datetime;

    expect(serverAnswers[1]).toEqual(messageToUser.answer.messageToLogged.to);

    client.close();
    clientSecond.close();
  });

  test('Receive many messages from logged user', async () => {
    const countMessages = 10;
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messagesToUser = [];
    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser.push(getMessageRequest(userFirst, userSecond));
    }
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    for (let i = 0; i < countMessages; i += 1) {
      client.send(JSON.stringify(messagesToUser[i].request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, countMessages + 1);

    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser[i].answer.messageToLogged.to.payload.message.id = serverAnswers[i + 1].payload.message.id;
      messagesToUser[i].answer.messageToLogged.to.payload.message.datetime =
        serverAnswers[i + 1].payload.message.datetime;
      expect(serverAnswers[i + 1]).toEqual(messagesToUser[i].answer.messageToLogged.to);
    }

    client.close();
    clientSecond.close();
  });
});

describe('Get user message history', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Empty message history from logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);

    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[2]).toEqual(messageToUser.answer.messageHistoryToUser);

    client.close();
    clientSecond.close();
  });
  test('Empty message history from not logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 4);

    expect(serverAnswers[3]).toEqual(messageToUser.answer.messageHistoryToUser);

    client.close();
    clientSecond.close();
  });
  test('Not empty message history from logged user', async () => {
    const countMessages = 10;
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messagesToUser = [];
    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser.push(getMessageRequest(userFirst, userSecond));
    }
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);

    for (let i = 0; i < countMessages; i += 1) {
      client.send(JSON.stringify(messagesToUser[i].request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, countMessages + 2);

    client.send(JSON.stringify(messagesToUser[0].request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, countMessages + 3);

    for (let i = 2; i < countMessages + 2; i += 1) {
      messagesToUser[0].answer.messageHistoryToUser.payload.messages.push(serverAnswers[i].payload.message);
    }

    expect(serverAnswers[countMessages + 2]).toEqual(messagesToUser[0].answer.messageHistoryToUser);

    client.close();
    clientSecond.close();
  });
  test('Not empty message history from not logged user', async () => {
    const countMessages = 10;
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messagesToUser = [];
    for (let i = 0; i < countMessages; i += 1) {
      messagesToUser.push(getMessageRequest(userFirst, userSecond));
    }
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 3);

    for (let i = 0; i < countMessages; i += 1) {
      client.send(JSON.stringify(messagesToUser[i].request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, countMessages + 3);

    client.send(JSON.stringify(messagesToUser[0].request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, countMessages + 4);

    for (let i = 3; i < countMessages + 3; i += 1) {
      messagesToUser[0].answer.messageHistoryToUser.payload.messages.push(serverAnswers[i].payload.message);
    }

    expect(serverAnswers[countMessages + 3]).toEqual(messagesToUser[0].answer.messageHistoryToUser);

    client.close();
    clientSecond.close();
  });
  test('Myself user message history', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(messageToUser.error.messageToMySelf);

    client.close();
  });
  test('With non-existent (not registered) user message history', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    messageToUser.request.messageHistoryToUser.payload.user.login = '1234';
    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(messageToUser.error.messageToNotFound);

    client.close();
  });
  test('Not auth user empty message history', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 1);

    expect(serverAnswers[0]).toEqual(messageToUser.error.userNotAuth);

    client.close();
  });
  test('Not logged user empty message history', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);

    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[2]).toEqual(messageToUser.error.userNotAuth);

    client.close();
  });
  test('Get user message history with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    messageToUser.request.messageHistoryToUser.payload = {
      login: userSecond.request.login.payload.user.login,
    };
    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
  test('Get user message history with invalid type login', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    messageToUser.request.messageHistoryToUser.payload.user.login = 123;
    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
  test('Get user message history without login parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    delete messageToUser.request.messageHistoryToUser.payload.user.login;
    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 4);
    await waitTimeAnswers(5);

    expect(serverAnswers[3]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(4);

    client.close();
    clientSecond.close();
  });
});

describe('Get count message from user', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Get count messages from logged user', async () => {
    const countMessages = 5;

    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUserFirst = getMessageRequest(userFirst, userSecond);
    const messageToUserSecond = getMessageRequest(userSecond, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    for (let i = 0; i < countMessages; i += 1) {
      clientSecond.send(JSON.stringify(messageToUserSecond.request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, serverAnswers.length + countMessages);

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 2);
    client.send(JSON.stringify(messageToUserFirst.request.messageCountHistoryToUser));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    expect(serverAnswers[serverAnswers.length - 1].payload.messages).toEqual(countMessages);

    client.close();
    clientSecond.close();
  });
  test('Get count messages from not logged user', async () => {
    const countMessages = 5;

    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUserFirst = getMessageRequest(userFirst, userSecond);
    const messageToUserSecond = getMessageRequest(userSecond, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    for (let i = 0; i < countMessages; i += 1) {
      clientSecond.send(JSON.stringify(messageToUserSecond.request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, serverAnswers.length + countMessages);

    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    client.send(JSON.stringify(messageToUserFirst.request.messageCountHistoryToUser));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    expect(serverAnswers[serverAnswers.length - 1].payload.messages).toEqual(countMessages);

    client.close();
    clientSecond.close();
  });
  test('Not logged user get count messages from logged user', async () => {
    const countMessages = 5;

    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUserFirst = getMessageRequest(userFirst, userSecond);
    const messageToUserSecond = getMessageRequest(userSecond, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    for (let i = 0; i < countMessages; i += 1) {
      clientSecond.send(JSON.stringify(messageToUserSecond.request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, serverAnswers.length + countMessages);

    client.send(JSON.stringify(messageToUserFirst.request.messageCountHistoryToUser));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    expect(serverAnswers[serverAnswers.length - 1]).toEqual(messageToUserFirst.error.userNotAuth);

    client.close();
    clientSecond.close();
  });
  test('Not logged user get count messages from not logged user', async () => {
    const countMessages = 5;

    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUserFirst = getMessageRequest(userFirst, userSecond);
    const messageToUserSecond = getMessageRequest(userSecond, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    for (let i = 0; i < countMessages; i += 1) {
      clientSecond.send(JSON.stringify(messageToUserSecond.request.messageToUser));
    }
    await waitSomeAnswers(serverAnswers, serverAnswers.length + countMessages);

    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    client.send(JSON.stringify(messageToUserFirst.request.messageCountHistoryToUser));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    expect(serverAnswers[serverAnswers.length - 1]).toEqual(messageToUserFirst.error.userNotAuth);

    client.close();
    clientSecond.close();
  });
  test('Get count messages from same user', async () => {
    const userFirst = getAuthUserRequest();
    const messageToUserFirst = getMessageRequest(userFirst, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    client.send(JSON.stringify(messageToUserFirst.request.messageCountHistoryToUser));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    expect(serverAnswers[serverAnswers.length - 1]).toEqual(messageToUserFirst.error.messageToMySelf);

    client.close();
  });
  test('Get count messages from not created user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUserFirst = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    messageToUserFirst.request.messageCountHistoryToUser.payload.user.login = 'fakeUser';
    client.send(JSON.stringify(messageToUserFirst.request.messageCountHistoryToUser));
    await waitSomeAnswers(serverAnswers, serverAnswers.length + 1);

    expect(serverAnswers[serverAnswers.length - 1]).toEqual(messageToUserFirst.error.messageToNotFound);

    client.close();
  });
});

describe('Change message delivered status', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Delivered to logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    await waitTimeAnswers(5);

    messageToUser.answer.messageToLogged.to.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageToLogged.to.payload.message.datetime = serverAnswers[3].payload.message.datetime;

    messageToUser.answer.messageToLogged.from.payload.message.id = serverAnswers[4].payload.message.id;
    messageToUser.answer.messageToLogged.from.payload.message.datetime = serverAnswers[4].payload.message.datetime;

    expect(serverAnswers[3]).toEqual(messageToUser.answer.messageToLogged.to);
    expect(serverAnswers[4]).toEqual(messageToUser.answer.messageToLogged.from);
    expect(serverAnswers.length).toBe(5);

    client.close();
    clientSecond.close();
  });
  test('Delivered to not logged user', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 6);

    await waitTimeAnswers(5);

    messageToUser.answer.messageToNotLogged.from.payload.message.id = serverAnswers[5].payload.message.id;
    messageToUser.answer.messageToNotLogged.from.payload.message.datetime = serverAnswers[5].payload.message.datetime;

    expect(serverAnswers[5]).toEqual(messageToUser.answer.messageToNotLogged.from);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Delivered to not logged user and user login after delivery', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 6);

    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 8);

    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Delivered to not logged user, user login after delivery and get history', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const messageToUserSecond = getMessageRequest(userSecond, userFirst);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 6);

    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 8);
    clientSecond.send(JSON.stringify(messageToUserSecond.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 10);

    await waitTimeAnswers(5);

    messageToUser.answer.messageDelivered.payload.message.id = serverAnswers[8].payload.message.id;

    expect(serverAnswers[8]).toEqual(messageToUser.answer.messageDelivered);
    expect(serverAnswers.length).toBe(10);

    client.close();
    clientSecond.close();
  });
});

describe('Change message readed status', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Readed recipient if sender logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageReaded.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageReaded.to.payload.message.id = serverAnswers[3].payload.message.id;

    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 7);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.answer.messageReaded.to);
    expect(serverAnswers[6]).toEqual(messageToUser.answer.messageReaded.from);
    expect(serverAnswers.length).toBe(7);

    client.close();
    clientSecond.close();
  });
  test('Readed recipient if sender not logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageReaded.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageReaded.to.payload.message.id = serverAnswers[3].payload.message.id;

    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.answer.messageReaded.from);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Readed recipient if sender not logged, sender logged and get history', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);
    messageToUser.request.messageReaded.payload.message.id = serverAnswers[4].payload.message.id;

    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 7);
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 8);

    messageToUser.answer.messageHistoryToUser.payload.messages.push(serverAnswers[4].payload.message);
    messageToUser.answer.messageHistoryToUser.payload.messages[0].status.isReaded = true;

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 10);
    client.send(JSON.stringify(messageToUser.request.messageHistoryToUser));
    await waitSomeAnswers(serverAnswers, 11);
    await waitTimeAnswers(5);

    expect(serverAnswers[10]).toEqual(messageToUser.answer.messageHistoryToUser);
    expect(serverAnswers.length).toBe(11);

    client.close();
    clientSecond.close();
  });
  test('Readed already readed message', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageReaded.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageReaded.to.payload.message.id = serverAnswers[3].payload.message.id;

    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 7);
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 9);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.answer.messageReaded.to);
    expect(serverAnswers[8]).toEqual(messageToUser.answer.messageReaded.from);
    expect(serverAnswers.length).toBe(9);

    client.close();
    clientSecond.close();
  });
  test('Readed non-existent (invalid id) message', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageReaded.payload.message.id = '1234';
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageNotCorrectId);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Readed message if user sender', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageUserNotRecipient);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Readed message if user not recipient', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const userThree = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    const clientThree = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientThree.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    clientThree.send(JSON.stringify(userThree.request.login));
    await waitSomeAnswers(serverAnswers, 6);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 8);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[6].payload.message.id;
    clientThree.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 9);
    await waitTimeAnswers(5);

    expect(serverAnswers[8]).toEqual(messageToUser.error.messageUserNotRecipient);
    expect(serverAnswers.length).toBe(9);

    client.close();
    clientSecond.close();
  });
  test('Readed message if user sender not logged in our connection', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 7);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 8);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 9);
    await waitTimeAnswers(5);

    expect(serverAnswers[8]).toEqual(messageToUser.error.userNotAuth);
    expect(serverAnswers.length).toBe(9);

    client.close();
    clientSecond.close();
  });
  test('Readed message if user recipient not logged in our connection', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 7);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 8);

    messageToUser.request.messageReaded.payload.message.id = serverAnswers[3].payload.message.id;
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 9);
    await waitTimeAnswers(5);

    expect(serverAnswers[8]).toEqual(messageToUser.error.userNotAuth);
    expect(serverAnswers.length).toBe(9);

    client.close();
    clientSecond.close();
  });
  test('Readed with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageReaded.payload = {
      id: serverAnswers[3].payload.message.id,
    };
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Readed with invalid type id', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageReaded.payload.message.id = 123;
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Readed without id parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);
    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    delete messageToUser.request.messageReaded.payload.message.id;
    clientSecond.send(JSON.stringify(messageToUser.request.messageReaded));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
});

describe('Change message deleted status', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Delete message if user sender', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageDeleted.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageDeleted.from.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 7);
    await waitTimeAnswers(5);

    expect(serverAnswers[6]).toEqual(messageToUser.answer.messageDeleted.from);
    expect(serverAnswers.length).toBe(7);

    client.close();
    clientSecond.close();
  });
  test('Delete message if user not sender', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageDeleted.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageDeleted.from.payload.message.id = serverAnswers[3].payload.message.id;
    clientSecond.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageUserNotSender);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Deleted sender if recipient logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageDeleted.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageDeleted.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageDeleted.to.payload.message.id = serverAnswers[3].payload.message.id;

    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 7);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.answer.messageDeleted.to);
    expect(serverAnswers[6]).toEqual(messageToUser.answer.messageDeleted.from);
    expect(serverAnswers.length).toBe(7);

    client.close();
    clientSecond.close();
  });
  test('Deleted sender if recipient not logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageDeleted.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageDeleted.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageDeleted.to.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.answer.messageDeleted.from);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Delete non-existent (invalid id) message', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);
    messageToUser.request.messageDeleted.payload.message.id = '1234';
    clientSecond.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageNotCorrectId);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Delete not logged user from sender connection', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageDeleted.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.error.userNotAuth);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Delete not logged user from recipient connection', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageDeleted.payload.message.id = serverAnswers[3].payload.message.id;
    clientSecond.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.error.userNotAuth);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Delete with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageDeleted.payload = {
      id: serverAnswers[3].payload.message.id,
    };
    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Delete with invalid type id', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageDeleted.payload.message.id = 1234;
    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Delete without id parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    delete messageToUser.request.messageDeleted.payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageDeleted));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
});

describe('Change message edit status', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Edited message if user sender', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 7);
    await waitTimeAnswers(5);

    expect(serverAnswers[6]).toEqual(messageToUser.answer.messageEdited.from);
    expect(serverAnswers.length).toBe(7);

    client.close();
    clientSecond.close();
  });
  test('Edited message if user not sender', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    clientSecond.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageUserNotSender);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Edited sender if recipient logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.to.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 7);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.answer.messageEdited.to);
    expect(serverAnswers[6]).toEqual(messageToUser.answer.messageEdited.from);
    expect(serverAnswers.length).toBe(7);

    client.close();
    clientSecond.close();
  });
  test('Edited sender if recipient not logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.answer.messageEdited.from);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Edited non-existent (invalid id) message', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = '1234';
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageNotCorrectId);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Edited not logged user from sender connection', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.error.userNotAuth);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Edited not logged user from recipient connection', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 7);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    clientSecond.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 8);
    await waitTimeAnswers(5);

    expect(serverAnswers[7]).toEqual(messageToUser.error.userNotAuth);
    expect(serverAnswers.length).toBe(8);

    client.close();
    clientSecond.close();
  });
  test('Edited with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    const { id, text } = messageToUser.request.messageEdited.payload.message;
    messageToUser.request.messageEdited.payload = {
      id,
      text,
    };
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Edited with invalid type id', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.request.messageEdited.payload.message.id = 1234;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Edited without id parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    delete messageToUser.request.messageEdited.payload.message.id;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Edited with invalid type text', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.request.messageEdited.payload.message.text = 1234;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
  test('Edited without text parameter', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const messageToUser = getMessageRequest(userFirst, userSecond);
    const serverAnswers = [];

    const client = await createClient();
    const clientSecond = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    client.send(JSON.stringify(messageToUser.request.messageToUser));
    await waitSomeAnswers(serverAnswers, 5);

    messageToUser.request.messageEdited.payload.message.id = serverAnswers[3].payload.message.id;
    messageToUser.answer.messageEdited.from.payload.message.id = serverAnswers[3].payload.message.id;
    delete messageToUser.request.messageEdited.payload.message.text;
    client.send(JSON.stringify(messageToUser.request.messageEdited));
    await waitSomeAnswers(serverAnswers, 6);
    await waitTimeAnswers(5);

    expect(serverAnswers[5]).toEqual(messageToUser.error.messageIncorrectPayload);
    expect(serverAnswers.length).toBe(6);

    client.close();
    clientSecond.close();
  });
});
