export const urlToFilename = (url) => {
  // https://ru.hexlet.io/courses
  const urlObject = new URL(url);
  const hostname = urlObject.hostname;
  const pathname = urlObject.pathname;
  return `${hostname.replaceAll('.', '-')}${pathname.replaceAll('/', '-')}.html`
};
