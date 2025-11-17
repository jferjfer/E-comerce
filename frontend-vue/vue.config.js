const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3005,
    host: '0.0.0.0'
  },
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      fallback: {
        "fs": false,
        "path": false
      }
    }
  }
})