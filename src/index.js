import axios from 'axios';
import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { transformUrl } from '../lib/utils.js';
import { createWriteStream } from 'fs';

const pageLoader = (url, savePath = process.cwd()) => {
  const urlObject = new URL(url);
  const urlTo = transformUrl(urlObject);
  const assetsDirname = urlTo('_files');
  const pageFilename = urlTo('.html');
  const assetsDirFullpath = `${savePath}/${assetsDirname}`;

  const savedPath = `${savePath}/${pageFilename}`;
  let $;
  let originalImageSrcs;
  let promises;
  let imgs;
  let newAssetFilenames;
  return axios.get(urlObject.href)
    .then((r) => r.data)
    .then((data) => {
      $ = cheerio.load(data.trim());
      imgs = $('img');
      originalImageSrcs = imgs.get().map((img) => {
        return $(img).attr('src').startsWith('/') ? `${urlObject.origin}${$(img).attr('src')}`: `${$(img).attr('src')}`
      });
    })
    .then(fs.mkdir(assetsDirFullpath))
    .then(() => {
      newAssetFilenames = originalImageSrcs.map((imgSrc) => {
        return transformUrl(new URL(imgSrc))('');
      });
    })
    .then(() => {
      promises = originalImageSrcs.map((imgSrc) => {
        return axios.get(imgSrc, { responseType: 'stream' });
      })
      return Promise.all(promises);
    })
    .then((contents) => {
      contents.forEach((content, i) => {
        const downloadedAssetFilename = newAssetFilenames[i]
        content.data.pipe(createWriteStream(`${assetsDirFullpath}/${downloadedAssetFilename}`))
        $(imgs.get()[i]).attr('src', `${assetsDirname}/${downloadedAssetFilename}`)
      });
    })
    .then(() => fs.writeFile(savedPath, $.html()))
    .then(() => savedPath)
    .catch((e) => console.error(e));
};

export default pageLoader;
