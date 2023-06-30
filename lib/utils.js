export const transformUrl = (urlObject) => {
  return (fullEnding) => {
    const base = `${urlObject.hostname.replaceAll('.', '-')}${urlObject.pathname.replaceAll('/', '-')}`;
    if (urlObject.pathname.endsWith('/')) {
      return `${base.slice(0, -1)}${fullEnding}`;
    }
    return `${base}${fullEnding}`;
  };
};
