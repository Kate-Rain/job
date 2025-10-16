<template>
  <div class="ws-msg-form">
    <div class="msg-content">
      <p class="msg-title" v-if="selectInfo && selectInfo.id == 0">留言沟通</p>
      <p class="msg-title" v-else-if="selectInfo && selectInfo.id != null">
        正在与 <b>{{ selectInfo.name }}</b> 交流
      </p>
      <div class="left">
        <div
          class="item"
          v-for="(item, index) in chatInfo"
          :key="index"
          @click="clickChat(item)"
          :class="{ 'select-style': selectInfo && item && item.id == selectInfo.id }"
        >
          <img class="icon" :src="item && item.icon ? item.icon : defaultImg" />
          <div class="name">{{ item && item.name }}</div>
          <div class="msg" v-if="item && item.type != 'sys'">
            <span v-if="item.msg && item.msg.length > 0">{{ item.msg[item.msg.length - 1].text }}</span>
            <span v-else>快来与对方进行沟通吧</span>
          </div>
          <div class="msg" v-else>{{ item && item.header }}</div>
          <span :class="{ newTip: item && item.isRead == 0 }"></span>
          <span class="chat-time" v-if="item && item.msg && item.msg.length > 0">{{ formatSidebarTime(item.msg[item.msg.length - 1].time) }}</span>
        </div>
      </div>
      <div class="right">
        <div class="form">
          <div class="content" v-if="selectInfo && (selectInfo.id == -1 || selectInfo.id > 0)">
            <div v-if="selectInfo.msg && selectInfo.msg.length > 0">
              <div class="msg-item" v-for="(item, index) in selectInfo.msg" :key="index">
                <div class="timestamp" v-if="item && shouldShowTimestamp(index)">
                  {{ formatMessageTime(item.time) }}
                </div>
                <div :class="item && item.type">
                  <img :src="me && me.avatar ? me.avatar : defaultImg" v-if="item && item.type == 'this'" />
                  <img :src="selectInfo && selectInfo.icon" v-else-if="item" />
                  <span v-if="item" v-html="item.text"></span>
                </div>
              </div>
            </div>
          </div>
          <div class="content" v-else></div>

          <div class="msg-footer">
            <textarea v-model="inputRedis[selectInfo && selectInfo.id ? selectInfo.id : 0]" maxlength="500"></textarea>
            <div class="send">
              <el-row>
                <span v-if="selectInfo && selectInfo.id && inputRedis[selectInfo.id]">{{ inputRedis[selectInfo.id].length }}/500</span>
                <span v-else>0/500</span>
                <el-button type="primary" @click="sendMsg">发送</el-button>
              </el-row>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Application } from '@/model/application'
import Utils from '@/lin/util/util'
import store from '@/store'
import { formatMessageTime, formatSidebarTime, shouldShowTimestamp, formatTimestamp } from '@/lin/util/time-formatter'

export default {
  data() {
    return {
      me: null,
      inputRedis: {}, // 输入的内容缓存
      defaultImg: require('@/assets/image/user/user.png'),
      selectInfo: {
        id: 0,
        msg: [],
        name: '', // 添加默认值防止undefined
        icon: '',  // 添加默认值防止undefined
      },
      chatInfo: {},
      hasHistoryMessages: false, // 标记是否有历史消息
      hasSystemAdminMessage: false, // 标记是否有系统管理员的历史消息
      target_info: [],
      token_msg: {},
      wsCtl: {
        allow: true,
        timer: null,
      },
      hart: {
        timer: 5, // 每隔一段时间监听一次在线客户端 /s
        type: 'ping',
        timeObj: null,
        check: {}, // 当客户端离线之后,第一次离线的加入对象内, 如果第二次还是离线,那么将目标用户标志为离线,避免重复闪烁
      },
      isLoading: false, // 用于标记消息是否正在加载中
    }
  },
  methods: {
    // 使用导入的格式化方法
    formatMessageTime,
    formatSidebarTime,
    
    // 判断是否应该显示时间戳
    shouldShowTimestamp(index) {
      if (!this.selectInfo || !this.selectInfo.msg) return false;
      return shouldShowTimestamp(index, this.selectInfo.msg);
    },
    
    clickChat(item) {
      // 如果当前正在加载中，不允许切换对话
      if (this.isLoading || !item) return;
      
      this.selectInfo = item
      if (item.isRead === 0) {
        if (this.$ws && this.$ws.ws && this.$ws.ws.readyState === 1) {
          this.$ws.ws.send(JSON.stringify({ type: 'state', readID: item.id }))
        }
        item.isRead = 1
      }
      this.moeScroll(10)
    },
    sendMsg() {
      if (!this.wsCtl.allow) {
        return
      }
      if (!this.$ws || !this.$ws.ws || this.$ws.ws.readyState != 1) {
        return this.$message.warning('暂时无法发送信息, 您与服务器的连接已断开.')
      }
      if (!this.selectInfo || !this.selectInfo.id) {
        return this.$message.warning('请先选择一个聊天对象')
      }
      if (!this.inputRedis[this.selectInfo.id]) return
      
      let inputMsg = this.inputRedis[this.selectInfo.id].slice(0, 500) // 限制字数
      this.inputRedis[this.selectInfo.id] = '' // 清空输入框

      // 使用格式化的时间戳
      const timestamp = formatTimestamp()
      
      if (this.selectInfo.msg) {
        this.selectInfo.msg.push({ type: 'this', text: inputMsg, time: timestamp })
      } else {
        this.selectInfo.msg = [{ type: 'this', text: inputMsg, time: timestamp }]
      }

      this.wsCtl.timer = setTimeout(() => {
        this.wsCtl.allow = true
        clearTimeout(this.wsCtl.timer)
        this.wsCtl.timer = null
      }, 1000)

      try {
        if (!this.me) {
          throw new Error('用户信息不存在')
        }
        
        this.$ws.ws.send(
          JSON.stringify({
            self: {
              name: this.me.nickname || '',
              icon: this.me.avatar && JSON.stringify(this.me.avatar).length > 100 ? 'null' : (this.me.avatar || null),
              id: this.me.id,
            },
            target: {
              id: this.selectInfo.id,
              name: this.selectInfo.name || '',
              icon: this.selectInfo.icon && JSON.stringify(this.selectInfo.icon).length > 100 ? 'null' : (this.selectInfo.icon || null),
            },
            time: timestamp,
            type: 'alone',
            content: inputMsg,
            recvID: this.selectInfo.id,
          }),
        )
        this.moeScroll()
      } catch (e) {
        console.error('发送消息失败:', e)
        if (this.selectInfo && this.selectInfo.msg) {
          this.selectInfo.msg.push({
            type: 'this',
            text: '(发送失败)' + (this.inputRedis[this.selectInfo.id] || ''),
            time: timestamp,
          })
        }
      }
    },
    async recvMsg() {
      if (this.$ws && this.$ws.ws) {
        this.isLoading = true; // 开始加载消息
        
        try {
          // 确保chatInfo[-1]存在
          if (this.chatInfo && this.chatInfo['-1']) {
            // 机器人默认在线,除非用户断开了与后台的连接
            this.chatInfo['-1']['online'] = true
          }
          
          let msgInfo = { type: 'token', _id: this.me ? this.me.id : null }
          this.$ws.ws.send(JSON.stringify(msgInfo))

          this.$ws.ws.onmessage = async res => {
            try {
              let data = JSON.parse(res.data)
              
              // 捕获系统消息并跳出
              if (data && data.type == 'system') {
                // 将匹配的内容结果传递给api,
                let info = await Application.getMsg(Utils.filterStr(data.content))
                if (this.chatInfo && this.chatInfo['-1'] && this.chatInfo['-1'].msg) {
                  this.chatInfo['-1'].msg.push({ type: 'sys', text: info.data, time: data.time })
                  this.moeScroll()
                }
                return
              }

              if (data && data.type == 'token') {
                // 检查是否有历史消息
                if (data.content && Array.isArray(data.content) && data.content.length > 0) {
                  this.hasHistoryMessages = true
                  
                  // 预处理数据以提高效率
                  const historyMessages = this.preprocessHistoryData(data.content);
                  
                  // 检查是否有与系统管理员(ID=13)的历史消息
                  this.hasSystemAdminMessage = historyMessages.some(
                    msg => msg && (msg.sendId === '13' || msg.recvId === '13')
                  );
                  
                  // 批量处理历史消息
                  if (data.readList) {
                    this.processHistoryMessages(historyMessages, data.readList);
                  }
                }

                // 如果有联系人ID，设置选中对话
                if (data.ContactID && data.ContactID != -1 && this.chatInfo && this.chatInfo[data.ContactID]) {
                  this.selectInfo = this.chatInfo[data.ContactID]
                  if (this.selectInfo) {
                    this.selectInfo.isRead = 1
                  }
                } else if (data.readList) {
                  try {
                    let readList = data.readList
                      .replace(/&/g, '')
                      .split('^')
                      .filter(item => item != '')
                    if (readList && readList.length && this.chatInfo && this.chatInfo[readList[0]]) {
                      this.selectInfo = this.chatInfo[readList[0]]
                      if (this.selectInfo && this.selectInfo.isRead === 0 && this.$ws && this.$ws.ws) {
                        this.$ws.ws.send(JSON.stringify({ type: 'state', readID: this.selectInfo.id }))
                        this.selectInfo.isRead = 1
                      }
                    }
                  } catch (e) {
                    console.error('处理readList出错:', e)
                  }
                }

                // 添加系统管理员对话（如果需要）
                this.addSystemAdminChat();
                
                // 默认选择对话
                if (!this.selectInfo || !this.selectInfo.id) {
                  if (this.chatInfo && this.chatInfo['-1']) {
                    this.selectInfo = this.chatInfo['-1']
                  }
                }

                // 心跳包
                if (this.chatInfo) {
                  this.hartCheck(this.chatInfo)
                  this.hart.timeObj = setInterval(() => {
                    this.hartCheck(this.chatInfo)
                  }, this.hart.timer * 1000)
                }
                
                this.isLoading = false; // 加载完成
              } else if (data && data.type == 'alone' && data.self) {
                // Skip messages from system admin for user 1
                if (data.self.id === 13 && this.me && this.me.id === 1) {
                  return
                }

                if (this.chatInfo && data.self && data.self.id && this.chatInfo[data.self.id]) {
                  this.chatInfo[data.self.id].msg.push({ type: 'target', text: data.content, time: data.time })
                  this.chatInfo[data.self.id].isRead = 0
                } else if (data.self && data.self.id) {
                  // 解决无法实时刷新dom
                  this.$set(this.chatInfo, data.self.id, {
                    id: data.self.id,
                    name: data.self.nickName || '',
                    type: 'user',
                    time: data.time,
                    icon: data.self.icon || '',
                    msg: [{ type: 'target', text: data.content || '', time: data.time }],
                    head: null,
                    isRead: 0,
                  })
                }
              } else if (data && data.type === 'ping') {
                this.hart.check = {}
                if (data.content && data.content.length) {
                  let info = data.content.split('|')
                  for (let i = 0; i < info.length - 1; i++) {
                    this.hart.check[info[i]] = true
                    if (this.chatInfo && info[i] && this.chatInfo[info[i]]) {
                      this.$set(this.chatInfo[info[i]], 'online', true)
                    }
                  }
                }
              }

              this.moeScroll()
            } catch (error) {
              console.error('处理websocket消息失败:', error)
            }
          }
        } catch (error) {
          console.error('接收消息时发生错误:', error);
          this.isLoading = false; // 确保在出错时也能重置加载状态
        }
      }
    },
    // 预处理历史数据以提高性能
    preprocessHistoryData(content) {
      if (!content || !Array.isArray(content)) {
        return [];
      }
      // 深拷贝避免影响原始数据
      try {
        return JSON.parse(JSON.stringify(content));
      } catch (e) {
        console.error('预处理历史数据失败:', e);
        return [];
      }
    },
    // 批量处理历史消息
    processHistoryMessages(messages, readList) {
      if (!messages || !Array.isArray(messages) || !readList) {
        console.error('处理历史消息失败: 无效的参数', { messages, readList });
        return;
      }
      
      // 优化：使用Map存储聊天信息，提高查找效率
      const chatMap = new Map();
      
      messages.forEach(item => {
        if (!item || !item.sendId || !item.recvId) {
          console.warn('无效的消息项', item);
          return;
        }
        
        let cls = item.recvId == (this.me ? this.me.id : null) ? 'target' : 'this'
        // 如果信息列表没有这个用户的数据
        let keyID = item.sendId

        // 如果发送者的id是当前用户, 那么将写入数据的key修改为接收者的key
        if (this.me && parseInt(this.me.id) == parseInt(keyID)) {
          keyID = item.recvId
        }

        // 跳过系统管理员消息（对用户ID为1的用户）
        if (keyID === '13' && this.me && this.me.id === 1) {
          return;
        }

        try {
          if (!chatMap.has(keyID)) {
            let name = '', icon = '';
            
            try {
              if (this.me && parseInt(this.me.id) == parseInt(item.sendId)) {
                const target = item.target ? JSON.parse(item.target) : {};
                name = target.name || '';
                icon = target.icon || '';
              } else {
                const self = item.self ? JSON.parse(item.self) : {};
                name = self.name || '';
                icon = self.icon || '';
              }
            } catch (e) {
              console.warn('解析消息元数据失败:', e);
            }
            
            chatMap.set(keyID, {
              messages: [],
              name: name,
              icon: icon
            });
          }
          
          chatMap.get(keyID).messages.push({
            type: cls, 
            text: item.content || '', 
            time: item.timestamp || formatTimestamp()
          });
        } catch (e) {
          console.error('处理消息时出错:', e);
        }
      });
      
      // 更新到Vue实例
      chatMap.forEach((value, keyID) => {
        if (this.chatInfo && this.chatInfo[keyID] && this.chatInfo[keyID]['msg']) {
          // 已存在的对话，追加消息
          value.messages.forEach(msg => {
            this.chatInfo[keyID]['msg'].push(msg);
          });
        } else if (keyID) {
          // 新建对话
          const isRead = readList.indexOf('^' + keyID + '&') != -1 ? 0 : 1;
          
          try {
            this.$set(
              this.chatInfo,
              keyID,
              this.packMsg(
                keyID, 
                value.name, 
                'alone', 
                value.messages[value.messages.length - 1].time, 
                value.icon, 
                value.messages, 
                'null', 
                isRead
              )
            );
          } catch (e) {
            console.error('创建对话失败:', e);
          }
        }
      });
      
      // 如果是用户1，删除系统管理员聊天
      if (this.me && this.me.id === 1 && this.chatInfo && this.chatInfo['13']) {
        delete this.chatInfo['13'];
      }
    },
    // 添加系统管理员对话（如果需要）
    addSystemAdminChat() {
      // 只有在以下条件下才添加系统管理员对话：
      // 1. 用户不是系统管理员或ID为1
      // 2. 没有与系统管理员的历史消息
      // 3. 没有历史消息或明确需要添加系统管理员对话
      if (!this.hasSystemAdminMessage && this.me && this.me.id !== 1 && this.me.id !== 13) {
        try {
          this.chatInfo['13'] = this.packMsg(
            '13',
            '系统管理员',
            'alone',
            formatTimestamp(),
            require('@/assets/image/user/Cat.png'),
            [{ type: 'target', text: '反馈请留言', time: formatTimestamp() }],
            '',
            1
          );
        } catch (e) {
          console.error('添加系统管理员对话失败:', e);
        }
      }
    },
    moeScroll(time = 200) {
      setTimeout(() => {
        var container = this.$el.querySelector('.content')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, time)
    },
    getBrowserType() {
      // 获取浏览器 userAgent
      var ua = navigator.userAgent
      // 是否为 Opera
      if (ua.indexOf('Opera') > -1) {
        return 'Opera'
      }

      // 是否为 IE
      var isIE = ua.indexOf('compatible') > -1 && ua.indexOf('MSIE') > -1 && ua.indexOf('Opera') === -1
      var isIE11 = ua.indexOf('Trident') > -1 && ua.indexOf('rv:11.0') > -1
      // 返回结果
      if (isIE11) {
        return 'IE11'
      } else if (isIE) {
        return 'IE'
      }
      // 是否为 Edge
      if (ua.indexOf('Edg') > -1) {
        return 'Edge'
      }
      // 是否为 Firefox
      if (ua.indexOf('Firefox') > -1) {
        return 'Firefox'
      }
      // 是否为 Safari
      if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') == -1) {
        return 'Safari'
      }
      // 是否为 Chrome
      if (ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1 && ua.indexOf('Edge') == -1) {
        return 'Chrome'
      }
      // 是否为 UC
      if (ua.indexOf('UBrowser') > -1) {
        return 'UC'
      }
      // 是否为 QQ
      if (ua.indexOf('QQBrowser') > -1) {
        return 'QQ'
      }
      // 都不是
      return '未知设备'
    },
    // 封装信息体
    packMsg(id, name, type, time, icon, msg, header = null, isRead = 0) {
      return {
        id: id,
        name: name || '',
        type: type || '',
        time: time || formatTimestamp(),
        icon: icon == null ? this.defaultImg : icon,
        msg: Array.isArray(msg) ? msg : [],
        header: header,
        isRead: isRead,
      }
    },
    // 心跳包检测
    hartCheck(friends) {
      // 如果与服务器的连接断开了
      if (!this.$ws || !this.$ws.ws || this.$ws.ws.readyState === this.$ws.ws.CLOSED) {
        this.$message.warning('聊天服务器已断开')
        if (this.hart.timeObj) {
          clearInterval(this.hart.timeObj)
        }
        // 将所有用户设为离线
        for (let i in this.chatInfo) {
          if (this.chatInfo[i]) {
            this.chatInfo[i]['online'] = false
          }
        }
        return
      }

      let friends_list = ''
      for (const iterator in friends) {
        if (parseInt(iterator) > 0) {
          if (!this.hart.check[iterator]) {
            this.$set(friends[iterator], 'online', false)
          }
          friends_list += iterator + '|'
        }
      }
      this.$ws.ws.send(JSON.stringify({ type: this.hart.type, friends_list }))
    },
  },
  async mounted() {
    try {
      this.me = store.getters.user
      if (this.me) {
        this.token_msg = {
          id: this.me.id,
          name: this.me.name || '',
          icon: this.me.acatar || '',
          msg: [],
          header: 'null',
          isRead: 1,
          type: 'contact',
          time: formatTimestamp(),
        }
      }

      // 默认AI聊天机器人信息
      this.chatInfo['-1'] = this.packMsg(
        '-1',
        '在线直聘智能机',
        'sys',
        formatTimestamp(),
        require('@/assets/image/user/Cat.png'),
        [
          {
            type: 'sys',
            text:
              "\
           <div class='sys-msg'>\
        <h2>登录操作通知</h2>\
        <div class='describe'>[" +
            this.me.nickname +
            "]欢迎回来蜗牛兼职平台</div>\
        <div class='info'>\
          <div>\
            <span>设备/平台</span>\
            <span>" +
            this.getBrowserType() +
            '浏览器</span>\
          </div>\
          <div>\
            <span>登录方式</span>\
            <span>普通登录</span>\
          </div>\
          <div>\
            <span>当前时间</span>\
            <span>' +
            formatTimestamp() +
            '</span>\
          </div>\
          <div>\
            <span></span>\
            <span>如有疑问,可以对我说噢!</span>\
          </div>\
        </div>\
      </div>\
    ',
          time: formatTimestamp(),
        },
      ],
      '登录操作通知',
      1,
    )

      // 连接到服务器并接收消息
      if (this.$ws && this.$ws.ws && this.$ws.ws.readyState == 1) {
        await this.recvMsg()
      }
    } catch (e) {
      console.error('mounted出错:', e)
    }
  },
  beforeDestroy() {
    if (this.wsCtl.timer) {
      clearTimeout(this.wsCtl.timer)
    }
    if (this.hart.timeObj) {
      clearInterval(this.hart.timeObj)
    }
  },
}
</script>

<style lang="scss" scoped>
.ws-msg-form {
  width: 800px;
  height: 700px;

  img {
    user-select: none;
    pointer-events: none;
    border: 1px solid #ffffff;
  }
}

.msg-content {
  margin-left: 10px;
  display: inline-block;
  width: 100%;
  height: 80%;
  border: 1px solid rgb(143, 141, 141);
  background-color: transparent !important;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.msg-title {
  position: absolute;
  top: 0;
  text-align: center;
  width: 100%;
  background-color: rgba(39, 39, 39, 0.219);
  height: 30px;
  line-height: 30px;
}

.msg-content .left {
  margin-top: 30px;
  width: 200px;
  height: 95%;
  border-right: 1px solid rgb(143, 141, 141);
  overflow: auto;
  overflow-x: hidden;
  display: inline-block;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-button {
    display: none;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(124, 124, 124, 0.438);
    border-radius: 5px;
  }

  .item {
    position: relative;
    height: 78px;
    padding-left: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: rgba(146, 146, 146, 0.3);
    }

    .icon {
      width: 40px !important;
      height: 40px !important;
      border-radius: 40px;
    }

    div {
      position: absolute;
      top: 20px;
      left: 65px;
      font-size: 14px;
    }

    .msg {
      top: 45px;
      font-size: 12px;
      color: rgb(114, 114, 114);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 130px;
    }

    .newTip,
    .online {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: red;
      border-radius: 10px;
      position: absolute;
      left: 10px;
      top: 20px;
    }

    .online {
      background-color: greenyellow;
      top: 50px;
      left: 20px;
    }

    .chat-time {
      display: inline-block;
      font-size: 13px;
      position: absolute;
      right: 5px;
      top: 5px;
      opacity: 0.7;
    }
  }
}

.timestamp {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 8px 0 2px 0;
  padding: 0 5px;
  clear: both;
  width: 100%;
}

/* 调整消息项间距以容纳时间戳 */
.msg-item {
  width: 100%;
  margin: 5px 0;
  position: relative;
  transition: all 0.5s;
  clear: both;
}

.msg-content .right {
  display: inline-block !important;
  height: 94% !important;
  width: 600px !important;
  position: absolute !important;
  margin-top: 30px;

  .form {
    position: relative;
    height: 100%;
    width: 100%;

    .content {
      height: 385px;
      overflow: auto;
      padding: 0 10px;
      background-color: rgba(0, 0, 0, 0.03) !important;

      &::-webkit-scrollbar {
        overflow-y: hidden;
      }

      .msg-item {
        width: 100%;
        margin: 10px 0;
        position: relative;
        transition: all 0.5s;

        > div img {
          display: inline-block;
          width: 35px;
          height: 35px;
        }

        span {
          display: inline-block;
          background: white;
          padding: 10px 15px;
          font-size: 15px;
          max-width: 350px;
          margin: 10px 0;
          word-break: break-word;
        }

        .tip {
          width: 400px;
          height: 260px;
          border-radius: 10px;
          background-color: white;
          margin-left: 60px;
        }

        .sys,
        .target {
          float: left;
          margin-left: 10px;
          width: 100%;

          span {
            border-radius: 20px;
            border-top-left-radius: 0;
            margin-left: 35px;
          }

          img {
            position: absolute;
            left: 0;
          }
        }

        .this {
          position: relative;
          float: right;
          width: 100%;

          span {
            float: right;
            background-color: rgb(128, 185, 242);
            margin-right: 45px;
            color: white;
            border-radius: 20px;
            border-top-right-radius: 0;
          }

          img {
            position: absolute;
            right: 0;
          }
        }

        .birth-anim {
          animation-name: birth;
          animation-duration: 0.5s;
          animation-iteration-count: 1;
        }

        // 样式穿透
        ::v-deep .sys-msg {
          > * {
            margin: 15px 0;
            color: #505050;
            font-size: 15px;
          }

          h2 {
            font-weight: 700;
            font-size: 18px;
          }

          .info {
            width: 400px;

            span {
              display: inline-block;
              margin-bottom: 10px;
            }

            span:nth-child(1) {
              width: 100px !important;
              opacity: 0.7;
            }
          }
        }

        @keyframes birth {
          0% {
            transform: translatey(50px);
          }

          100% {
            transform: translatey(0px);
          }
        }
      }
    }
  }

  .msg-footer {
    position: relative;
    border-top: 1px solid rgb(143, 141, 141);

    textarea {
      resize: none;
      outline: none;
      width: 100%;
      height: 100px;
      border: none;
    }

    .send {
      position: absolute;
      right: 10px;
    }
  }
}

.select-style {
  background-color: rgba(146, 146, 146, 0.3);
}

.rou-btn {
  margin-top: 5px;
  display: inline-block;
  border: 1px solid cornflowerblue;
  color: cornflowerblue;
  border-radius: 5px;
  padding: 3px 5px;

  &:hover {
    border: 1px solid teal;
    color: teal;
  }
}
</style>