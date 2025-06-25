import nock from 'nock';
import os from 'os'
import loader from '../src/index.js';
import * as fs from 'fs/promises';
import { getFixturePath } from '../utils/test-helpers.js';

nock.disableNetConnect();

const baseUrl = 'https://kz.hexlet.io';
const page = '/courses';
const url = `${baseUrl}${page}`;

describe('working with simple contents', () => {
  let beforeFixtureData;
  let afterFixtureData;
  let fullFilePath
  let fullAssetsPath
  let tempdirName;
  const fileName = 'kz-hexlet-io-courses.html';
  const imgDirName = 'kz-hexlet-io-courses_files'

  beforeEach(async () => {
    tempdirName = os.tmpdir()
    fullFilePath = `${tempdirName}/${fileName}`;
    fullAssetsPath = `${tempdirName}/${imgDirName}`;
    await fs.unlink(fullFilePath).catch(() => { });
    await fs.rm(fullAssetsPath, { recursive: true }).catch(() => { });
    beforeFixtureData = (await fs.readFile(getFixturePath('before.html'), 'utf8')).trim();
    nock(baseUrl).get(page).reply(200, beforeFixtureData);

    const fixtureImagePath = getFixturePath('/assets/professions/nodejs.png');
    const imageBuffer = await fs.readFile(fixtureImagePath);
    nock(baseUrl).get('/assets/professions/nodejs.png').reply(200, imageBuffer, {
      'Content-Type': 'image/png',
    });
  })

  test('should create correct file', async () => {
    await loader(url, tempdirName);
    const files = await fs.readdir(os.tmpdir());
    expect(files).toContain(fileName);
  });
  test('should save contents from url', async () => {
    await loader(url, tempdirName);
    const tempfileContents = (await fs.readFile(fullFilePath, 'utf8')).trim();
    expect(tempfileContents).toEqual(beforeFixtureData);
  });

  test('should create files dir', async () => {
    await loader(url, tempdirName);
    const files = await fs.readdir(os.tmpdir());
    expect(files).toContain(imgDirName);
  });

  test('should download image', async () => {
    await loader(url, tempdirName);
    const imagePath = `${tempdirName}/${imgDirName}/kz-hexlet-io-assets-professions-nodejs.png`;
    await expect(fs.access(imagePath)).resolves.not.toThrow();
  });
})
