import Vue from 'vue'
import { mapGetters } from 'vuex'

const globalMixin = { /** * 全局混入(mixin)对象 * 用于向所有Vue组件注入全局方法 */
  // eslint-disable-next-line /**   * 安装插件方法   * @param {Object} Vue - Vue实例   */
  install(Vue) {
    Vue.mixin({
      methods: {
        goBack() { /** 检查历史记录长度，如果有上一页则返回上一页，否则跳转到首页    */
          window.history.length > 1 ? this.$router.go(-1) : this.$router.push('/') //  判断历史记录长度决定返回上一页还是跳转到首页
        },
        isAllowed(_permission) { 
          const { permissions } = this.user //  从用户对象中获取权限列表
          for (const mod of permissions) { //  遍历权限列表
            for (const item in mod) { //  遍历模块中的权限项
              for (const a of mod[item]) { //  遍历mod[item]数组中的每个元素a
                if (a.permission === _permission) { //  检查当前元素a的permission属性是否与传入的_permission参数相等
                  return true //  如果匹配，返回true表示有权限
                }
                
              } //  如果不匹配，继续循环下一个元素
            }
          }
          return false //  如果遍历完所有元素都没有找到匹配的permission，返回false表示没有权限
        },
      },
      filters: {
        // ...filter,
      },
      computed: {
        ...mapGetters(['user']),
      },
    })
  },
}

Vue.use(globalMixin)

export default globalMixin
