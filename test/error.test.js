const Socket = require('../src/socket');
const { createClient, waitTimeAnswers } = require('./utils/client');
const { notCorrectMessageStructure, notCorrectType, notAllowedType } = require('./requests/error-case');

describe('Request structure test case', () => {
  let socket;
  beforeEach(async () => {
    socket = new Socket();
  });
  afterEach(async () => {
    await socket.close();
  });
  test('Not correct message structure', async () => {
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    notCorrectMessageStructure.requests.forEach((request) => client.send(JSON.stringify(request)));

    await waitTimeAnswers(5);
    expect(serverAnswers.length === notCorrectMessageStructure.answers.length).toBe(true);
    serverAnswers.forEach((answer, index) => {
      expect(answer).toEqual(notCorrectMessageStructure.answers[index]);
    });

    client.close();
  });

  test('Not correct type', async () => {
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    notCorrectType.requests.forEach((request) => client.send(JSON.stringify(request)));

    await waitTimeAnswers(5);
    expect(serverAnswers.length === notCorrectType.answers.length).toBe(true);
    serverAnswers.forEach((answer, index) => {
      expect(answer).toEqual(notCorrectType.answers[index]);
    });

    client.close();
  });

  test('Not allowed type', async () => {
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    notAllowedType.requests.forEach((request) => client.send(JSON.stringify(request)));

    await waitTimeAnswers(5);
    expect(serverAnswers.length === notAllowedType.answers.length).toBe(true);
    serverAnswers.forEach((answer, index) => {
      expect(answer).toEqual(notAllowedType.answers[index]);
    });

    client.close();
  });
});
