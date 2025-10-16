/**
 * Jest 配置文件
 * 用于配置 Jest 测试框架的行为
 */
module.exports = {
  // 指定 Jest 支持的模块文件扩展名
  moduleFileExtensions: [
    'js',      // JavaScript 文件
    'jsx',     // JSX 文件
    'json',    // JSON 文件
    'vue'      // Vue 单文件组件
  ],
  // 配置文件转换规则
  transform: {
    // Vue 文件使用 vue-jest 转换
    '^.+\\.vue$': 'vue-jest',
    // 静态资源文件使用 jest-transform-stub 转换
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    // JS/JSX 文件使用 babel-jest 转换
    '^.+\\.jsx?$': 'babel-jest'
  },
  // 指定不需要转换的文件路径模式
  transformIgnorePatterns: [
    '/node_modules/'  // 忽略 node_modules 目录下的文件
  ],
  // 配置模块名称映射
  moduleNameMapper: {
    // 将 @/ 映射到 src 目录
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // 配置快照序列化器
  snapshotSerializers: [
    'jest-serializer-vue'  // 用于 Vue 组件的快照序列化
  ],
  // 指定测试文件匹配模式
  testMatch: [
    '**/tests/unit/**/*.test.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'
  ],
  // 设置测试环境的 URL
  testURL: 'http://172.16.28.185/',
  // 配置 watch 模式下的插件
  watchPlugins: [
    'jest-watch-typeahead/filename',  // 文件名搜索提示
    'jest-watch-typeahead/testname'   // 测试名搜索提示
  ]
}
