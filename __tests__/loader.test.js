import {
  test, expect, beforeAll, describe, beforeEach,
} from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import nock from 'nock';
import os from 'os'; import _ from 'lodash';
import loadPage from '../src/index.js';

nock.disableNetConnect();

let pageCode;
let testScope;
let testFilePath;
let assetFilePath;
let imageData;

const getFixturePath = (filename, extension) => {
  const dirname = path.resolve();
  return path.join(dirname, '.', '__tests__', '__fixtures__', `${filename}.${extension}`);
};

beforeAll(async () => {
  pageCode = await fs.readFile(getFixturePath('page', 'html'), 'utf-8');
  testFilePath = path.join(os.tmpdir(), 'hexlet-io-courses.html');
  assetFilePath = path.join(os.tmpdir(), 'hexlet-io-courses_files', 'hexlet-io-assets-professions-nodejs.png');
  testScope = nock('https://hexlet.io')
    .get('/courses')
    .reply(200, pageCode.trim());
});

beforeEach(async () => {
  await fs.unlink(testFilePath).catch(_.noop);
});

describe('basic tests', () => {
  test('simple page download', () => loadPage('https://hexlet.io/courses', os.tmpdir())
    .then(() => fs.readFile(testFilePath, 'utf-8'))
    .then((data) => expect(data.trim()).toEqual(pageCode.trim()))
    .then(() => expect(testScope.isDone()).toBe(true)));
});
