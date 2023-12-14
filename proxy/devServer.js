const PROXY = {
  '/a': {
    target: 'https://www.abc.com',
    pathRewrite: {
      '^/': '/',
    }
  },
  '/(a|b)': {
    target: 'https://www.abc.com'
  },
};

module.exports = {
  PROXY,
};