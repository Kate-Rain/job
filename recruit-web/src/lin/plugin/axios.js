// ajax 封装插件, 使用 axios
import Vue from 'vue'
import axios from 'axios'
import Config from '@/config'
import ErrorCode from '@/config/error-code'
import store from '@/store'
import {
  getToken,
  saveAccessToken
} from '@/lin/util/token'

/**
 * 配置对象，用于设置axios请求的基础参数
 * @type {Object}
 */
/**
 * 配置对象，用于设置axios请求的基础参数
 * @type {Object}
 */
/**
 * 配置对象，包含请求的基础设置
 * @type {Object}
 */
const config = {
  baseURL: Config.baseURL || process.env.apiUrl || '', // 请求的基础URL，优先使用Config.baseURL，其次使用环境变量apiUrl，最后为空字符串
  timeout: 10 * 1000, // 请求超时时间设置，单位为毫秒
  crossDomain: true, // 是否允许跨域请求
  // withCredentials: true, 是否需要跨域凭证
  // 定义可获得的http响应状态码
  // return true、设置为null或者undefined，promise将resolved,否则将rejected
/**
 * 验证HTTP状态码是否有效
 * @param {number} status - HTTP状态码
 * @returns {boolean} - 返回状态码是否在有效范围内
 */
  validateStatus(status) {
  // 检查状态码是否在200到509之间（包含200，不包含510）
    return status >= 200 && status < 510
  },
}

/**
 * 错误码是否是refresh相关
 * @param {number} code 错误码
 */
function refreshTokenException(code) {
  let flag = false
  const codes = [10000, 10042, 10050, 10052]
  if (codes.includes(code)) {
    flag = true
  }
  return flag
}

// const retryTime = 2 // 请求失败重试次数
// const retryDelay = 1500 // 请求失败重试间隔

// 创建请求实例
/**
 * 创建axios实例
 * @param {Object} config - axios配置对象
 * @returns {Object} axios实例
 */
const _axios = axios.create(config)

_axios.interceptors.request.use(
  originConfig => {
    // 有 API 请求重新计时
    Vue.prototype.$_lin_jump()

    // 创建一个请求配置对象，通过展开运算符复制originConfig的属性
    const reqConfig = {
      ...originConfig  // 使用展开运算符将originConfig的所有属性复制到reqConfig中
    }

    // step1: 容错处理
    // 检查请求配置中是否包含URL
    if (!reqConfig.url) {
      // 如果没有URL，输出错误信息到控制台
      console.error('request need url')
      // 抛出一个包含错误源和详细信息的错误对象
      throw new Error({
        source: 'axiosInterceptors',  // 错误来源标记为axios拦截器
        message: 'request need url',   // 错误信息，表明请求缺少URL
      })
    }

    if (!reqConfig.method) {
      // 默认使用 get 请求
      reqConfig.method = 'get'
    }
    // 大小写容错
    reqConfig.method = reqConfig.method.toLowerCase()

    // 参数容错
    if (reqConfig.method === 'get') {
      if (!reqConfig.params) {
        // 防止字段用错
        reqConfig.params = reqConfig.data || {}
      }
    } else if (reqConfig.method === 'post') {
      if (!reqConfig.data) {
        // 防止字段用错
        reqConfig.data = reqConfig.params || {}
      }

      // 检测是否包含文件类型, 若包含则进行 formData 封装
      let hasFile = false
      // 遍历请求配置对象中的data属性的所有键
      Object.keys(reqConfig.data).forEach(key => {
        // 检查当前键对应的值是否为对象类型
        if (typeof reqConfig.data[key] === 'object') {
          // 获取当前键对应的值
          const item = reqConfig.data[key]
          // 判断该值是否为FileList、File或Blob类型
          if (item instanceof FileList || item instanceof File || item instanceof Blob) {
            // 如果存在文件类型，将hasFile设置为true
            hasFile = true
          }
        }
      })

      // 检测到存在文件使用 FormData 提交数据
      if (hasFile) {
        // 创建一个新的FormData对象，用于构建表单数据
        const formData = new FormData()
        // 遍历reqConfig.data对象的所有属性键
        Object.keys(reqConfig.data).forEach(key => {
          // 将每个键值对添加到FormData对象中
          formData.append(key, reqConfig.data[key])
        })
        // 更新reqConfig.data为构建好的FormData对象
        reqConfig.data = formData
      }
    } else {
      // TODO: 其他类型请求数据格式处理
      console.warn(`其他请求类型: ${reqConfig.method}, 暂无自动处理`)
    }
    // step2: permission 处理
/**
 * 请求拦截器
 * 用于在请求发送前对请求配置进行处理
 * 主要处理token的添加逻辑，根据不同URL选择添加refresh_token或access_token
 */
    if (reqConfig.url === 'recruit/user/refresh') {  // 判断是否为刷新token的接口
      const refreshToken = getToken('refresh_token')
      if (refreshToken) {
        reqConfig.headers.Authorization = refreshToken
      }
    } else {
      // 有access_token
      const accessToken = getToken('access_token')
      if (accessToken) {
        // eslint-disable-next-line no-param-reassign
        reqConfig.headers.Authorization = accessToken
      }
    }
    return reqConfig
  },
  error => {
    Promise.reject(error)
  },
)

/**
 * 添加一个响应拦截器
 * 该拦截器用于在接收到响应后对响应数据进行处理或转换
 * 通常用于统一处理错误响应、数据格式转换等场景
 */
_axios.interceptors.response.use(
  /**
   * 处理响应结果的处理函数
   * @param {Object} res - 响应对象
   * @returns {Promise} - 返回一个Promise对象，可能解析为响应数据或null
   */
  async res => {
      // 从响应数据中解构出code和message
      let {
        code,
        message
      } = res.data 
      // 检查响应状态码的第一位是否为2（表示成功）
      if (res.status.toString().charAt(0) === '2') {
        return res.data
      }
      // 如果状态码不为2，则创建一个新的Promise来处理错误情况
      return new Promise(async (resolve, reject) => {
        // 从响应配置中获取url
        const {
          url
        } = res.config

        // refreshToken相关，直接登出
        if (refreshTokenException(code)) {
          setTimeout(() => {
            store.dispatch('loginOut')
            const {
              origin
            } = window.location
            window.location.href = origin
          }, 1500)
          return resolve(null)
        }
        // assessToken相关，刷新令牌
        if (code === 10041 || code === 10051) {
          const cache = {}
          if (cache.url !== url) {
            cache.url = url
            const refreshResult = await _axios('recruit/user/refresh')
            saveAccessToken(refreshResult.access_token)
            // 将上次失败请求重发
            const result = await _axios(res.config)
            return resolve(result)
          }
        }
        // 第一种情况：默认直接提示后端返回的异常信息；特殊情况：如果本次请求添加了 handleError: true，用户自己try catch，框架不做处理
        if (res.config.handleError) {
          return reject(res)
        }
        // 第二种情况：采用前端自己的一套异常提示信息；特殊情况：如果本次请求添加了 showBackend: true, 弹出后端返回错误信息。
        if (Config.useFrontEndErrorMsg && !res.config.showBackend) {
          // 弹出前端自定义错误信息
          const errorArr = Object.entries(ErrorCode).filter(v => v[0] === code.toString())
          // 匹配到前端自定义的错误码
          if (errorArr.length > 0 && errorArr[0][1] !== '') {
            message = errorArr[0][1] 
          } else {
            message = ErrorCode['777']
          }
        }

/**
 * 显示错误消息并拒绝Promise
 */
        Vue.prototype.$message({
          message,
          type: 'error',
        })
        reject()
      })
    },
    error => {
      if (!error.response) {
        Vue.prototype.$notify({
          title: 'Network Error',
          dangerouslyUseHTMLString: true,
          message: '<strong class="my-notify">请求错误,服务器无响应.</strong>',
        })
        console.log('error', error)
      }

      if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') !== -1) {
        Vue.prototype.$message({
          type: 'warning',
          message: '请求超时',
        })
      }
      return Promise.reject(error)
    },
)

Plugin.install = function (Vue, options) {
  Vue.axios = _axios
  window.axios = _axios
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios
      },
    },
    $axios: {
      get() {
        return _axios
      },
    },
  })
}

if (!Vue.axios) {
  Vue.use(Plugin)
}

// 导出常用函数

/**
 * @param {string} url
 * @param {object} data
 * @param {object} params
 */
export function post(url, data = {}, params = {}) {
  return _axios({
    method: 'post',
    url,
    data,
    params,
  })
}

/**
 * @param {string} url
 * @param {object} params
 */
export function get(url, params = {}) {
  return _axios({
    method: 'get',
    url,
    params,
  })
}

/**
 * @param {string} url
 * @param {object} data
 * @param {object} params
 */
export function put(url, data = {}, params = {}) {
  return _axios({
    method: 'put',
    url,
    params,
    data,
  })
}

/**
 * @param {string} url
 * @param {object} params
 */
export function _delete(url, params = {}) {
  return _axios({
    method: 'delete',
    url,
    params,
  })
}

export default _axios
