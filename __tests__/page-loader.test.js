import pageLoader from '../src/index';
import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import os from 'os';
import _ from 'lodash';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_URL = "https://ru.hexlet.io";

nock.disableNetConnect();
let scope;
let tmpDir;
let fakeHexletContent;
let fullResultingPath
beforeAll(() => {
  tmpDir = os.tmpdir()
  scope = nock(MOCK_URL)
    .persist()
    .get('/courses')
});

beforeEach(async () => {
  await fs.unlink(`${tmpDir}/ru-hexlet-io-courses.html`).catch(_.noop)
  scope.replyWithFile(200, `${__dirname}/__fixtures__/fake-hexlet-content.html`)
  fakeHexletContent = await fs.readFile(getFixturesPath('fake-hexlet-content.html'), 'utf-8');
  fullResultingPath = await pageLoader(`${MOCK_URL}/courses`, tmpDir);
})

const getFixturesPath = (name) => path.join(__dirname, '__fixtures__', name);

describe('url is mocked', () => {
  test('and working', async () => {
    const response = await axios.get(`${MOCK_URL}/courses`);
    expect(response.data).toEqual(fakeHexletContent);
  });
})

describe('main flow', () => {
  test('save filename is correct', async () => {
    const resultFilename = 'ru-hexlet-io-courses.html';
    const dirContent = await fs.readdir(tmpDir);
    expect(dirContent.includes(resultFilename))
  });

  test('return value is correct', async () => {
    const savedPath = `${tmpDir}/ru-hexlet-io-courses.html`;
    expect(savedPath).toEqual(fullResultingPath);
  });

  test('content is being saved', async () => {
    const result = await fs.readFile(fullResultingPath, 'utf-8');
    expect(result.trim()).toEqual(fakeHexletContent.trim());
  });
});
