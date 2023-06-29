import path from 'path';
import axios from 'axios';
import fs from 'fs/promises';
import { urlToFilename } from '../lib/utils.js';

const pageLoader = (url, savePath = process.cwd()) => {
  const filename = urlToFilename(url);
  const savedPath = `${savePath}/${filename}`;
  return axios.get(url)
    .then((r) => r.data)
    .then((data) => data.trim())
    .then((content) => fs.writeFile(savedPath, content))
    .then(() => savedPath)
    .catch((e) => console.error(e));
};

export default pageLoader;
