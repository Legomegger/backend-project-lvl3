import axios from 'axios';

export default async (url, savePath) => {
  return axios.get(url).then((response) => console.log(response.data));
};
