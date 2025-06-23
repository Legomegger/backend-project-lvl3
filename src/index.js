import axios from "axios"
import * as fs from 'fs/promises';

const urlToFilename = (url) => {
  const transformedHostname = url.hostname.replaceAll('.', '-');
  const transformedPathname = url.pathname.replaceAll('/', '-');
  return `${transformedHostname}${transformedPathname}.html`;
};
export default (url, outputDir) => {
  const urlObject = new URL(url);
  const filename = urlToFilename(urlObject);
  return axios.get(url)
    .then((response) => {
      return response.data;
    }).then((contents) => {
      return fs.writeFile(`${outputDir}/${filename}`, contents);
    });
}
