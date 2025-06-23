import nock from 'nock';
import os from 'os'
import loader from '../src/index.js';
import * as fs from 'fs/promises';
import { getFixturePath } from '../utils/test-helpers.js';

nock.disableNetConnect();

const baseUrl = 'https://kz.hexlet.io';
const page = '/courses';
const url = `${baseUrl}${page}`;
const cleanTempFile = (filename) => async () => {
  await fs.unlink(filename).catch(() => { });
}

describe('working with simple contents', () => {
  let fixtureData;
  let fullFilePath
  let tempdirName;
  const fileName = 'kz-hexlet-io-courses.html';

  beforeEach(async () => {
    tempdirName = os.tmpdir()
    fullFilePath = `${tempdirName}/${fileName}`;
    fixtureData = (await fs.readFile(getFixturePath('simple_contents.html'), 'utf8')).trim();
    nock(baseUrl).get(page).reply(200, fixtureData);
  })
  beforeEach(cleanTempFile(fullFilePath));

  test('should create correct file', async () => {
    await loader(url, tempdirName);
    const files = await fs.readdir(os.tmpdir());
    expect(files).toContain(fileName);
  });
  test('should save contents from url', async () => {
    await loader(url, tempdirName);
    const tempfileContents = (await fs.readFile(fullFilePath, 'utf8')).trim();
    expect(tempfileContents).toEqual(fixtureData);
  });
})
