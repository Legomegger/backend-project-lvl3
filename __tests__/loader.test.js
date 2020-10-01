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
let scope;
let testFilePath;

const getFixturePath = (filename, extension) => {
  const dirname = path.resolve();
  return path.join(dirname, '.', '__tests__', '__fixtures__', `${filename}.${extension}`);
};

beforeAll(async () => {
  pageCode = await fs.readFile(getFixturePath('page', 'html'), 'utf-8');
  testFilePath = path.join(os.tmpdir(), 'hexlet-io-courses.html');
  scope = nock('https://hexlet.io')
    .get('/courses')
    .reply(200, {
      data: pageCode.trim(),
    });
});

beforeEach(async () => {
  await fs.unlink('development.log').catch(_.noop);
});

describe('test', () => {
  test('same content', () => {
    return loadPage('https://hexlet.io/courses', path.join(os.tmpdir())).then((response) => {
      fs.readFile(testFilePath, 'utf-8').then((data) => {
        expect(data.trim()).toEqual(pageCode.trim());
      });
      expect(scope.isDone()).toBe(true);
    });
  });
});
