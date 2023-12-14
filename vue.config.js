// vue.config.js
const path = require('path');
const { getProxyInfo } = require('./proxy');
const CompressionWebpackPlugin = require("compression-webpack-plugin"); // gzip压缩插件
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin; //打包后模块大小分析
const TerserPlugin = require('terser-webpack-plugin'); //替代uglifyjs-webpack-plugin打包优化
const ZipPlugin = require('zip-webpack-plugin');
const isPro = process.env.NODE_ENV === 'production'; // 环境判断

// 访问本地文件目录
const resolve = dir => {
  return path.join(__dirname, dir);
};

// cdn预加载使用
const externals = {
  "vue": "Vue",
  "vue-router": "VueRouter",
  "vuex": "Vuex",
  "axios": "axios",
};
// cdn资源
const cdn = {
  // 开发环境
  dev: {
    css: [],
    js: []
  },
  // 生产环境
  build: {
    css: [
      // "https://cdn.jsdelivr.net/npm/vant@2.10.9/lib/index.css"
    ],
    js: [
      "https://lib.baomitu.com/vue/2.6.12/vue.min.js",
      "https://cdn.jsdelivr.net/npm/vue-router@3.4.6/dist/vue-router.min.js",
      "https://cdn.jsdelivr.net/npm/vuex@3.5.1/dist/vuex.min.js",
      "https://cdn.jsdelivr.net/npm/axios@0.20.0/dist/axios.min.js",
    ]
  }
};

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/channelmember/' : '/',// 配置访问路径
  assetsDir: 'static', //  outputDir的静态资源(js、css、img、fonts)目录
  lintOnSave: false,
  devServer: {
    // port: '' // 端口
    proxy: getProxyInfo(),
    // 输出eslint警告和错误信息
    overlay: {
      warnings: true,
      error: true
    }
  },
  productionSourceMap: false, // 打包时不生成.map文件,设置为 false 以加速生产环境构建
  lintOnSave: false,  // eslint语法检查 

  css: {
    modules: false, // 是否将组件中的 CSS 提取至一个独立的 CSS 文件中 (而不是动态注入到 JavaScript 中的 inline 代码)
    sourceMap: false, // 是否构建样式地图，false 将提高构建速度
    loaderOptions: {
      less: {
        javascriptEnabled: true
      },
      postcss: {
        plugins: [
          /* 浏览器兼容前缀 */
          require('autoprefixer')({
            overrideBrowserslist: [
              'Android 4.1',
              'iOS 7.1',
              'Chrome > 31',
              'ff > 31',
              'ie >= 8'
            ]
          })
        ]
      },
      scss: {
        // 向全局sass样式传入共享的全局变量, $src可以配置图片cdn前缀
        // 详情: https://cli.vuejs.org/guide/css.html#passing-options-to-pre-processor-loaders
        // prependData: `
        // @import "assets/css/mixin.scss";
        // @import "assets/css/variables.scss";
        // $cdn: "${defaultSettings.$cdn}";
        // `
      }
    }
  },

  configureWebpack: (config) => {
    if (isPro) {
      Object.assign(config, {
        externals: externals
      });
      // 为生产环境修改配置...
      config.plugins.push(
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: false,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true
            }
          }
        })
      );
      // 开启gzip压缩
      const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
      config.plugins.push(
        new CompressionWebpackPlugin({
          filename: "[path].gz[query]",
          algorithm: "gzip",
          test: productionGzipExtensions,
          threshold: 10240,
          minRatio: 0.8
        }),
        new ZipPlugin({
          filename: 'dist.zip',
          path: path.join(__dirname, './')
        })
      );
      if (process.env.npm_config_report) {
        // 打包后模块大小分析 npm run build --report
        config.plugins.push(new BundleAnalyzerPlugin());
      }
    }
  },

  // webpack相关配置
  chainWebpack: (config) => {
    /**
      * 删除懒加载模块的prefetch，降低带宽压力
      * https://cli.vuejs.org/zh/guide/html-and-static-assets.html#prefetch
      * 而且预渲染时生成的prefetch标签是modern版本的，低版本浏览器是不需要的
      */
    config.plugins.delete('preload');
    config.plugins.delete("prefetch");
    // 对vue-cli内部的 webpack 配置进行更细粒度的修改。
    // 添加CDN参数到htmlWebpackPlugin配置中， 详见public/index.html 修改
    config.plugin("html").tap(args => {
      if (process.env.NODE_ENV === "production") {
        args[0].cdn = cdn.build;
      }
      if (process.env.NODE_ENV === "development") {
        args[0].cdn = cdn.dev;
      }
      return args;
    });
    // 修复热更新失效
    // config.resolve.symlinks(true);
    // 设置目录别名alias
    config.resolve.alias
      .set('@', path.resolve('src'))
      .set('@components', path.resolve('src/components'))
      .set('@assets', path.resolve('src/assets'))
      .set('@store', path.resolve('src/store'));

    // 分包策略
    config.optimization.splitChunks({
      chunks: "all",
      cacheGroups: {
        common: {
          name: "chunk-common",
          chunks: "initial",
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
          priority: 1,
          reuseExistingChunk: true,
          enforce: true,
        },
        vendors: {
          name: "chunk-vendors",
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          chunks: "initial",
        },
      },
    });
  },
};
