import axios from 'axios'
import debug from 'debug'
import * as fs from 'fs/promises'
import path from 'path'
import * as cheerio from 'cheerio'
import { createWriteStream } from 'fs'
import Listr from 'listr'

// Создаем логгеры для разных частей приложения
const debugMain = debug('page-loader:main')
const debugDownload = debug('page-loader:download')
const debugAssets = debug('page-loader:assets')
const debugFiles = debug('page-loader:files')

const downloadPage = (url) => {
  debugDownload('Загрузка страницы: %s', url)
  return axios.get(url).then((response) => {
    debugDownload('Страница загружена, размер: %d байт', response.data.length)
    return response.data
  }).catch((error) => {
    throw new Error(`URL: ${url} call unsuccessful ${error.message}`)
  })
}

const isLocalAsset = (src, url) => {
  if (!src) return

  const hostname = new URL(url).hostname
  const fullUrl = new URL(src, url).hostname
  const isLocal = fullUrl === hostname
  debugAssets('Проверка ресурса %s: %s', src, isLocal ? 'локальный' : 'внешний')
  return isLocal
}

const buildFullUrl = (src, url) => {
  return new URL(src, url).href
}

const getLocalLinks = ($, url) => {
  let result = []
  const elementsToProcess = [{ type: 'link', attrib: 'href' }, { type: 'script', attrib: 'src' }, { type: 'img', attrib: 'src' }]
  debugAssets('Поиск локальных ресурсов для типов: %o', elementsToProcess.map(e => e.type))

  elementsToProcess.forEach(({ type, attrib }) => {
    $(type).each((_, elem) => {
      const elemSrc = $(elem).attr(attrib)
      if (isLocalAsset(elemSrc, url)) {
        const fullAssetUrl = buildFullUrl(elemSrc, url)
        result.push({
          type,
          attrib,
          fullAssetUrl,
          elemSrc,
        })
      }
    })
  })

  debugAssets('Найдено локальных ресурсов: %d', result.length)
  return result
}

const dasherizeHostname = (str) => {
  return replace(str, { from: '.', to: '-' })
}

const downloadAsset = (fullAssetUrl, filePath) => {
  debugDownload('Загрузка ресурса: %s -> %s', fullAssetUrl, filePath)

  return axios.get(fullAssetUrl, { responseType: 'stream' })
    .then((response) => {
      const writer = createWriteStream(filePath)
      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          debugDownload('Ресурс загружен: %s', filePath)
          resolve()
        })
        writer.on('error', reject)
      })
    })
    .catch((err) => {
      debugDownload('Ошибка при загрузке %s: %s', fullAssetUrl, err.message)
      throw err
    })
}

const normalizeLinkSrc = (src) => {
  if (src.startsWith('/') && src.includes('.')) {
    return src
  }
  else if (src.startsWith('/')) {
    return `${src}.html`
  }
  else if (src.startsWith('http')) {
    const urlObject = new URL(src)
    return urlObject.pathname
  }
}

const downloadAssets = (assetsData, assetsDirPath) => {
  debugAssets('Начинаем загрузку %d ресурсов в %s', assetsData.length, assetsDirPath)

  const assetsInfo = assetsData.map((assetData) => {
    const { fullAssetUrl, elemSrc } = assetData
    const transformedHostname = dasherizeHostname(new URL(fullAssetUrl).hostname)
    const normalizedLinkSrc = normalizeLinkSrc(elemSrc)
    const fileName = replace(normalizedLinkSrc, { from: '/', to: '-' })
    const newLink = `${transformedHostname}${fileName}`
    const filePath = `${assetsDirPath}/${newLink}`
    return { fullAssetUrl, filePath, newLink }
  })

  const tasks = assetsInfo.map(info => ({
    title: `Loading: ${info.filePath}`,
    task: () => downloadAsset(info.fullAssetUrl, info.filePath),
  }))
  const listr = new Listr(tasks, { concurrent: true })

  return listr.run().then(() => {
    return assetsInfo.map(info => info.newLink)
  }).catch((err) => {
    throw err
  })
}

const extractLocalAssets = (html, url) => {
  debugMain('Извлечение локальных ресурсов из HTML')
  const $ = cheerio.load(html)
  const linksData = getLocalLinks($, url)
  return [linksData, $]
}

const replace = (str, { from, to }) => {
  return `${str.replaceAll(from, to)}`
}

const dasherizeUrl = (url) => {
  const urlObject = new URL(url)
  const transformedHostname = replace(urlObject.hostname, { from: '.', to: '-' })
  const transformedPathname = replace(urlObject.pathname, { from: '/', to: '-' })
  if (transformedPathname.endsWith('-')) {
    return transformedHostname + transformedPathname.slice(0, -1)
  }
  return transformedHostname + transformedPathname
}

const getAssetsDirName = (outputDirPath, url) => {
  return path.join(outputDirPath, `${dasherizeUrl(url)}_files`)
}

const updateHtmlLinks = (newLinks, assetsData, $html) => {
  debugMain('Обновление ссылок в HTML: %d ссылок', newLinks.length)

  newLinks.forEach((link, index) => {
    const { type, attrib, elemSrc } = assetsData[index]
    $html(`${type}[${attrib}="${elemSrc}"]`).attr(attrib, link)
  })
  return $html
}

export default (url, outputDirPath = process.cwd()) => {
  debugMain('Начинаем загрузку страницы: %s в директорию: %s', url, outputDirPath)

  const assetsDirPath = getAssetsDirName(outputDirPath, url)
  debugMain('Директория для ресурсов: %s', assetsDirPath)

  let assetsData
  let $html

  return fs.access(outputDirPath)
    .then(() => downloadPage(url))
    .then((html) => {
      [assetsData, $html] = extractLocalAssets(html, url)
    })
    .then(() => fs.access(assetsDirPath).catch(() => fs.mkdir(assetsDirPath)))
    .then(() => downloadAssets(assetsData, assetsDirPath))
    .then((newLinks) => {
      const pathsToLocalAssets = newLinks.map((link) => {
        return `${dasherizeUrl(url)}_files/${link}`
      })
      return updateHtmlLinks(pathsToLocalAssets, assetsData, $html)
    })
    .then(($newHtml) => {
      const htmlToWrite = $newHtml.html()
      const resultFilename = `${dasherizeUrl(url)}.html`
      const savePath = path.join(outputDirPath, resultFilename)

      debugFiles('Сохранение HTML файла: %s', savePath)

      return fs.writeFile(savePath, htmlToWrite).then(() => {
        debugMain('Загрузка завершена успешно: %s', savePath)
      }).catch((err) => {
        throw err
      })
    }).catch((err) => {
      throw err
    })
}
