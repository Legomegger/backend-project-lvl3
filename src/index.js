import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';

const urlToFileName = (url) => {
  const newUrl = new URL(url);
  const hostname = newUrl.hostname.split('.').join('-');
  const pathname = newUrl.pathname.split('/').join('-');
  return `${hostname}${pathname}.html`;
};
const urlToAssetDirectory = (url) => {
  const newUrl = new URL(url);
  const hostname = newUrl.hostname.split('.').join('-');
  const pathname = newUrl.pathname.split('/').join('-');
  return `${hostname}${pathname}_files`;
};

const getImageLinksFromPage = (page) => {
  const $ = cheerio.load(page);
  const elements = $('img');
  const lnks = elements.map((e) => $(elements[e]).attr('src'));
  return _.compact(lnks);
};

const linkToLocalFile = (link) => {
  const newLink = removeTrailingSlashes(link);
  return `${newLink}`.split('/').join('-');
};

const removeTrailingSlashes = (link) => {
  if (link[0] === '/' && link[link.length - 1] === '/') {
    return link.slice(1, -1);
  } if (link[0] === '/') {
    return link.slice(1);
  } if (link[link.length - 1 === '/']) {
    return link.slice(0, -1);
  }
};

export default async (url, savePath) => {
  const pageFilename = urlToFileName(url);
  const assetsDirectory = urlToAssetDirectory(url);
  const resultPath = path.join(savePath, pageFilename);
  const request = axios.get(url).then((content) => {
    fs.writeFile(resultPath, content.data);
    const imagesLinks = getImageLinksFromPage(content.data);
    const assetDirectory = urlToAssetDirectory(url);
    const localFilenames = imagesLinks.map((link) => linkToLocalFile(link));
    console.log(imagesLinks)
    console.log(localFilenames)
    localFilenames.forEach((e) => console.log(`!!! ${assetDirectory}/${e}`))
  });
  return request;
};
