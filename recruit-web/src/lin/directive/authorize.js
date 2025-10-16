// 定义 isAllowed 函数用于判断用户是否有权限。
// isAllowed 根据用户是否为管理员、权限字符串或数组进行权限校验。
import Vue from 'vue'
import store from '@/store'

function isAllowed(permission, user, permissions) {
  if (user.admin) {
    return true
  }
  if (typeof permission === 'string') {
    return permissions.includes(permission)
  }
  if (permission instanceof Array) {
    return permission.some(auth => permissions.indexOf(auth) >= 0)
  }
  return false
}

Vue.directive('permission', {
  bind(el, binding) {
    let permission
    let type
    if (Object.prototype.toString.call(binding.value) === '[object Object]') {
      // eslint-disable-next-line prefer-destructuring
      permission = binding.value.permission
      // eslint-disable-next-line prefer-destructuring
      type = binding.value.type
    } else {
      permission = binding.value
    }
    const isAllow = isAllowed(permission, store.state.user || {}, store.state.permissions)
    const element = el
    if (!isAllow && permission) {
      if (type) {
        element.disabled = true
        element.style.opacity = 0.4
        element.style.cursor = 'not-allowed'
      } else {
        element.style.display = 'none'
      }
    }
  },
})

export default Vue.directive('permission')
