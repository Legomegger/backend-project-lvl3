import axios from "axios"
import * as fs from 'fs/promises';
import path from "path";
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';


// Базовая функция преобразования URL в строку
const urlToBaseName = (url, params = {}) => {
  const transformedHostname = url.hostname.replaceAll('.', '-');
  const transformedPathname = url.pathname.replaceAll('/', '-');
  if (params.hostname) {
    return `${transformedHostname}`;
  } else if (params.pathname) {
    return `${transformedPathname}`;
  }
  return `${transformedHostname}${transformedPathname}`;
};

// Функции-композиторы для добавления суффиксов
const withHtmlExtension = (baseName) => `${baseName}.html`;
const withFilesExtension = (baseName) => `${baseName}_files`;

// Композиция функций для получения конечных имён
const urlToFilename = (url) => withHtmlExtension(urlToBaseName(url));
const urlToDirname = (url) => withFilesExtension(urlToBaseName(url));

const extractImgSrc = (rawHtml) => {
  const $ = cheerio.load(rawHtml);
  const imgSrc = $('img').attr('src');
  return imgSrc;
};

export default (url, outputDir) => {
  const urlObject = new URL(url);
  const filename = urlToFilename(urlObject);
  const imgDirName = urlToDirname(urlObject);
  let imgSrc;

  return fs.mkdir(path.join(outputDir, imgDirName), { recursive: true })
    .then(() => axios.get(url))
    .then((response) => response.data)
    .then((contents) => {
      imgSrc = extractImgSrc(contents);
      return contents;
    })
    .then((contents) => fs.writeFile(path.join(outputDir, filename), contents))
    .then(() => {
      const hostname = urlObject.hostname
      const protocol = urlObject.protocol
      const imgPath = path.join(protocol, hostname, imgSrc)
      return axios.get(imgPath, {
        responseType: 'stream'
      })
    })
    .then((imageContents) => {
      const imgSavePath = path.join(outputDir, imgDirName, 'kz-hexlet-io-assets-professions-nodejs.png')
      const writer = createWriteStream(imgSavePath);
      imageContents.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    })
}
