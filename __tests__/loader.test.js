import {
  test, expect, beforeAll, describe,
} from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import nock from 'nock';
import loadPage from '../src/index.js';

nock.disableNetConnect();

let pageCode;

const getFixturePath = (filename, extension) => {
  const dirname = path.resolve();
  return path.join(dirname, '.', '__tests__', '__fixtures__', `${filename}.${extension}`);
};

beforeAll(async () => {
  pageCode = await fs.readFile(getFixturePath('page', 'html'), 'utf-8');
});

describe('test', () => {
  test('mock test', async () => {
    const scope = nock('https://hexlet.io')
      .get('/courses')
      .reply(200, {
        data: pageCode.trim(),
      });
    expect(scope.isDone()).toBe(false);
  });

  test('same content', () => {
    return loadPage('https://hexlet.io/courses', '/var/tmp').then((response) => {
      expect(response.data).toEqual(pageCode.trim());
    });
  });
});
