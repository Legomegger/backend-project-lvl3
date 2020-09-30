import axios from 'axios';
import fs from 'fs/promises';

export default async (url, savePath) => {
  const pageContent = axios.get(url).then((response) => response.data);
  fs.writeFile(savePath, pageContent.then(e => e.data));
  fs.readFile(savePath, 'utf-8');
  console.log(res)
};
