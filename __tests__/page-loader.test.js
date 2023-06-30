import pageLoader from '../src/index';
import nock from 'nock';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import os from 'os';
import _ from 'lodash';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_URL = "https://ru.hexlet.io";

nock.disableNetConnect();

let scope;
let tmpDir;
let fakeHexletContent;
let fullResultingPath;

const getFixturesPath = (name) => path.join(__dirname, '__fixtures__', name);

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  scope = nock(MOCK_URL)
    .persist()
    .get('/courses')
    .replyWithFile(200, getFixturesPath('fake-hexlet-content.html'))
    .get('/assets/professions/nodejs.png')
    .replyWithFile(200, getFixturesPath('node.png'));
  fakeHexletContent = (await fs.readFile(getFixturesPath('fake-hexlet-content.html'), 'utf-8')).trim()
  fullResultingPath = await pageLoader(`${MOCK_URL}/courses`, tmpDir);
})


describe('url is mocked', () => {
  test('and working', async () => {
    const response = await axios.get(`${MOCK_URL}/courses`);
    expect(response.data.trim()).toEqual(fakeHexletContent);
  });
})

describe('main flow', () => {
  test('save filename is correct', async () => {
    const resultFilename = 'ru-hexlet-io-courses.html';
    const dirContent = await fs.readdir(tmpDir);
    expect(dirContent.includes(resultFilename)).toBeTruthy();
  });

  test('return value is correct', async () => {
    const savedPath = `${tmpDir}/ru-hexlet-io-courses.html`;
    expect(savedPath).toEqual(fullResultingPath);
  });

  test('content is being saved', async () => {
    const result = await fs.readFile(fullResultingPath, 'utf-8');
    expect(result.length).toBeGreaterThan(10);
  });

  test('assets dir is present', async () => {
    const dirContent = await fs.readdir(tmpDir);
    const assetsDirname = 'ru-hexlet-io-courses_files';
    expect(dirContent.includes(assetsDirname)).toBeTruthy();
  });

  test('image is downloading', async () => {
    const response = await axios.get('https://ru.hexlet.io/assets/professions/nodejs.png', { responseType: 'stream' } );
    expect(response.data).toBeDefined();
  });

  test('img path should be from local assets dir', async () => {
    const afterFixturePath = getFixturesPath('fake-hexlet-content-after-image-processing.html')
    const after = cheerio.load((await fs.readFile(afterFixturePath, 'utf-8')).trim()).html();
    const result = await fs.readFile(fullResultingPath, 'utf-8');
    expect(result).toEqual(after);
  });
});
