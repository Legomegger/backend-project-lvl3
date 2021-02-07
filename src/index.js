import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';

const urlToFileName = (url) => {
  const newUrl = new URL(url);
  const hostname = newUrl.hostname.split('.').join('-');
  const pathname = newUrl.pathname.split('/').join('-');
  if (newUrl.pathname === '/') {
    return `${hostname}.html`;
  }
  return `${hostname}${pathname}.html`;
};
const urlToAssetDirectory = (url) => {
  const newUrl = new URL(url);
  const hostname = newUrl.hostname.split('.').join('-');
  const pathname = newUrl.pathname.split('/').join('-');
  if (newUrl.pathname === '/') {
    return `${hostname}_files`;
  }
  return `${hostname}${pathname}_files`;
};

const getImageLinksFromPage = (page) => {
  const $ = cheerio.load(page);
  const elements = $('img');
  const lnks = elements.map((e) => $(elements[e]).attr('src'));
  return _.compact(lnks);
};

const removeTrailingSlashes = (link) => {
  if (link[0] === '/' && link[link.length - 1] === '/') {
    return link.slice(1, -1);
  } if (link[0] === '/') {
    return link.slice(1);
  } if (link[link.length - 1 === '/']) {
    return link.slice(0, -1);
  }
  return link;
};

const linkToLocalFile = (link) => {
  const newLink = removeTrailingSlashes(link);
  return `${newLink}`.split('/').join('-');
};

const downloadTo = (url, filepath) => axios({
  method: 'get',
  url,
  responseType: 'stream',
}).then((response) => response.data.pipe(fs.createWriteStream(filepath)));

export default async (url, savePath) => {
  const pageFilename = urlToFileName(removeTrailingSlashes(url));
  const resultPath = path.join(savePath, pageFilename);
  const promise = axios.get(url).then((content) => {
    const imagesLinks = getImageLinksFromPage(content.data);
    const assetDirectory = urlToAssetDirectory(url);
    fs.mkdir(assetDirectory)
    const localFilenames = imagesLinks.map((link) => linkToLocalFile(link));
    const promises = imagesLinks.map((link, index) => downloadTo(link, `${assetDirectory}/${localFilenames[index]}`));
    Promise.all(promises);
    return fs.writeFile(resultPath, content.data);
  });
  return promise;
};
