import { fileURLToPath } from 'url'
import path from 'path'
import * as fs from 'fs/promises'
import os from 'os'
import prettier from 'prettier'

export const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)
export const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
const cleanTestEnvironment = async (testDirPath) => {
  await fs.rm(testDirPath, { recursive: true, force: true }).catch(() => {})
}
export const prepareTestEnvironment = async () => {
  const testDirPath = path.join(os.tmpdir(), '/project-3')
  await cleanTestEnvironment(testDirPath)
  await fs.mkdir(testDirPath).catch(() => {})
  return testDirPath
}

export const loadFixture = async (fixtureFilename, enc = 'utf8') => {
  if (!enc) {
    return (await fs.readFile(getFixturePath(fixtureFilename)))
  }
  return (await fs.readFile(getFixturePath(fixtureFilename), enc)).trim()
}

export const prettifyHtml = async (html) => {
  return (await prettier.format(html, { parser: 'html' }))
}
