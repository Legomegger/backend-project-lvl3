import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const urlToFileName = (url) => {
  const rule = /\/\/(.*)/;
  const arrayOfWords = url.match(rule)[0].split('/')
    .filter((word) => word)
    .flatMap((word) => word.split('.'));
  return arrayOfWords.join('-').concat('.html');
};
export default async (url, savePath) => {
  const outputFilename = urlToFileName(url);
  const resultFilename = path.join(savePath, outputFilename);
  return axios.get(url).then((content) => fs.writeFile(resultFilename, content.data));
};
