import {
  test, expect, beforeAll, describe, beforeEach,
} from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import nock from 'nock';
import os from 'os';
import _ from 'lodash';
import loadPage from '../src/index.js';


nock.disableNetConnect();

let pageCode;
let firstTestScope;
let secondTestScope;
let testFilePath;
let assetFilePath;
let imageData;

const getFixturePath = (filename, extension) => {
  const dirname = path.resolve();
  return path.join(dirname, '.', '__tests__', '__fixtures__', `${filename}.${extension}`);
};

beforeAll(async () => {
  pageCode = await fs.readFile(getFixturePath('page', 'html'), 'utf-8');
  imageData = await fs.readFile(getFixturePath('hexlet-io-assets-professions-nodejs', 'png'), 'utf-8');
  testFilePath = path.join(os.tmpdir(), 'hexlet-io-courses.html');
  assetFilePath = path.join(os.tmpdir(), 'hexlet-io-courses_files', 'hexlet-io-assets-professions-nodejs.png');
  firstTestScope = nock('https://hexlet.io')
    .get('/courses')
    .reply(200, pageCode.trim());
  secondTestScope = nock('https://hexlet.io')
    .get('/image/1')
    .reply(200, imageData.trim());
});

beforeEach(async () => {
  await fs.unlink(testFilePath).catch(_.noop);
});

describe('basic tests', () => {
  test('simple page download', () => loadPage('https://hexlet.io/courses', os.tmpdir())
    .then(() => fs.readFile(testFilePath, 'utf-8'))
    .then((data) => expect(data.trim()).toEqual(pageCode.trim()))
    .then(() => expect(firstTestScope.isDone()).toBe(true)));

  test('should download img', () => loadPage('https://hexlet.io/image/1', os.tmpdir())
    .then(() => fs.readFile(assetFilePath, 'utf-8'))
    .then((data) => expect(data.trim()).toEqual(imageData.trim()))
    .then(() => expect(secondTestScope.isDone()).toBe(true)));

});
