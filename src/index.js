import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';

const urlToFileName = (url) => {
  const rule = /\/\/(.*)/;
  const arrayOfWords = url.match(rule)[0].split('/')
    .filter((word) => word)
    .flatMap((word) => word.split('.'));
  return arrayOfWords.join('-').concat('.html');
};
const urlToAssetDirectory = (url) => {
  const rule = /\/\/(.*)/;
  const arrayOfWords = url.match(rule)[0].split('/')
    .filter((word) => word)
    .flatMap((word) => word.split('.'));
  return arrayOfWords.join('-').concat('_files');
};
const getImageLinksFromPage = (page) => {
  const $ = cheerio.load(page);
  const elements = Array.from($('img[src]'));
  const links = elements.map((element) => element.src);
  return links;
};
export default async (url, savePath) => {
  let imageLinks;
  const pageFilename = urlToFileName(url);
  const assetsDirectory = urlToAssetDirectory(url);
  const resultPath = path.join(savePath, pageFilename);
  const request = axios.get(url).then((content) => {
    imageLinks = getImageLinksFromPage(content.data);
    return content;
  }).then((content) => fs.writeFile(resultPath, content.data));

  // const request = axios.get(url).then((content) => fs.writeFile(resultFilename, content.data));
};
