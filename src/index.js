import axios from "axios"
import * as fs from 'fs/promises';
import path from "path";
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';

const downloadPage = (url) => {
  return axios.get(url).then((response) => response.data)
}

const isLocalAsset = (src, url) => {
  if (!src) return;

  const hostname = new URL(url).hostname
  const fullUrl = new URL(src, url).href;
  return fullUrl.includes(hostname);
}

const buildFullUrl = (src, url) => {
  return new URL(src, url).href
}
const getLocalLinks = ($, url) => {
  let result = []
  const elementsToProcess = [{type: 'link', attrib: 'href'}, {type: 'script', attrib: 'src'},{type: 'img', attrib: 'src'}] 
  elementsToProcess.forEach(({type, attrib}) => {
    $(type).each((_, elem) => {
      const elemSrc = $(elem).attr(attrib);
      if (isLocalAsset(elemSrc, url)) {
        const fullAssetUrl = buildFullUrl(elemSrc, url);
        result.push({
          type,
          attrib,
          fullAssetUrl,
          elemSrc,
        })
      }
    })
  })
  return result;
};
const dasherizeHostname = (str) => {
  return replace(str, {from: '.', to: '-'})
}
const downloadAsset = (fullAssetUrl, filePath, dir) => {
  return fs.mkdir(dir, { recursive: true }).then(() => axios.get(fullAssetUrl, { responseType: 'stream' }))
    .then((response) => {
      const writer = createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    })
    .catch((err) => {
      console.error(`Ошибка при загрузке ${fullAssetUrl}:`, err.message);
      throw err;
    });
};
const normalizeLinkSrc = (src) => {
  if (src.startsWith('/') && src.includes('.')) {
    return src;
  } else if (src.startsWith('/')) {
    return `${src}.html`
  } else if (src.startsWith('http')) {
    const urlObject = new URL(src)
    return urlObject.pathname
  }
      src.includes('.') ? src : `${src}.html`
}
const downloadAssets = (assetsData, assetsDirPath) => {
  return Promise.all(
    assetsData.map((assetData) => {
      const { fullAssetUrl, elemSrc } = assetData
      const transformedHostname = dasherizeHostname(new URL(fullAssetUrl).hostname)
      const normalizedLinkSrc = normalizeLinkSrc(elemSrc)
      const fileName = replace(normalizedLinkSrc, {from: '/', to: '-'})
      const newLink = `${transformedHostname}${fileName}`
      const filePath = `${assetsDirPath}/${newLink}`
      return downloadAsset(fullAssetUrl, filePath, assetsDirPath).then(() => newLink)
    })
  ).then((newLinks) => {
    return newLinks;
  })
};
const extractLocalAssets = (html, url) => {
  const $ = cheerio.load(html);
  const linksData = getLocalLinks($, url)
  return [linksData, $];
};

const replace = (str, {from, to}) => {
  return `${str.replaceAll(from, to)}`
}

const dasherizeUrl = (url) => {
  const urlObject = new URL(url)
  const transformedHostname = replace(urlObject.hostname, {from: '.', to: '-'})
  const transformedPathname = replace(urlObject.pathname, {from: '/', to: '-'})
  if (transformedPathname.endsWith('-')) {
    return transformedHostname + transformedPathname.slice(0, -1);
  }
  return transformedHostname + transformedPathname;
} 

const getAssetsDirName = (outputDirPath, url) => {
  return path.join(outputDirPath, `${dasherizeUrl(url)}_files`)
}

const updateHtmlLinks = (newLinks, assetsData, $html) => {
  newLinks.forEach((link, index) => {
    const {type, attrib, elemSrc} = assetsData[index];
    $html(`${type}[${attrib}="${elemSrc}"]`).attr(attrib, link)
  });
  return $html;
}

export default (url, outputDirPath) => {
  const assetsDirPath = getAssetsDirName(outputDirPath, url);

  let assetsData;
  let $html;

  return downloadPage(url)
    .then((html) => {
      [assetsData, $html] = extractLocalAssets(html, url)
    })
    .then(() => {
      return downloadAssets(assetsData, assetsDirPath)
    })
    .then((newLinks) => {
      const pathsToLocalAssets = newLinks.map((link) => {
        return `${dasherizeUrl(url)}_files/${link}`
      })
      return updateHtmlLinks(pathsToLocalAssets, assetsData, $html)
    })
    .then(($newHtml) => {
      const htmlToWrite = $newHtml.html();
      const resultFilename = `${dasherizeUrl(url)}.html`;
      const savePath = path.join(outputDirPath, resultFilename)
      return fs.writeFile(savePath, htmlToWrite)
    })
}
