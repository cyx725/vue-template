const { PROXY } = require("./devServer.js");

// 代理信息
function getProxyInfo () {
  const tempProxy = PROXY || {};
  const proxy = {};
  Object.keys(tempProxy).forEach((key) => {
    const data = tempProxy[key] || {};
    if (data.target) {
      proxy[key] = {
        ...data,
        ws: true,
        changeOrigin: true,
      };
    }
  });
  return proxy;
}

module.exports = {
  getProxyInfo
};