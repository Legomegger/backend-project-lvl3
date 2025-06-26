import nock from 'nock';
import os from 'os'
import loader from '../src/index.js';
import * as fs from 'fs/promises';
import { loadFixture, prepareTestEnvironment, prettifyHtml } from '../utils/test-helpers.js';
import path from 'path';

nock.disableNetConnect();

const baseUrl = 'https://kz.hexlet.io';
const page = '/courses';
const url = `${baseUrl}${page}`;

describe('working with simple contents', () => {
  let beforeFixtureData;
  let afterFixtureData;
  let projectTestDir;
  const fileName = 'kz-hexlet-io-courses.html';
  const imgDirName = 'kz-hexlet-io-courses_files';

  beforeEach(async () => {
    projectTestDir = (await prepareTestEnvironment());
    beforeFixtureData = await prettifyHtml(await loadFixture('before.html'))
    afterFixtureData = await prettifyHtml(await loadFixture('after.html'))
    nock(baseUrl).get(page).reply(200, beforeFixtureData);

    const fixtureImagePath = '/assets/professions/nodejs.png';
    const imageBuffer = (await loadFixture(fixtureImagePath, null));
    nock(baseUrl).get(fixtureImagePath).reply(200, imageBuffer, {
      'Content-Type': 'image/png',
    });
  })

  test('should create correct file', async () => {
    await loader(url, projectTestDir);
    const files = await fs.readdir(os.tmpdir());
    expect(files).toContain(fileName);
  });

  test('should save contents from url', async () => {
    await loader(url, projectTestDir);
    const resultFilePath = path.join(projectTestDir, fileName)
    const tempfileContents = await prettifyHtml(await fs.readFile(resultFilePath, 'utf8'));
    expect(tempfileContents).toEqual(afterFixtureData);
  });

  test('should create files dir', async () => {
    await loader(url, projectTestDir);
    const files = await fs.readdir(os.tmpdir());
    expect(files).toContain(imgDirName);
  });

  test('should download image', async () => {
    await loader(url, projectTestDir);
    const imagePath = `${projectTestDir}/${imgDirName}/kz-hexlet-io-assets-professions-nodejs.png`;
    await expect(fs.access(imagePath)).resolves.not.toThrow();
  });
})
