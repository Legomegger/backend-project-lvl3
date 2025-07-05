import nock from 'nock'
import loader from '../src/index.js'
import * as fs from 'fs/promises'
import { loadFixture, prepareTestEnvironment, prettifyHtml } from '../utils/test-helpers.js'
import path from 'path'

nock.disableNetConnect()

const baseUrl = 'https://ru.hexlet.io'
const page = '/courses'
const url = (new URL(page, baseUrl)).href

describe('working with simple contents', () => {
  let beforeFixtureData
  let afterFixtureData
  let projectTestDir
  const fileName = 'ru-hexlet-io-courses.html'
  const imgDirName = 'ru-hexlet-io-courses_files'

  beforeEach(async () => {
    projectTestDir = (await prepareTestEnvironment())
    beforeFixtureData = await prettifyHtml(await loadFixture('before.html'))
    afterFixtureData = await prettifyHtml(await loadFixture('after.html'))

    // Изображения
    const fixtureImagePath = '/assets/professions/nodejs.png'
    const imageBuffer = (await loadFixture(fixtureImagePath, null))
    nock('https://ru.hexlet.io')
      .get('/servererror')
      .reply(500)

    nock('https://ru.hexlet.io')
      .persist()
      .get(/.*/)
      .reply(200, (uri) => {
        if (uri === '/courses') return beforeFixtureData
        if (uri.endsWith('.png')) return imageBuffer
        if (uri.endsWith('.css')) return '/* mock css */'
        if (uri.endsWith('.js')) return '/* mock js */'
        return ''
      })
  })

  test('should create correct file', async () => {
    await loader(url, projectTestDir)
    const files = await fs.readdir(projectTestDir)
    expect(files).toContain(fileName)
  })

  test('should save contents from url', async () => {
    await loader(url, projectTestDir)
    const resultFilePath = path.join(projectTestDir, fileName)
    const tempfileContents = await prettifyHtml(await fs.readFile(resultFilePath, 'utf8'))
    expect(tempfileContents).toEqual(afterFixtureData)
  })

  test('should create files dir', async () => {
    await loader(url, projectTestDir)
    const files = await fs.readdir(projectTestDir)
    expect(files).toContain(imgDirName)
  })

  test('should download image', async () => {
    await loader(url, projectTestDir)
    const imagePath = `${projectTestDir}/${imgDirName}/ru-hexlet-io-assets-professions-nodejs.png`
    await expect(fs.access(imagePath)).resolves.not.toThrow()
  })

  test('should throw error when fetching 500 status', async () => {
    const serverErrorUrl = 'https://ru.hexlet.io/servererror'
    expect.assertions(1)
    try {
      await loader(serverErrorUrl, projectTestDir)
    }
    catch (error) {
      expect(error.message).toMatch('500')
    }
  })

  test('should throw error when fetching nonexisting site', async () => {
    const nonexistingUrl = 'https://nonexisting-site-hexlet.io'
    nock(nonexistingUrl).get(/.*/).reply(500)
    expect.assertions(1)
    try {
      await loader(nonexistingUrl, projectTestDir)
    }
    catch (error) {
      expect(error.message).toMatch('500')
    }
  })

  test('should throw error when trying to save in nonexisting dir', async () => {
    const nonexistingDir = '/qwe/asd'
    expect.assertions(1)
    try {
      await loader(url, nonexistingDir)
    }
    catch (error) {
      expect(error.message).toMatch('ENOENT')
    }
  })
})
