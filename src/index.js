import axios from "axios"
import * as fs from 'fs/promises';
import path from "path";
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';


const getHtml = (url) => {
  return axios.get(url).then(response => response.data);
}
const getAssetsFolderName = (url) => {
  const transformedHostname = new URL(url).hostname.replaceAll('.', '-');
  const transformedPathname = new URL(url).pathname.replaceAll('/', '-');
  return `${transformedHostname}${transformedPathname}_files`;
}

const getHtmlFileName = (url) => {
  const transformedHostname = new URL(url).hostname.replaceAll('.', '-');
  const transformedPathname = new URL(url).pathname.replaceAll('/', '-');
  return `${transformedHostname}${transformedPathname}.html`;
}

const toFilename = (src, url) => {
  const absUrl = new URL(src, url);
  const clean = absUrl.hostname.replaceAll('.', '-') + absUrl.pathname.replaceAll('/', '-');
  return clean;
}

const extractAssets = (html, url) => {
  const $ = cheerio.load(html);
  const assets = [];
  $('[src]').each((_, el) => {
    const src = $(el).attr('src');
    const absUrl = new URL(src, url).href;
    const filename = toFilename(src, url);
    assets.push({ src, absUrl, filename });
  });

  return { $, assets };
}

const downloadAssets = (assets, outputDir, folderName) => {
  const assetsDir = path.join(outputDir, folderName);
  return fs.mkdir(assetsDir, {recursive: true}).then(() => {
    return Promise.all(
      assets.map(({absUrl, filename}) => {
        const filepath = path.join(assetsDir, filename);
        return axios({ url: absUrl, responseType: 'stream' }).then(res => new Promise((resolve, reject) => {
          const stream = createWriteStream(filepath);
          res.data.pipe(stream);
          stream.on('finish', resolve);
          stream.on('error', reject);
        }));
      })
    )
  })

}

const updateHtmlLinks = ($, assets, folderName) => {
  assets.forEach(({src, filename}) => {
    $(`[src="${src}"]`).attr('src', `${folderName}/${filename}`);
  })
  return $.html();
}

const saveHtml = (updatedHtml, outputDir, url) => {
  const filepath = path.join(outputDir, getHtmlFileName(url))
  return fs.writeFile(filepath, updatedHtml);
}

export default (url, outputDir) => {
  const folderName = getAssetsFolderName(url);

  return getHtml(url)
    .then((html) => {
      const { $, assets } = extractAssets(html, url);
      return downloadAssets(assets, outputDir, folderName).then(() =>
        updateHtmlLinks($, assets, folderName)
      )
    })
    .then((updatedHtml) => saveHtml(updatedHtml, outputDir, url))
}
