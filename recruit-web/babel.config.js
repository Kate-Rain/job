/**
 * Vue.js项目的Babel配置文件
 * 用于配置项目的转译规则和插件
 */
module.exports = {
  presets: [
    [
      '@vue/app',
      {
        useBuiltIns: 'entry' // 指定使用方式为entry，表示在入口文件引入polyfill
      }
    ]
  ],
  plugins: [
    [
      'component',
      {
        libraryName: 'element-ui', // 指定要导入的Element UI组件库名称
        styleLibraryName: 'theme-chalk', // 指定要导入的Element UI样式主题名称
      },
    ],
  ],
}
